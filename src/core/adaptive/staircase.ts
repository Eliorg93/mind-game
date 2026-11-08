/**
 * Difficulty adaptation shared by all games (part 1: aim for roughly 80% success,
 * step up gently after success, step down right after a struggle).
 *
 * Pure functions, no storage or UI, so every game and future platform can reuse it.
 */
export interface LevelRange {
  min: number;
  max: number;
  start: number;
}

export interface SessionOutcome {
  /** 0..1 share of successful attempts in the session. */
  accuracy: number;
  completed: boolean;
}

export const STEP_UP_AT = 0.8;
export const STEP_DOWN_BELOW = 0.55;

export function clampLevel(level: number, range: LevelRange): number {
  return Math.min(range.max, Math.max(range.min, Math.round(level)));
}

export function nextLevel(current: number, outcome: SessionOutcome, range: LevelRange): number {
  if (!outcome.completed) return clampLevel(current - 1, range); // stopped early: make the next one easier
  if (outcome.accuracy >= STEP_UP_AT) return clampLevel(current + 1, range);
  if (outcome.accuracy < STEP_DOWN_BELOW) return clampLevel(current - 1, range);
  return clampLevel(current, range);
}
