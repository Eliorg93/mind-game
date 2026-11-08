import { nextLevel, clampLevel } from '../adaptive/staircase';
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
 * Records a finished session, adapts the level for next time and clears any
 * saved mid-game state. Returns the stored session.
 */
export async function recordSession(
  meta: GameMeta,
  args: { startedAt: number; endedAt?: number; level: number; result: GameResult },
): Promise<SessionRecord> {
  const endedAt = args.endedAt ?? Date.now();
  const session: SessionRecord = {
    id: newId(),
    gameId: meta.id,
    startedAt: args.startedAt,
    endedAt,
    durationMs: Math.max(0, endedAt - args.startedAt),
    level: args.level,
    accuracy: Math.max(0, Math.min(1, args.result.accuracy)),
    plantKind: meta.plant,
  };
  const db = await getDB();
  const tx = db.transaction(['sessions', 'progress'], 'readwrite');
  const prev = await tx.objectStore('progress').get(meta.id);
  const progress: ProgressRecord = {
    gameId: meta.id,
    level: nextLevel(args.level, args.result, meta.levels),
    sessions: (prev?.sessions ?? 0) + 1,
    updatedAt: endedAt,
  };
  await Promise.all([tx.objectStore('sessions').put(session), tx.objectStore('progress').put(progress), tx.done]);
  await kvDelete(resumeKey(meta.id));
  return session;
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
