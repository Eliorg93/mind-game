import { decide, PROFILES, signal, smoothed, VERY_HARD, type ActivityStats } from '@/core/adaptive/personalization';
import { destroyDB } from '@/core/storage/db';
import { resetKeyCache } from '@/core/storage/crypto';
import { getLevel, listSessions, recordSession, respondToAdaptation, setLevel } from '@/core/storage/progress';
import { getGameMeta } from '@/core/games/catalog';

const range = { min: 1, max: 6, start: 1 };
const a = (level: number, accuracy: number, extra: Partial<ActivityStats> = {}): ActivityStats => ({ level, accuracy, completed: true, items: 6, hints: 0, wrongTries: 0, ...extra });

describe('personal adaptation engine', () => {
  it('caps the signal when most items needed a hint', () => {
    expect(signal(a(2, 0.9, { hints: 4 }))).toBe(0.7);
    expect(signal(a(2, 0.9, { hints: 1 }))).toBe(0.9);
  });

  it('weights recent activities more than older ones', () => {
    expect(smoothed([a(2, 1), a(2, 0)])).toBeCloseTo(0.5 / 0.8);
  });

  it('balanced: steps up after two strong activities in a row, one level at a time', () => {
    expect(decide([a(2, 0.95)], range, 'balanced')).toMatchObject({ change: 'same', reason: 'steady' });
    const d = decide([a(2, 0.95), a(2, 0.9)], range, 'balanced');
    expect(d).toMatchObject({ from: 2, to: 3, change: 'up', reason: 'thriving', offer: null });
  });

  it('challenging: steps up after one strong activity', () => {
    expect(decide([a(2, 0.75)], range, 'challenging')).toMatchObject({ to: 3, change: 'up' });
  });

  it('calm: never steps up on its own, it offers a challenge instead (respecting a cooldown)', () => {
    const h = [a(2, 0.95), a(2, 0.95)];
    expect(decide(h, range, 'calm')).toMatchObject({ to: 2, change: 'same', reason: 'thriving', offer: 'challenge' });
    expect(decide(h, range, 'calm', 2).offer).toBeNull();
  });

  it('eases after a run of hard activities, gradually', () => {
    const d = decide([a(4, 0.5), a(4, 0.5)], range, 'balanced');
    expect(d).toMatchObject({ from: 4, to: 3, change: 'down', reason: 'struggling' });
  });

  it('one harder activity after good ones does not drop the level', () => {
    expect(decide([a(3, 0.5), a(3, 1), a(3, 1)], range, 'balanced').change).toBe('same');
  });

  it('eases immediately after a very hard activity, in every style', () => {
    for (const style of ['calm', 'balanced', 'challenging'] as const) {
      expect(decide([a(3, VERY_HARD - 0.01), a(3, 1), a(3, 1)], range, style)).toMatchObject({ to: 2, reason: 'veryHard' });
    }
  });

  it('at the easiest level it suggests hints rather than going lower', () => {
    expect(decide([a(1, 0.2)], range, 'balanced')).toMatchObject({ to: 1, change: 'same', offer: 'hints' });
  });

  it('does not step up from mostly-hinted success', () => {
    expect(decide([a(2, 0.95, { hints: 5 }), a(2, 0.95, { hints: 5 })], range, 'challenging').change).toBe('same');
  });

  it('suggests hints when many tries were needed and no hint was used', () => {
    expect(decide([a(2, 0.7, { wrongTries: 4 })], range, 'balanced').offer).toBe('hints');
  });

  it('only counts activities at the current level', () => {
    // two strong activities, but at another level: not yet a streak here
    expect(decide([a(3, 0.95), a(2, 0.95)], range, 'balanced').change).toBe('same');
  });

  it('never moves outside the game range and never more than one step', () => {
    for (let lvl = 1; lvl <= 6; lvl++) {
      for (const acc of [0, 0.3, 0.6, 0.85, 1]) {
        for (const style of ['calm', 'balanced', 'challenging'] as const) {
          const d = decide([a(lvl, acc), a(lvl, acc), a(lvl, acc)], range, style);
          expect(Math.abs(d.to - d.from)).toBeLessThanOrEqual(1);
          expect(d.to).toBeGreaterThanOrEqual(1);
          expect(d.to).toBeLessThanOrEqual(6);
        }
      }
    }
  });

  it('profiles go from gentle to brisk', () => {
    expect(PROFILES.calm.up).toBeGreaterThan(PROFILES.balanced.up);
    expect(PROFILES.balanced.up).toBeGreaterThan(PROFILES.challenging.up);
    expect(PROFILES.calm.hintOfferAfter).toBeLessThan(PROFILES.challenging.hintOfferAfter);
  });
});

describe('adaptation with storage', () => {
  const meta = getGameMeta('word-garden')!;
  beforeEach(async () => {
    await destroyDB();
    resetKeyCache();
  });

  it('uses the game history across activities and stores the decision', async () => {
    await setLevel(meta, 2);
    const s1 = await recordSession(meta, { startedAt: 1, endedAt: 1000, level: 2, result: { accuracy: 0.95, completed: true, items: 6, hints: 0, wrongTries: 0 }, style: 'balanced' });
    expect(s1.adapt).toMatchObject({ change: 'same' });
    const s2 = await recordSession(meta, { startedAt: 2000, endedAt: 3000, level: 2, result: { accuracy: 0.9, completed: true, items: 6, hints: 0, wrongTries: 1 }, style: 'balanced' });
    expect(s2.adapt).toMatchObject({ from: 2, to: 3, change: 'up' });
    expect(await getLevel(meta)).toBe(3);
    expect((await listSessions()).at(-1)?.hints).toBe(0);
  });

  it('calm: accepting the offered challenge raises the level; declining keeps it and pauses offers', async () => {
    await setLevel(meta, 2);
    await recordSession(meta, { startedAt: 1, endedAt: 1000, level: 2, result: { accuracy: 1, completed: true }, style: 'calm' });
    const s = await recordSession(meta, { startedAt: 2000, endedAt: 3000, level: 2, result: { accuracy: 1, completed: true }, style: 'calm' });
    expect(s.adapt?.offer).toBe('challenge');
    expect(await respondToAdaptation(meta, s.id, 'declined', 'calm')).toBe(2);
    const s3 = await recordSession(meta, { startedAt: 4000, endedAt: 5000, level: 2, result: { accuracy: 1, completed: true }, style: 'calm' });
    expect(s3.adapt?.offer).toBeNull(); // cooling down after "no thanks"
    expect(await respondToAdaptation(meta, s3.id, 'accepted', 'calm')).toBe(3);
  });

  it('"keep my level" undoes an automatic easing', async () => {
    await setLevel(meta, 3);
    const s = await recordSession(meta, { startedAt: 1, endedAt: 1000, level: 3, result: { accuracy: 0.2, completed: true }, style: 'balanced' });
    expect(s.adapt).toMatchObject({ to: 2, change: 'down' });
    expect(await respondToAdaptation(meta, s.id, 'kept', 'balanced')).toBe(3);
  });
});
