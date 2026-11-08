import { accuracy, closeOpen, columnsFor, flip, isDone, isValidState, newGame, pairsForLevel } from './logic';

function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe('memory pairs logic', () => {
  it('maps levels to pairs and clamps', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(pairsForLevel)).toEqual([2, 2, 3, 4, 6, 8, 8]);
    expect(columnsFor(4)).toBe(2);
    expect(columnsFor(6)).toBe(3);
    expect(columnsFor(16)).toBe(4);
  });

  it('deals each chosen item exactly twice', () => {
    const s = newGame(3, seeded(7));
    expect(s.deck).toHaveLength(8);
    const counts = s.deck.reduce<Record<string, number>>((m, d) => ({ ...m, [d]: (m[d] ?? 0) + 1 }), {});
    expect(Object.values(counts).every((c) => c === 2)).toBe(true);
  });

  it('plays a perfect game to completion with accuracy 1', () => {
    let s = newGame(2, seeded(3));
    const seen = new Set<number>();
    for (let i = 0; i < s.deck.length; i++) {
      if (seen.has(i)) continue;
      const j = s.deck.findIndex((d, k) => k !== i && d === s.deck[i]);
      seen.add(i).add(j);
      s = flip(s, i).state;
      const r = flip(s, j);
      expect(r.outcome).toBe('match');
      s = r.state;
    }
    expect(isDone(s)).toBe(true);
    expect(accuracy(s)).toBe(1);
  });

  it('handles a miss, then blocks a third card until cards close', () => {
    let s = newGame(1, seeded(5));
    const a = 0;
    const b = s.deck.findIndex((d) => d !== s.deck[a]);
    s = flip(s, a).state;
    const miss = flip(s, b);
    expect(miss.outcome).toBe('miss');
    const third = s.deck.findIndex((_, k) => k !== a && k !== b);
    expect(flip(miss.state, third).outcome).toBe('ignored');
    s = closeOpen(miss.state);
    expect(s.open).toEqual([]);
    expect(s.attempts).toBe(1);
    expect(accuracy(s)).toBe(0);
  });

  it('ignores taps on face-up cards and out of range', () => {
    let s = newGame(1, seeded(9));
    s = flip(s, 0).state;
    expect(flip(s, 0).outcome).toBe('ignored');
    expect(flip(s, 99).outcome).toBe('ignored');
  });

  it('validates saved state', () => {
    expect(isValidState(newGame(1))).toBe(true);
    expect(isValidState({ deck: ['bomb', 'bomb', 'x', 'x'], open: [], matched: [], attempts: 0 })).toBe(false);
    expect(isValidState(null)).toBe(false);
  });
});
