import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * Local database (IndexedDB). All user data stays on the device.
 * Bump DB_VERSION and add a step in `upgrade` for every schema change.
 */
export const DB_NAME = 'mind-garden';
export const DB_VERSION = 1;

export interface EncryptedBlob {
  iv: Uint8Array;
  data: ArrayBuffer;
}

export interface SessionRecord {
  id: string;
  gameId: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  level: number;
  accuracy: number; // 0..1, used only for difficulty adaptation, never shown as a score
  plantKind: string;
  items?: number;
  hints?: number;
  wrongTries?: number;
  /** The adaptation decision made after this activity, and the player's answer to any offer. */
  adapt?: {
    from: number;
    to: number;
    change: 'up' | 'down' | 'same';
    reason: string;
    offer: 'challenge' | 'hints' | null;
    response?: 'accepted' | 'declined' | 'kept';
  };
}

export interface ProgressRecord {
  gameId: string;
  level: number;
  sessions: number;
  updatedAt: number;
  /** Activities to wait before offering a challenge again (after "no thanks"). */
  offerCooldown?: number;
}

export interface MemoryRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  kind: 'text' | 'photo';
  /** Title, body and photo bytes are encrypted together. */
  payload: EncryptedBlob;
}

export interface MindGardenDB extends DBSchema {
  kv: { key: string; value: unknown };
  sessions: { key: string; value: SessionRecord; indexes: { byEndedAt: number; byGame: string } };
  progress: { key: string; value: ProgressRecord };
  memories: { key: string; value: MemoryRecord; indexes: { byCreatedAt: number } };
  keys: { key: string; value: CryptoKey };
}

let dbPromise: Promise<IDBPDatabase<MindGardenDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<MindGardenDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MindGardenDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('kv');
          const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
          sessions.createIndex('byEndedAt', 'endedAt');
          sessions.createIndex('byGame', 'gameId');
          db.createObjectStore('progress', { keyPath: 'gameId' });
          const memories = db.createObjectStore('memories', { keyPath: 'id' });
          memories.createIndex('byCreatedAt', 'createdAt');
          db.createObjectStore('keys');
        }
      },
      blocked() {
        // Another tab holds an older version open; it will reload on versionchange.
      },
    }).then((db) => {
      db.addEventListener('versionchange', () => {
        db.close();
        location.reload();
      });
      return db;
    });
  }
  return dbPromise;
}

/** Test helper and "delete all my data": closes and removes the database. */
export async function destroyDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  return (await (await getDB()).get('kv', key)) as T | undefined;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  await (await getDB()).put('kv', value, key);
}

export async function kvDelete(key: string): Promise<void> {
  await (await getDB()).delete('kv', key);
}

export function newId(): string {
  return crypto.randomUUID();
}

/**
 * Ask the browser not to evict our data under storage pressure.
 * Installed (home-screen) apps are usually granted this automatically.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
