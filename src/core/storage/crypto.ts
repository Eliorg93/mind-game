import { getDB, type EncryptedBlob } from './db';

/**
 * Encryption at rest for the most sensitive data (personal memories).
 *
 * An AES-GCM 256 key is generated on the device as NON-EXTRACTABLE and stored in
 * IndexedDB. Scripts can use it but never read its bytes, and the data on disk is
 * ciphertext. Honest limit: someone with full control of the unlocked phone and
 * browser profile can still ask the browser to decrypt, so this protects against
 * casual inspection of stored files and backups, not against a compromised device.
 */
const KEY_ID = 'memories-v1';

let keyPromise: Promise<CryptoKey> | null = null;

async function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = (async () => {
      const db = await getDB();
      const existing = await db.get('keys', KEY_ID);
      if (existing) return existing;
      const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      await db.put('keys', key, KEY_ID);
      return key;
    })();
  }
  return keyPromise;
}

export function resetKeyCache(): void {
  keyPromise = null;
}

export async function encryptBytes(plain: ArrayBuffer | Uint8Array): Promise<EncryptedBlob> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain as BufferSource);
  return { iv, data };
}

export async function decryptBytes(blob: EncryptedBlob): Promise<ArrayBuffer> {
  const key = await getKey();
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: blob.iv as BufferSource }, key, blob.data);
}

export async function encryptJSON(value: unknown): Promise<EncryptedBlob> {
  return encryptBytes(new TextEncoder().encode(JSON.stringify(value)));
}

export async function decryptJSON<T>(blob: EncryptedBlob): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await decryptBytes(blob))) as T;
}
