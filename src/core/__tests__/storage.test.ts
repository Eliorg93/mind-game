import { destroyDB, getDB } from '@/core/storage/db';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, sanitizeSettings, applySettingsToDocument } from '@/core/settings/settings';
import { getLevel, listSessions, loadResume, recordSession, saveResume } from '@/core/storage/progress';
import { addMemory, deleteMemory, getMemory, listMemories, MemoryValidationError } from '@/core/memories/memories';
import { deleteAllData, exportData } from '@/core/storage/dataControl';
import { resetKeyCache } from '@/core/storage/crypto';
import { getGameMeta } from '@/core/games/catalog';

const meta = getGameMeta('memory-pairs')!;

beforeEach(async () => {
  await destroyDB();
  resetKeyCache();
  localStorage.clear();
});

describe('settings persistence', () => {
  it('returns defaults, then persists changes', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
    await saveSettings({ ...DEFAULT_SETTINGS, textSize: 'xlarge', highContrast: true, address: 'male' });
    const s = await loadSettings();
    expect(s.textSize).toBe('xlarge');
    expect(s.highContrast).toBe(true);
    expect(s.address).toBe('male');
    expect(JSON.parse(localStorage.getItem('mg.settings.fast')!).textSize).toBe('xlarge');
  });
  it('rejects malformed values', () => {
    expect(sanitizeSettings({ textSize: 'huge', sound: 'yes', address: 'x' })).toEqual(DEFAULT_SETTINGS);
  });
  it('reflects settings on the document', () => {
    applySettingsToDocument({ ...DEFAULT_SETTINGS, textSize: 'xlarge', highContrast: true, reduceMotion: true });
    const el = document.documentElement;
    expect(el.dataset.textSize).toBe('xlarge');
    expect(el.dataset.contrast).toBe('high');
    expect(el.dataset.motion).toBe('reduce');
    expect(el.dir).toBe('rtl');
    expect(el.lang).toBe('he');
  });
});

describe('progress and sessions', () => {
  it('starts at the start level and adapts after a session', async () => {
    expect(await getLevel(meta)).toBe(1);
    await recordSession(meta, { startedAt: Date.now() - 120_000, level: 1, result: { accuracy: 1, completed: true } });
    expect(await getLevel(meta)).toBe(2);
    const sessions = await listSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.plantKind).toBe('lavender');
    expect(sessions[0]!.durationMs).toBeGreaterThanOrEqual(120_000);
  });
  it('saves mid-game state and clears it when the session is recorded', async () => {
    await saveResume({ gameId: meta.id, level: 2, startedAt: 1, savedAt: 2, state: { x: 1 } });
    expect((await loadResume(meta.id))?.state).toEqual({ x: 1 });
    await recordSession(meta, { startedAt: 1, level: 2, result: { accuracy: 0.7, completed: true } });
    expect(await loadResume(meta.id)).toBeUndefined();
  });
});

describe('memories (encrypted)', () => {
  it('round-trips text, and stores only ciphertext', async () => {
    const id = await addMemory({ title: 'המטבח של סבתא', body: 'ריח של עוגת שמרים' });
    const m = await getMemory(id);
    expect(m?.title).toBe('המטבח של סבתא');
    expect(m?.body).toBe('ריח של עוגת שמרים');
    const raw = await (await getDB()).get('memories', id);
    const rawText = new TextDecoder().decode(new Uint8Array(raw!.payload.data));
    expect(rawText).not.toContain('סבתא');
    expect(JSON.stringify(raw)).not.toContain('סבתא');
  });
  it('stores and returns a photo', async () => {
    const photo = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/png' });
    const id = await addMemory({ title: 'טיול', body: '', photo });
    const m = await getMemory(id);
    expect(m?.kind).toBe('photo');
    expect(m?.photo?.type).toBe('image/png');
    expect(new Uint8Array(await m!.photo!.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 4]));
  });
  it('validates input', async () => {
    await expect(addMemory({ title: '  ', body: '' })).rejects.toBeInstanceOf(MemoryValidationError);
    await expect(addMemory({ title: 'x', body: '', photo: new Blob(['x'], { type: 'text/html' }) })).rejects.toMatchObject({ code: 'photoType' });
  });
  it('lists newest first and deletes', async () => {
    await addMemory({ title: 'ראשון', body: '' }, 1000);
    const id2 = await addMemory({ title: 'שני', body: '' }, 2000);
    expect((await listMemories()).map((m) => m.title)).toEqual(['שני', 'ראשון']);
    await deleteMemory(id2);
    expect(await listMemories()).toHaveLength(1);
  });
});

describe('data control', () => {
  it('exports readable data and deletes everything', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, textSize: 'normal' });
    await addMemory({ title: 'זיכרון', body: 'גוף' });
    await recordSession(meta, { startedAt: 1, level: 1, result: { accuracy: 1, completed: true } });
    const json = JSON.parse(await exportData());
    expect(json.memories[0].title).toBe('זיכרון');
    expect(json.sessions).toHaveLength(1);
    await deleteAllData();
    expect(await listMemories()).toHaveLength(0);
    expect(await listSessions()).toHaveLength(0);
    expect((await loadSettings()).textSize).toBe(DEFAULT_SETTINGS.textSize);
  });
});
