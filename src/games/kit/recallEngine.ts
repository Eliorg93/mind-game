/**
 * Shared logic for "look, hide, pick what you saw" games
 * (picture recall and the shopping list). Pure and serializable, so a game can
 * be left in the middle and resumed exactly where it was.
 */
import { byLevel, sample, shuffle, type Rng } from './random';
import { selectionCredit } from './scoring';

export interface RoundStats { items: number; hints: number; wrongTries: number }

export interface RecallConfig {
  pool: readonly string[];
  targetsByLevel: readonly number[];
  choicesByLevel: readonly number[];
  rounds: number;
  /** Picks distractors; defaults to random items from the pool. */
  distractors?: (targets: string[], pool: readonly string[], n: number, rng: Rng) => string[];
}

export interface RecallRound {
  targets: string[];
  choices: string[];
  selected: string[];
  hinted: string[];
  attempts: number;
}

export interface RecallState {
  kind: 'recall';
  phase: 'study' | 'recall' | 'review' | 'done';
  level: number;
  roundIndex: number;
  rounds: number;
  used: string[];
  round: RecallRound;
  credits: number[];
  /** Per-round stats, used only for gentle personalization. */
  stats?: RoundStats[];
}

function makeRound(cfg: RecallConfig, level: number, used: string[], rng: Rng): RecallRound {
  const k = byLevel(cfg.targetsByLevel, level);
  const total = Math.max(k + 1, byLevel(cfg.choicesByLevel, level));
  const fresh = cfg.pool.filter((p) => !used.includes(p));
  const source = fresh.length >= k ? fresh : cfg.pool;
  const targets = sample(source, k, rng);
  const rest = cfg.pool.filter((p) => !targets.includes(p));
  const distractors = (cfg.distractors ?? ((_t, pool, n, r) => sample(pool, n, r)))(targets, rest, total - k, rng).slice(0, total - k);
  return { targets, choices: shuffle([...targets, ...distractors], rng), selected: [], hinted: [], attempts: 1 };
}

export function newRecall(cfg: RecallConfig, level: number, rng: Rng = Math.random): RecallState {
  const round = makeRound(cfg, level, [], rng);
  return { kind: 'recall', phase: 'study', level, roundIndex: 0, rounds: cfg.rounds, used: [...round.targets], round, credits: [] };
}

export function startRecall(s: RecallState): RecallState {
  return s.phase === 'study' ? { ...s, phase: 'recall' } : s;
}

export type ToggleOutcome = 'added' | 'removed' | 'full' | 'ignored';

export function toggle(s: RecallState, id: string): { state: RecallState; outcome: ToggleOutcome } {
  const r = s.round;
  if (s.phase !== 'recall' || !r.choices.includes(id)) return { state: s, outcome: 'ignored' };
  if (r.selected.includes(id)) {
    if (r.hinted.includes(id)) return { state: s, outcome: 'ignored' }; // a revealed item stays
    return { state: { ...s, round: { ...r, selected: r.selected.filter((x) => x !== id) } }, outcome: 'removed' };
  }
  if (r.selected.length >= r.targets.length) return { state: s, outcome: 'full' };
  return { state: { ...s, round: { ...r, selected: [...r.selected, id] } }, outcome: 'added' };
}

/** Reveals one target that is not selected yet. If the selection is full, frees one wrong pick first. */
export function hint(s: RecallState): { state: RecallState; revealed: string | null } {
  const r = s.round;
  if (s.phase !== 'recall') return { state: s, revealed: null };
  const target = r.choices.find((c) => r.targets.includes(c) && !r.selected.includes(c));
  if (!target) return { state: s, revealed: null };
  let selected = r.selected;
  if (selected.length >= r.targets.length) {
    const wrong = selected.find((x) => !r.targets.includes(x));
    selected = selected.filter((x) => x !== wrong);
  }
  return { state: { ...s, round: { ...r, selected: [...selected, target], hinted: [...r.hinted, target] } }, revealed: target };
}

export function roundResult(r: RecallRound) {
  const hits = r.selected.filter((x) => r.targets.includes(x)).length;
  const falseAlarms = r.selected.filter((x) => !r.targets.includes(x)).length;
  return { hits, falseAlarms, misses: r.targets.length - hits, total: r.targets.length, hinted: r.hinted.length };
}

export function check(s: RecallState): RecallState {
  if (s.phase !== 'recall' || s.round.selected.length === 0) return s;
  const res = roundResult(s.round);
  const credits = s.credits.slice();
  credits[s.roundIndex] = selectionCredit({ targets: res.total, hits: res.hits, falseAlarms: res.falseAlarms, hinted: res.hinted });
  const stats = (s.stats ?? []).slice();
  stats[s.roundIndex] = { items: res.total, hints: res.hinted, wrongTries: res.falseAlarms };
  return { ...s, phase: 'review', credits, stats };
}

/** Same items again, freshly shuffled, back to the study step. */
export function retryRound(s: RecallState, rng: Rng = Math.random): RecallState {
  const r = s.round;
  return { ...s, phase: 'study', round: { ...r, choices: shuffle(r.choices, rng), selected: [], hinted: [], attempts: r.attempts + 1 } };
}

export function nextRound(cfg: RecallConfig, s: RecallState, rng: Rng = Math.random): RecallState {
  if (s.roundIndex + 1 >= s.rounds) return { ...s, phase: 'done' };
  const round = makeRound(cfg, s.level, s.used, rng);
  return { ...s, phase: 'study', roundIndex: s.roundIndex + 1, round, used: [...s.used, ...round.targets] };
}

export function sessionAccuracy(s: RecallState): number {
  const c = s.credits.filter((x) => typeof x === 'number');
  return c.length ? c.reduce((a, b) => a + b, 0) / c.length : 0;
}

export function isRecallState(x: unknown, pool: readonly string[]): x is RecallState {
  if (!x || typeof x !== 'object') return false;
  const s = x as RecallState;
  return s.kind === 'recall' && !!s.round && Array.isArray(s.round.targets) && s.round.targets.every((t) => pool.includes(t)) && s.round.choices.every((t) => pool.includes(t));
}

export function recallStats(s: RecallState): RoundStats {
  return (s.stats ?? []).filter(Boolean).reduce((a, b) => ({ items: a.items + b.items, hints: a.hints + b.hints, wrongTries: a.wrongTries + b.wrongTries }), { items: 0, hints: 0, wrongTries: 0 });
}
