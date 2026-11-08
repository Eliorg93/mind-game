/**
 * Soft feedback tones synthesized with Web Audio: no audio files to download,
 * works offline. Called only when the "sounds" setting is on.
 */
type Tone = 'tap' | 'match' | 'complete';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

const NOTES: Record<Tone, number[]> = {
  tap: [523.25],
  match: [523.25, 659.25],
  complete: [523.25, 659.25, 783.99],
};

export function playTone(tone: Tone): void {
  const a = audio();
  if (!a) return;
  NOTES[tone].forEach((freq, i) => {
    const t = a.currentTime + i * 0.12;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(tone === 'tap' ? 0.05 : 0.09, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}
