import type { SessionRecord } from '../storage/db';
import type { PlantKind } from '../games/types';
import { dayKey, lastDays } from '../time/time';

export interface Plant {
  id: string;
  kind: PlantKind;
  plantedAt: number;
  /** A plant blooms for three days after it was planted, then stays green. */
  blooming: boolean;
}

export interface DayMark {
  ts: number;
  practiced: boolean;
  isToday: boolean;
}

export interface GardenState {
  plants: Plant[];
  totalPlants: number;
  bloomingCount: number;
  last7: DayMark[];
  practicedDaysLast7: number;
}

const BLOOM_MS = 3 * 86_400_000;

/**
 * The garden is derived from completed sessions: one plant per finished activity.
 * Nothing is ever taken away; a day without practice simply adds nothing.
 */
export function deriveGarden(sessions: SessionRecord[], now: number): GardenState {
  const plants: Plant[] = sessions
    .slice()
    .sort((a, b) => a.endedAt - b.endedAt)
    .map((s) => ({ id: s.id, kind: (s.plantKind as PlantKind) ?? 'fern', plantedAt: s.endedAt, blooming: now - s.endedAt < BLOOM_MS }));

  const practiced = new Set(sessions.map((s) => dayKey(s.endedAt)));
  const todayKey = dayKey(now);
  const last7 = lastDays(7, now).map((ts) => ({ ts, practiced: practiced.has(dayKey(ts)), isToday: dayKey(ts) === todayKey }));

  return {
    plants,
    totalPlants: plants.length,
    bloomingCount: plants.filter((p) => p.blooming).length,
    last7,
    practicedDaysLast7: last7.filter((d) => d.practiced).length,
  };
}
