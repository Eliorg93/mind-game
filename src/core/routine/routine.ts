import type { SessionRecord } from '../storage/db';
import type { GameMeta } from '../games/types';
import { dayKey } from '../time/time';

export interface RoutineItem {
  gameId: string;
  done: boolean;
}

export const ROUTINE_SIZE = 3;

/**
 * Today's routine: up to three available games from different domains,
 * rotated by date so the order changes from day to day. Deterministic, so the
 * same day always yields the same routine.
 */
export function buildRoutine(games: GameMeta[], sessions: SessionRecord[], now: number): RoutineItem[] {
  if (games.length === 0) return [];
  const today = dayKey(now);
  const dayIndex = Math.floor(new Date(today).getTime() / 86_400_000);
  const offset = dayIndex % games.length;
  const rotated = games.slice(offset).concat(games.slice(0, offset));

  const picked: GameMeta[] = [];
  const usedDomains = new Set<string>();
  for (const g of rotated) {
    if (picked.length >= ROUTINE_SIZE) break;
    const main = g.domains[0] ?? g.id;
    if (!usedDomains.has(main)) {
      picked.push(g);
      usedDomains.add(main);
    }
  }
  for (const g of rotated) {
    if (picked.length >= ROUTINE_SIZE) break;
    if (!picked.includes(g)) picked.push(g);
  }

  const doneToday = new Set(sessions.filter((s) => dayKey(s.endedAt) === today).map((s) => s.gameId));
  return picked.map((g) => ({ gameId: g.id, done: doneToday.has(g.id) }));
}

export function nextInRoutine(routine: RoutineItem[]): RoutineItem | undefined {
  return routine.find((r) => !r.done);
}

export function routineMinutes(routine: RoutineItem[], games: GameMeta[]): number {
  return routine.reduce((sum, r) => sum + (games.find((g) => g.id === r.gameId)?.minutes ?? 0), 0);
}
