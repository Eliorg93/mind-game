import { listMemories } from '../memories/memories';
import { clearFastSettings, loadSettings } from '../settings/settings';
import { resetKeyCache } from './crypto';
import { destroyDB } from './db';
import { listSessions } from './progress';

/** Export of the user's data as readable JSON (photos are listed, not embedded). */
export async function exportData(): Promise<string> {
  const [settings, sessions, memories] = await Promise.all([loadSettings(), listSessions(), listMemories()]);
  return JSON.stringify(
    {
      app: 'MIND GARDEN',
      exportedAt: new Date().toISOString(),
      settings,
      sessions: sessions.map(({ gameId, startedAt, endedAt, durationMs, level }) => ({ gameId, startedAt, endedAt, durationMs, level })),
      memories: memories.map(({ title, body, kind, createdAt }) => ({ title, body, kind, createdAt })),
    },
    null,
    2,
  );
}

/** Deletes everything this app stored on the device, including the encryption key. */
export async function deleteAllData(): Promise<void> {
  await destroyDB();
  resetKeyCache();
  clearFastSettings();
  try {
    localStorage.removeItem('mg.onboarded');
  } catch {
    /* ignore */
  }
}
