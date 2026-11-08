import type { PlantKind } from '@/core/games/types';

/**
 * Plant drawings used in the garden and on the finish screen.
 * Each kind differs in shape AND color, so color is never the only cue.
 * Drawn in a 48×64 box with the soil line at y=60.
 */
export function PlantArt({ kind, blooming = true, size = 64, animate = false }: { kind: PlantKind; blooming?: boolean; size?: number; animate?: boolean }) {
  const stem = 'var(--c-leaf)';
  const leaf = blooming ? '#5E8C61' : '#7FA27F';
  return (
    <svg width={(size * 48) / 64} height={size} viewBox="0 0 48 64" aria-hidden="true" focusable="false" className={animate ? 'plant-grow' : undefined}>
      <path d="M24 60V26" stroke={stem} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 48C16 48 11 42 11 35C19 35 24 40 24 48Z" fill={leaf} />
      <path d="M24 42C24 34 29 29 37 29C37 37 32 42 24 42Z" fill={leaf} />
      {blooming && <Bloom kind={kind} />}
      {!blooming && <circle cx="24" cy="24" r="4" fill="#9DB596" />}
    </svg>
  );
}

function Bloom({ kind }: { kind: PlantKind }) {
  switch (kind) {
    case 'tulip':
      return <path className="plant-bloom" d="M16 10L20 16L24 8L28 16L32 10V21C32 26 28.5 29 24 29C19.5 29 16 26 16 21Z" fill="#C9744D" />;
    case 'sunflower':
      return (
        <g className="plant-bloom">
          <g fill="#D9A21B">{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <ellipse key={a} cx="24" cy="10" rx="3.2" ry="6" transform={`rotate(${a} 24 19)`} />)}</g>
          <circle cx="24" cy="19" r="5.5" fill="#7A4B16" />
        </g>
      );
    case 'lavender':
      return (
        <g className="plant-bloom" fill="#7A5EA8">
          <ellipse cx="24" cy="6" rx="3" ry="4" /><ellipse cx="20" cy="12" rx="3" ry="4" /><ellipse cx="28" cy="12" rx="3" ry="4" />
          <ellipse cx="20" cy="19" rx="3" ry="4" /><ellipse cx="28" cy="19" rx="3" ry="4" /><ellipse cx="24" cy="25" rx="3" ry="4" />
        </g>
      );
    case 'daisy':
      return (
        <g className="plant-bloom">
          <g fill="#FFFFFF" stroke="#CFC6B2" strokeWidth="0.8">{[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => <ellipse key={a} cx="24" cy="11" rx="2.6" ry="6" transform={`rotate(${a} 24 19)`} />)}</g>
          <circle cx="24" cy="19" r="4.5" fill="#D9A21B" />
        </g>
      );
    case 'fern':
    default:
      return (
        <g className="plant-bloom" fill="#3D6B47">
          <path d="M24 26C18 22 15 15 16 6C21 10 24 17 24 26Z" />
          <path d="M24 26C30 22 33 15 32 6C27 10 24 17 24 26Z" />
        </g>
      );
  }
}
