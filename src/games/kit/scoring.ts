/**
 * Shared scoring. Used only to adapt difficulty (part 1): it is never shown as a
 * grade. Hints and retries are welcome; they just count a little less.
 */
export interface ItemOutcome {
  wrongTries: number;
  hinted: boolean;
}

export function itemCredit(o: ItemOutcome): number {
  if (o.wrongTries === 0 && !o.hinted) return 1;
  if (o.wrongTries === 0 || (o.wrongTries === 1 && !o.hinted)) return 0.5;
  return 0.25;
}

export function averageCredit(items: ItemOutcome[]): number {
  if (items.length === 0) return 0;
  return items.reduce((s, o) => s + itemCredit(o), 0) / items.length;
}

/** For "select everything you saw" rounds: hits count, wrong picks subtract, hints halve. */
export function selectionCredit(args: { targets: number; hits: number; falseAlarms: number; hinted: number }): number {
  if (args.targets === 0) return 0;
  const earned = args.hits - args.hinted * 0.5 - args.falseAlarms * 0.5;
  return Math.max(0, Math.min(1, earned / args.targets));
}
