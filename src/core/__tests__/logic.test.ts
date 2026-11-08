import { nextLevel } from '@/core/adaptive/staircase';
import { buildRoutine, nextInRoutine, routineMinutes } from '@/core/routine/routine';
import { deriveGarden } from '@/core/garden/garden';
import { CATALOG, availableGames } from '@/core/games/catalog';
import type { SessionRecord } from '@/core/storage/db';
import type { GameMeta } from '@/core/games/types';

const range = { min: 1, max: 5, start: 1 };
const DAY = 86_400_000;
const now = new Date('2026-11-09T10:00:00').getTime();
const session = (gameId: string, endedAt: number, plantKind = 'tulip'): SessionRecord => ({ id: `${gameId}-${endedAt}`, gameId, startedAt: endedAt - 60_000, endedAt, durationMs: 60_000, level: 1, accuracy: 1, plantKind });

describe('staircase', () => {
  it('steps up after strong success, never above max', () => {
    expect(nextLevel(2, { accuracy: 0.9, completed: true }, range)).toBe(3);
    expect(nextLevel(5, { accuracy: 1, completed: true }, range)).toBe(5);
  });
  it('holds in the comfortable band', () => {
    expect(nextLevel(3, { accuracy: 0.7, completed: true }, range)).toBe(3);
  });
  it('steps down after a struggle or early stop, never below min', () => {
    expect(nextLevel(3, { accuracy: 0.4, completed: true }, range)).toBe(2);
    expect(nextLevel(3, { accuracy: 1, completed: false }, range)).toBe(2);
    expect(nextLevel(1, { accuracy: 0.1, completed: true }, range)).toBe(1);
  });
});

describe('routine', () => {
  const games: GameMeta[] = CATALOG.map((g) => ({ ...g, status: 'available' }));
  it('picks three games from different domains, deterministic per day', () => {
    const r = buildRoutine(games, [], now);
    expect(r).toHaveLength(3);
    const domains = r.map((i) => games.find((g) => g.id === i.gameId)!.domains[0]);
    expect(new Set(domains).size).toBe(3);
    expect(buildRoutine(games, [], now)).toEqual(r);
  });
  it('marks games done today and finds the next one', () => {
    const r0 = buildRoutine(games, [], now);
    const r = buildRoutine(games, [session(r0[0]!.gameId, now - 1000)], now);
    expect(r[0]!.done).toBe(true);
    expect(nextInRoutine(r)?.gameId).toBe(r0[1]!.gameId);
  });
  it('does not count yesterday as done', () => {
    const r0 = buildRoutine(games, [], now);
    const r = buildRoutine(games, [session(r0[0]!.gameId, now - DAY)], now);
    expect(r.every((i) => !i.done)).toBe(true);
  });
  it('works with the single available game in phase one', () => {
    const r = buildRoutine(availableGames(), [], now);
    expect(r.map((i) => i.gameId)).toEqual(['memory-pairs']);
    expect(routineMinutes(r, availableGames())).toBe(4);
  });
});

describe('garden', () => {
  it('derives one plant per session, blooming for three days', () => {
    const g = deriveGarden([session('a', now - 1000), session('b', now - 5 * DAY, 'sunflower')], now);
    expect(g.totalPlants).toBe(2);
    expect(g.bloomingCount).toBe(1);
    expect(g.plants[0]!.kind).toBe('sunflower');
  });
  it('builds the last seven days ending today', () => {
    const g = deriveGarden([session('a', now), session('a', now - 2 * DAY), session('a', now - 2 * DAY + 1000), session('a', now - 9 * DAY)], now);
    expect(g.last7).toHaveLength(7);
    expect(g.last7[6]!.isToday).toBe(true);
    expect(g.practicedDaysLast7).toBe(2);
  });
  it('is empty and calm with no sessions', () => {
    const g = deriveGarden([], now);
    expect(g.totalPlants).toBe(0);
    expect(g.practicedDaysLast7).toBe(0);
  });
});
