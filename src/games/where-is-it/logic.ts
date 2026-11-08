/**
 * Game 5 – where did I put it: objects are placed around a room; then, one by
 * one, the player shows where each object was. Pure, serializable state.
 */
import { PLACEABLE_OBJECTS, SPOT_IDS, type ObjectId, type SpotId } from '@/content/he/objects';
import { byLevel, pick, sample, shuffle, type Rng } from '../kit/random';
import { averageCredit, type ItemOutcome } from '../kit/scoring';

export const SPOTS_BY_LEVEL = [4, 6, 6, 9, 9, 12] as const;
export const OBJECTS_BY_LEVEL = [2, 3, 4, 4, 5, 6] as const;
export const ROUNDS = 3;

export interface Placement {
  obj: ObjectId;
  spot: SpotId;
}

export interface WhereRound {
  spots: SpotId[];
  placements: Placement[];
  /** Order in which objects are asked about (indexes into placements). */
  order: number[];
  ask: number;
  wrong: SpotId[];
  narrowed: SpotId[] | null;
  current: ItemOutcome;
  outcomes: ItemOutcome[];
}

export interface WhereState {
  kind: 'where';
  phase: 'study' | 'recall' | 'review' | 'done';
  level: number;
  roundIndex: number;
  rounds: number;
  usedObjects: ObjectId[];
  round: WhereRound;
  credits: number[];
  stats?: { items: number; hints: number; wrongTries: number }[];
}

function makeRound(level: number, used: ObjectId[], rng: Rng): WhereRound {
  const spots = sample(SPOT_IDS, byLevel(SPOTS_BY_LEVEL, level), rng);
  const n = byLevel(OBJECTS_BY_LEVEL, level);
  const freshObjects = PLACEABLE_OBJECTS.filter((o) => !used.includes(o));
  const objects = sample(freshObjects.length >= n ? freshObjects : PLACEABLE_OBJECTS, n, rng);
  const chosenSpots = sample(spots, n, rng);
  const placements = objects.map((obj, i) => ({ obj, spot: chosenSpots[i] as SpotId }));
  return { spots, placements, order: shuffle(placements.map((_, i) => i), rng), ask: 0, wrong: [], narrowed: null, current: { wrongTries: 0, hinted: false }, outcomes: [] };
}

export function newWhere(level: number, rng: Rng = Math.random): WhereState {
  const round = makeRound(level, [], rng);
  return { kind: 'where', phase: 'study', level, roundIndex: 0, rounds: ROUNDS, usedObjects: round.placements.map((p) => p.obj), round, credits: [] };
}

export function currentPlacement(s: WhereState): Placement | undefined {
  const idx = s.round.order[s.round.ask];
  return idx === undefined ? undefined : s.round.placements[idx];
}

export function startRecall(s: WhereState): WhereState {
  return s.phase === 'study' ? { ...s, phase: 'recall' } : s;
}

export type GuessOutcome = 'correct' | 'wrong' | 'ignored';

export function guess(s: WhereState, spot: SpotId): { state: WhereState; outcome: GuessOutcome; placement?: Placement } {
  const p = currentPlacement(s);
  const r = s.round;
  if (s.phase !== 'recall' || !p || r.wrong.includes(spot) || !r.spots.includes(spot)) return { state: s, outcome: 'ignored' };
  if (r.narrowed && !r.narrowed.includes(spot)) return { state: s, outcome: 'ignored' };
  if (spot !== p.spot) {
    return { state: { ...s, round: { ...r, wrong: [...r.wrong, spot], current: { ...r.current, wrongTries: r.current.wrongTries + 1 } } }, outcome: 'wrong', placement: p };
  }
  const outcomes = [...r.outcomes, r.current];
  const ask = r.ask + 1;
  const done = ask >= r.placements.length;
  let next: WhereState = { ...s, round: { ...r, ask, wrong: [], narrowed: null, current: { wrongTries: 0, hinted: false }, outcomes } };
  if (done) {
    const credits = s.credits.slice();
    credits[s.roundIndex] = averageCredit(outcomes);
    const stats = (s.stats ?? []).slice();
    stats[s.roundIndex] = { items: outcomes.length, hints: outcomes.filter((o) => o.hinted).length, wrongTries: outcomes.reduce((n, o) => n + o.wrongTries, 0) };
    next = { ...next, phase: 'review', credits, stats };
  }
  return { state: next, outcome: 'correct', placement: p };
}

/** Narrows the choice to two places: the right one and one other. */
export function hint(s: WhereState, rng: Rng = Math.random): WhereState {
  const p = currentPlacement(s);
  const r = s.round;
  if (s.phase !== 'recall' || !p || r.narrowed) return s;
  const others = r.spots.filter((sp) => sp !== p.spot && !r.wrong.includes(sp));
  const narrowed = shuffle([p.spot, ...(others.length ? [pick(others, rng)] : [])], rng);
  return { ...s, round: { ...r, narrowed, current: { ...r.current, hinted: true } } };
}

/** Objects already found in this round (shown back in their places). */
export function foundPlacements(s: WhereState): Placement[] {
  return s.round.order.slice(0, s.round.ask).map((i) => s.round.placements[i] as Placement);
}

export function retryRound(s: WhereState, rng: Rng = Math.random): WhereState {
  const r = s.round;
  return { ...s, phase: 'study', round: { ...r, order: shuffle(r.order, rng), ask: 0, wrong: [], narrowed: null, current: { wrongTries: 0, hinted: false }, outcomes: [] } };
}

export function nextRound(s: WhereState, rng: Rng = Math.random): WhereState {
  if (s.roundIndex + 1 >= s.rounds) return { ...s, phase: 'done' };
  const round = makeRound(s.level, s.usedObjects, rng);
  return { ...s, phase: 'study', roundIndex: s.roundIndex + 1, round, usedObjects: [...s.usedObjects, ...round.placements.map((p) => p.obj)] };
}

export function firstTryCount(s: WhereState): number {
  return s.round.outcomes.filter((o) => o.wrongTries === 0 && !o.hinted).length;
}

export function sessionAccuracy(s: WhereState): number {
  const c = s.credits.filter((x) => typeof x === 'number');
  return c.length ? c.reduce((a, b) => a + b, 0) / c.length : 0;
}

export function isWhereState(x: unknown): x is WhereState {
  if (!x || typeof x !== 'object') return false;
  const s = x as WhereState;
  return s.kind === 'where' && !!s.round && Array.isArray(s.round.placements) && s.round.placements.every((p) => PLACEABLE_OBJECTS.includes(p.obj) && SPOT_IDS.includes(p.spot));
}

export function whereStats(s: WhereState) {
  return (s.stats ?? []).filter(Boolean).reduce((a, b) => ({ items: a.items + b.items, hints: a.hints + b.hints, wrongTries: a.wrongTries + b.wrongTries }), { items: 0, hints: 0, wrongTries: 0 });
}
