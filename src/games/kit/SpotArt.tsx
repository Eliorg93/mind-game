import type { SpotId } from '@/content/he/objects';

/** Furniture and places in the home, line-drawn. 48×48 viewBox. */
export function SpotArt({ id, size = 40 }: { id: SpotId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#5B6A5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {SPOTS[id]}
    </svg>
  );
}

const SPOTS: Record<SpotId, JSX.Element> = {
  drawer: (<><rect x="6" y="10" width="36" height="28" rx="3" fill="#EADBC6" /><path d="M6 24h36M20 17h8M20 31h8" /></>),
  shelf: (<><path d="M6 16h36M6 32h36M10 16v24M38 16v24" /><rect x="12" y="8" width="5" height="8" fill="#B9D3B0" /><rect x="19" y="10" width="4" height="6" fill="#E2B33C" /></>),
  table: (<><path d="M4 18h40M9 18v22M39 18v22" /><rect x="4" y="15" width="40" height="5" rx="2" fill="#D9BFA0" /></>),
  sofa: (<><path d="M8 22V16a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v6" fill="#B7C9DB" /><path d="M4 24a4 4 0 0 1 8 0v4h24v-4a4 4 0 0 1 8 0v12H4Z" fill="#B7C9DB" /><path d="M8 36v4M40 36v4" /></>),
  window: (<><rect x="9" y="5" width="30" height="30" rx="2" fill="#DCEAF2" /><path d="M24 5v30M9 20h30M5 38h38" /></>),
  bed: (<><path d="M4 38V14M44 38V26H4" /><rect x="8" y="20" width="10" height="6" rx="2" fill="#FFFFFF" /><path d="M4 30h40" /><rect x="18" y="22" width="26" height="8" fill="#C9B8DE" /></>),
  closet: (<><rect x="8" y="5" width="32" height="38" rx="2" fill="#E3D1B8" /><path d="M24 5v38M20 22v4M28 22v4" /></>),
  chair: (<><path d="M14 6v34M14 24h20v16M14 30h20" /><rect x="14" y="6" width="20" height="14" rx="2" fill="#D9BFA0" /></>),
  fridge: (<><rect x="10" y="4" width="28" height="40" rx="3" fill="#E8EEF1" /><path d="M10 18h28M15 10v4M15 24v8" /></>),
  dresser: (<><rect x="6" y="12" width="36" height="28" rx="2" fill="#D9C2A5" /><path d="M6 21h36M6 30h36M22 16h4M22 25h4M22 34h4" /><circle cx="36" cy="7" r="3" fill="#B9D3B0" /></>),
  basket: (<><path d="M6 20h36l-4 20H10Z" fill="#E2C590" /><path d="M14 20c0-8 4-12 10-12s10 4 10 12M12 28h24M11 34h26" /></>),
  coatrack: (<><path d="M24 6v36M16 42h16M24 10l-8 4M24 10l8 4M24 18l-6 3M24 18l6 3" /><circle cx="24" cy="6" r="2" fill="#5B6A5E" /></>),
};
