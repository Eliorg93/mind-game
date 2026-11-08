/**
 * Read-aloud using the device's own speech engine (Web Speech API). No network.
 * Quality depends on the Hebrew voice installed on the phone.
 */
export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

function hebrewVoice(): SpeechSynthesisVoice | undefined {
  try {
    return window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('he'));
  } catch {
    return undefined;
  }
}

export function hasHebrewVoice(): boolean {
  return speechSupported() && !!hebrewVoice();
}

export function speak(text: string, opts: { onEnd?: () => void; rate?: number } = {}): boolean {
  if (!speechSupported()) return false;
  const s = window.speechSynthesis;
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'he-IL';
  u.rate = opts.rate ?? 0.9;
  const v = hebrewVoice();
  if (v) u.voice = v;
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  s.speak(u);
  return true;
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}
