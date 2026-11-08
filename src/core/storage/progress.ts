import { clampLevel } from '../adaptive/staircase';
import { decide, PROFILES, type ActivityStats, type ChallengeStyle } from '../adaptive/personalization';
import type { GameMeta, GameResult } from '../games/types';
import { getDB, kvDelete, kvGet, kvSet, newId, type ProgressRecord, type SessionRecord } from './db';

const resumeKey = (gameId: string) => `resume:${gameId}`;

export async function getLevel(meta: GameMeta): Promise<number> {
  const rec = await (await getDB()).get('progress', meta.id);
  return clampLevel(rec?.level ?? meta.levels.start, meta.levels);
}

/** Manual level change (from the instructions screen). */
export async function setLevel(meta: GameMeta, level: number): Promise<number> {
  const db = await getDB();
  const prev = await db.get('progress', meta.id);
  const next: ProgressRecord = { gameId: meta.id, level: clampLevel(level, meta.levels), sessions: prev?.sessions ?? 0, updatedAt: Date.now() };
  await db.put('progress', next);
  return next.level;
}

/**
 * Records a finished activity, asks the personal adaptation engine for the next
 * level (using this game's recent activities), and clears any saved mid-game state.
 */
export async function recordSession(
  meta: GameMeta,
  args: { startedAt: number; endedAt?: number; level: number; result: GameResult; style?: ChallengeStyle },
): Promise<SessionRecord> {
  const endedAt = args.endedAt ?? Date.now();
  const style = args.style ?? 'balanced';
  const db = await getDB();
  const previous = (await db.getAllFromIndex('sessions', 'byGame', meta.id)).sort((a, b) => b.endedAt - a.endedAt);
  const prev = await db.get('progress', meta.id);
  const current: ActivityStats = {
    level: args.level,
    accuracy: Math.max(0, Math.min(1, args.result.accuracy)),
    completed: args.result.completed,
    items: args.result.items,
    hints: args.result.hints,
    wrongTries: args.result.wrongTries,
  };
  const history: ActivityStats[] = [current, ...previous.map((s) => ({ level: s.level, accuracy: s.accuracy, completed: true, items: s.items, hints: s.hints, wrongTries: s.wrongTries }))];
  const decision = decide(history, meta.levels, style, prev?.offerCooldown ?? 0);

  const session: SessionRecord = {
    id: newId(),
    gameId: meta.id,
    startedAt: args.startedAt,
    endedAt,
    durationMs: Math.max(0, endedAt - args.startedAt),
    level: args.level,
    accuracy: current.accuracy,
    plantKind: meta.plant,
    items: current.items,
    hints: current.hints,
    wrongTries: current.wrongTries,
    adapt: { ...decision },
  };
  const progress: ProgressRecord = {
    gameId: meta.id,
    level: decision.to,
    sessions: (prev?.sessions ?? 0) + 1,
    updatedAt: endedAt,
    offerCooldown: Math.max(0, (prev?.offerCooldown ?? 0) - 1),
  };
  const tx = db.transaction(['sessions', 'progress'], 'readwrite');
  await Promise.all([tx.objectStore('sessions').put(session), tx.objectStore('progress').put(progress), tx.done]);
  await kvDelete(resumeKey(meta.id));
  return session;
}

/**
 * The player's answer to the suggestion shown after an activity.
 *  - accept:  take the offered challenge (one level up).
 *  - decline: stay at this level; don't offer again for a few activities.
 *  - keep:    undo an automatic change and stay at the previous level.
 */
export async function respondToAdaptation(meta: GameMeta, sessionId: string, response: 'accepted' | 'declined' | 'kept', style: ChallengeStyle = 'balanced'): Promise<number> {
  const db = await getDB();
  const session = await db.get('sessions', sessionId);
  const prog = await db.get('progress', meta.id);
  if (!session?.adapt || !prog) return prog?.level ?? meta.levels.start;
  let level = prog.level;
  let offerCooldown = prog.offerCooldown ?? 0;
  if (response === 'accepted') level = clampLevel(session.adapt.from + 1, meta.levels);
  if (response === 'kept') level = clampLevel(session.adapt.from, meta.levels);
  if (response === 'declined' || (response === 'kept' && session.adapt.change === 'up')) offerCooldown = PROFILES[style].offerCooldown;
  const tx = db.transaction(['sessions', 'progress'], 'readwrite');
  await Promise.all([
    tx.objectStore('sessions').put({ ...session, adapt: { ...session.adapt, response } }),
    tx.objectStore('progress').put({ ...prog, level, offerCooldown, updatedAt: Date.now() }),
    tx.done,
  ]);
  return level;
}

export async function listSessions(): Promise<SessionRecord[]> {
  return (await getDB()).getAllFromIndex('sessions', 'byEndedAt');
}

export async function getSession(id: string): Promise<SessionRecord | undefined> {
  return (await getDB()).get('sessions', id);
}

/** Mid-game state, saved on every move so leaving a game never loses anything. */
export interface ResumeState<S = unknown> {
  gameId: string;
  level: number;
  startedAt: number;
  savedAt: number;
  state: S;
}

export async function saveResume<S>(r: ResumeState<S>): Promise<void> {
  await kvSet(resumeKey(r.gameId), r);
}

export async function loadResume<S>(gameId: string): Promise<ResumeState<S> | undefined> {
  return kvGet<ResumeState<S>>(resumeKey(gameId));
}

export async function clearResume(gameId: string): Promise<void> {
  await kvDelete(resumeKey(gameId));
}
