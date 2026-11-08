/** Randomness helpers with an injectable source, so game logic is testable. */
export type Rng = () => number;

export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

export function sample<T>(arr: readonly T[], n: number, rng: Rng = Math.random): T[] {
  return shuffle(arr, rng).slice(0, Math.max(0, n));
}

export function pick<T>(arr: readonly T[], rng: Rng = Math.random): T {
  return arr[Math.floor(rng() * arr.length)] as T;
}

export function randInt(min: number, max: number, rng: Rng = Math.random): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Deterministic generator for tests (Park–Miller). */
export function seeded(seed = 1): Rng {
  let s = seed % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Level → value from a table, clamped to its ends. */
export function byLevel<T>(table: readonly T[], level: number): T {
  const i = Math.min(table.length, Math.max(1, Math.round(level))) - 1;
  return table[i] as T;
}
