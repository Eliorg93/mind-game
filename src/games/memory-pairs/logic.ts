/**
 * Pure game logic for the memory-pairs game. No UI, fully unit-tested.
 */
export const ITEMS = ['tulip', 'sunflower', 'leaf', 'lavender', 'daisy', 'cherry', 'mushroom', 'pinecone'] as const;
export type Item = (typeof ITEMS)[number];

/** Level 1..5 → number of pairs. */
export const PAIRS_BY_LEVEL = [2, 3, 4, 6, 8] as const;

export interface PairsState {
  deck: Item[];
  open: number[];
  matched: Item[];
  attempts: number;
}

export function pairsForLevel(level: number): number {
  const i = Math.min(PAIRS_BY_LEVEL.length, Math.max(1, Math.round(level))) - 1;
  return PAIRS_BY_LEVEL[i] ?? 2;
}

export function columnsFor(cards: number): number {
  if (cards <= 4) return 2;
  if (cards <= 6) return 3;
  return 4;
}

/** Fisher–Yates with an injectable random source (deterministic in tests). */
export function shuffle<T>(arr: T[], random: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

export function newGame(level: number, random: () => number = Math.random): PairsState {
  const n = pairsForLevel(level);
  const chosen = shuffle([...ITEMS], random).slice(0, n);
  return { deck: shuffle([...chosen, ...chosen], random), open: [], matched: [], attempts: 0 };
}

export function isFaceUp(s: PairsState, i: number): boolean {
  const item = s.deck[i];
  return s.open.includes(i) || (item !== undefined && s.matched.includes(item));
}

export type FlipOutcome = 'ignored' | 'first' | 'match' | 'miss';

/** Flip card i. Returns the new state and what happened. */
export function flip(s: PairsState, i: number): { state: PairsState; outcome: FlipOutcome } {
  if (i < 0 || i >= s.deck.length || s.open.length >= 2 || isFaceUp(s, i)) return { state: s, outcome: 'ignored' };
  const open = [...s.open, i];
  if (open.length === 1) return { state: { ...s, open }, outcome: 'first' };
  const [a, b] = open as [number, number];
  const attempts = s.attempts + 1;
  if (s.deck[a] === s.deck[b]) {
    return { state: { ...s, open: [], matched: [...s.matched, s.deck[a] as Item], attempts }, outcome: 'match' };
  }
  return { state: { ...s, open, attempts }, outcome: 'miss' };
}

/** After a miss, the two cards are shown briefly and then turned back. */
export function closeOpen(s: PairsState): PairsState {
  return { ...s, open: [] };
}

export function isDone(s: PairsState): boolean {
  return s.matched.length * 2 === s.deck.length;
}

/** Share of attempts that found a pair (perfect play = 1). */
export function accuracy(s: PairsState): number {
  return s.attempts === 0 ? 0 : s.matched.length / s.attempts;
}

/** Validates saved state before resuming (it may come from an older version). */
export function isValidState(x: unknown): x is PairsState {
  if (!x || typeof x !== 'object') return false;
  const s = x as PairsState;
  return Array.isArray(s.deck) && s.deck.length >= 4 && s.deck.every((d) => (ITEMS as readonly string[]).includes(d)) && Array.isArray(s.matched) && Array.isArray(s.open) && typeof s.attempts === 'number';
}
