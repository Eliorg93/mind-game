import { kvGet, kvSet } from '../storage/db';

export type TextSize = 'normal' | 'large' | 'xlarge';
export type Address = 'female' | 'male' | 'neutral';
import type { ChallengeStyle } from '../adaptive/personalization';
export type { ChallengeStyle };

export interface Settings {
  textSize: TextSize;
  highContrast: boolean;
  sound: boolean;
  autoReadInstructions: boolean;
  reduceMotion: boolean;
  address: Address;
  /** How quickly games become more challenging (part 5). */
  challenge: ChallengeStyle;
  language: 'he';
}

export const DEFAULT_SETTINGS: Settings = {
  textSize: 'large',
  highContrast: false,
  sound: true,
  autoReadInstructions: false,
  reduceMotion: false,
  address: 'female', // decided in part 1: the first user is a woman; changeable in settings
  challenge: 'balanced',
  language: 'he',
};

const KV_KEY = 'settings';
/** A tiny mirror in localStorage lets the first paint use the right text size and contrast. */
const FAST_KEY = 'mg.settings.fast';

export function sanitizeSettings(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return s;
  const r = raw as Record<string, unknown>;
  if (r.textSize === 'normal' || r.textSize === 'large' || r.textSize === 'xlarge') s.textSize = r.textSize;
  if (typeof r.highContrast === 'boolean') s.highContrast = r.highContrast;
  if (typeof r.sound === 'boolean') s.sound = r.sound;
  if (typeof r.autoReadInstructions === 'boolean') s.autoReadInstructions = r.autoReadInstructions;
  if (typeof r.reduceMotion === 'boolean') s.reduceMotion = r.reduceMotion;
  if (r.address === 'female' || r.address === 'male' || r.address === 'neutral') s.address = r.address;
  if (r.challenge === 'calm' || r.challenge === 'balanced' || r.challenge === 'challenging') s.challenge = r.challenge;
  return s;
}

export function readFastSettings(): Settings {
  try {
    const raw = localStorage.getItem(FAST_KEY);
    const base = raw ? sanitizeSettings(JSON.parse(raw)) : { ...DEFAULT_SETTINGS };
    if (!raw && typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      base.reduceMotion = true;
    }
    return base;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function loadSettings(): Promise<Settings> {
  const stored = await kvGet<unknown>(KV_KEY);
  return stored ? sanitizeSettings(stored) : readFastSettings();
}

export async function saveSettings(settings: Settings): Promise<void> {
  const clean = sanitizeSettings(settings);
  await kvSet(KV_KEY, clean);
  try {
    localStorage.setItem(FAST_KEY, JSON.stringify(clean));
  } catch {
    /* private mode: the IndexedDB copy is the source of truth */
  }
}

export function clearFastSettings(): void {
  try {
    localStorage.removeItem(FAST_KEY);
  } catch {
    /* ignore */
  }
}

/** Reflects settings on <html> so CSS can react (text size, contrast, motion). */
export function applySettingsToDocument(s: Settings, doc: Document = document): void {
  const el = doc.documentElement;
  el.dataset.textSize = s.textSize;
  el.dataset.contrast = s.highContrast ? 'high' : 'normal';
  el.dataset.motion = s.reduceMotion ? 'reduce' : 'full';
  el.lang = s.language;
  el.dir = 'rtl';
}
