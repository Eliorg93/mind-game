/**
 * Personal adaptation engine.
 *
 * Goal: keep each game comfortable and engaging at the player's own pace.
 * It looks at several recent activities (not one), and at how much help was
 * needed: correct answers, extra tries and hints. The player's chosen style
 * (calm / balanced / challenging) sets how cautious the changes are.
 *
 * Ethical limits (part 1 and part 5):
 *  - This is a game-difficulty setting only. It never estimates memory or
 *    cognition, never produces a score or a trend for display, and never
 *    turns a hard session into a statement about the person.
 *  - Changes are gradual: at most one level per activity.
 *  - Easing is automatic and always reversible; stepping up is offered (calm)
 *    or applied gently (balanced / challenging) and can be declined.
 *
 * Pure functions: no storage, no UI.
 */
import { clampLevel, type LevelRange } from './staircase';

export type ChallengeStyle = 'calm' | 'balanced' | 'challenging';

export interface Profile {
  /** Smoothed success at or above this counts as "going well". */
  up: number;
  /** Smoothed success below this counts as "too hard right now". */
  down: number;
  /** How many good activities in a row (at the same level) before stepping up. */
  upStreak: number;
  /** Step up automatically, or only offer it. */
  autoUp: boolean;
  /** In-game: offer a hint after this many wrong tries on one item. */
  hintOfferAfter: number;
  /** Activities to wait before offering a challenge again after a "no thanks". */
  offerCooldown: number;
}

export const PROFILES: Record<ChallengeStyle, Profile> = {
  calm: { up: 0.9, down: 0.65, upStreak: 2, autoUp: false, hintOfferAfter: 1, offerCooldown: 4 },
  balanced: { up: 0.8, down: 0.55, upStreak: 2, autoUp: true, hintOfferAfter: 2, offerCooldown: 3 },
  challenging: { up: 0.7, down: 0.45, upStreak: 1, autoUp: true, hintOfferAfter: 3, offerCooldown: 2 },
};

/** What a game reports about one activity. */
export interface ActivityStats {
  level: number;
  /** 0..1, already gives partial credit for hints and extra tries. */
  accuracy: number;
  completed: boolean;
  items?: number;
  hints?: number;
  wrongTries?: number;
}

export type Reason = 'thriving' | 'steady' | 'struggling' | 'veryHard' | 'stoppedEarly';
export type Offer = 'challenge' | 'hints' | null;

export interface Decision {
  from: number;
  to: number;
  change: 'up' | 'down' | 'same';
  reason: Reason;
  /** A suggestion to show the player (never a judgement). */
  offer: Offer;
}

/** Below this in a single activity we ease right away, whatever the style. */
export const VERY_HARD = 0.35;
const WEIGHTS = [0.5, 0.3, 0.2];

/**
 * Success signal for one activity. Heavy reliance on hints caps it, so we
 * don't step up on activities that were mostly solved with help.
 */
export function signal(a: ActivityStats): number {
  const acc = Math.max(0, Math.min(1, a.accuracy));
  const items = a.items ?? 0;
  if (items > 0 && (a.hints ?? 0) / items > 0.5) return Math.min(acc, 0.7);
  return acc;
}

/** Weighted average of the most recent activities (newest first). */
export function smoothed(recentNewestFirst: ActivityStats[]): number {
  const xs = recentNewestFirst.slice(0, WEIGHTS.length);
  if (xs.length === 0) return 0;
  let sum = 0;
  let w = 0;
  xs.forEach((a, i) => {
    sum += signal(a) * (WEIGHTS[i] ?? 0);
    w += WEIGHTS[i] ?? 0;
  });
  return sum / w;
}

/**
 * Decide the level for next time.
 * @param history this game's activities, newest first; history[0] is the one just finished.
 * @param cooldown activities left before a declined challenge offer may be shown again.
 */
export function decide(history: ActivityStats[], range: LevelRange, style: ChallengeStyle, cooldown = 0): Decision {
  const p = PROFILES[style];
  const last = history[0];
  if (!last) return { from: range.start, to: range.start, change: 'same', reason: 'steady', offer: null };
  const from = clampLevel(last.level, range);
  const make = (to: number, reason: Reason, offer: Offer = null): Decision => {
    const t = clampLevel(to, range);
    return { from, to: t, change: t > from ? 'up' : t < from ? 'down' : 'same', reason, offer };
  };

  if (!last.completed) return make(from - 1, 'stoppedEarly');

  const now = signal(last);
  if (now < VERY_HARD) return make(from - 1, 'veryHard', from <= range.min ? 'hints' : null);

  // Only activities at the current level say something about this level.
  const atLevel = history.filter((a) => clampLevel(a.level, range) === from);
  const avg = smoothed(atLevel);

  if (avg < p.down) {
    const usedFewHints = (last.hints ?? 0) === 0;
    if (from <= range.min) return make(from, 'struggling', usedFewHints ? 'hints' : null);
    return make(from - 1, 'struggling');
  }

  let streak = 0;
  for (const a of atLevel) {
    if (signal(a) >= p.up) streak++;
    else break;
  }
  if (streak >= p.upStreak && avg >= p.up && from < range.max) {
    if (p.autoUp) return make(from + 1, 'thriving');
    return make(from, 'thriving', cooldown > 0 ? null : 'challenge');
  }

  const hintsHelpful = (last.hints ?? 0) === 0 && (last.wrongTries ?? 0) >= Math.max(2, (last.items ?? 0) / 2);
  return make(from, 'steady', hintsHelpful ? 'hints' : null);
}
