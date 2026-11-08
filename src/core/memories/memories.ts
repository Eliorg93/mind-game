import { decryptBytes, decryptJSON, encryptBytes, encryptJSON } from '../storage/crypto';
import { getDB, newId, type MemoryRecord } from '../storage/db';

export interface Memory {
  id: string;
  kind: 'text' | 'photo';
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  /** Present for photo memories, decrypted on demand. */
  photo?: Blob;
}

interface Payload {
  title: string;
  body: string;
  photoType?: string;
  /** Photo bytes are encrypted separately and stored base64-free as a second blob. */
}

interface StoredPayload {
  meta: Payload;
}

export const MAX_TITLE = 80;
export const MAX_BODY = 4000;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export class MemoryValidationError extends Error {
  constructor(public readonly code: 'titleRequired' | 'titleTooLong' | 'bodyTooLong' | 'photoTooBig' | 'photoType') {
    super(code);
  }
}

function validate(title: string, body: string, photo?: Blob): void {
  if (!title.trim()) throw new MemoryValidationError('titleRequired');
  if (title.length > MAX_TITLE) throw new MemoryValidationError('titleTooLong');
  if (body.length > MAX_BODY) throw new MemoryValidationError('bodyTooLong');
  if (photo) {
    if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/.test(photo.type)) throw new MemoryValidationError('photoType');
    if (photo.size > MAX_PHOTO_BYTES) throw new MemoryValidationError('photoTooBig');
  }
}

/** Stored record: payload = encrypted {meta}; photo bytes encrypted into `photo` field. */
type StoredMemory = MemoryRecord & { photo?: MemoryRecord['payload'] };

export async function addMemory(input: { title: string; body: string; photo?: Blob }, now = Date.now()): Promise<string> {
  validate(input.title, input.body, input.photo);
  const meta: Payload = { title: input.title.trim(), body: input.body.trim(), photoType: input.photo?.type };
  const record: StoredMemory = {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    kind: input.photo ? 'photo' : 'text',
    payload: await encryptJSON({ meta } satisfies StoredPayload),
  };
  if (input.photo) record.photo = await encryptBytes(await input.photo.arrayBuffer());
  await (await getDB()).put('memories', record);
  return record.id;
}

async function decode(rec: StoredMemory, withPhoto: boolean): Promise<Memory> {
  const { meta } = await decryptJSON<StoredPayload>(rec.payload);
  const m: Memory = { id: rec.id, kind: rec.kind, title: meta.title, body: meta.body, createdAt: rec.createdAt, updatedAt: rec.updatedAt };
  if (withPhoto && rec.photo) m.photo = new Blob([await decryptBytes(rec.photo)], { type: meta.photoType ?? 'image/jpeg' });
  return m;
}

/** Newest first. Photos are not decrypted here to keep the list fast. */
export async function listMemories(): Promise<Memory[]> {
  const all = (await (await getDB()).getAllFromIndex('memories', 'byCreatedAt')) as StoredMemory[];
  const decoded = await Promise.all(all.map((r) => decode(r, false)));
  return decoded.reverse();
}

export async function getMemory(id: string): Promise<Memory | undefined> {
  const rec = (await (await getDB()).get('memories', id)) as StoredMemory | undefined;
  return rec ? decode(rec, true) : undefined;
}

export async function deleteMemory(id: string): Promise<void> {
  await (await getDB()).delete('memories', id);
}

/** Daily prompt rotates by date; prompts live in the locale file (memories.prompts.N). */
export function promptIndexForDay(now: number, count: number): number {
  const day = Math.floor((now - new Date(now).getTimezoneOffset() * 60_000) / 86_400_000);
  return ((day % count) + count) % count;
}
