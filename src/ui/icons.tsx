import type { SVGProps } from 'react';
import type { IconId } from '@/core/games/types';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, rest: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...rest,
});

/* Directional icons are drawn for RTL and carry .flip-ltr so a future LTR language mirrors them. */
export const IconBack = ({ size = 28, className = '', ...r }: P) => (
  <svg {...base(size, r)} className={`flip-ltr ${className}`}><path d="M9 6l6 6-6 6" /></svg>
);
export const IconForward = ({ size = 24, className = '', ...r }: P) => (
  <svg {...base(size, r)} className={`flip-ltr ${className}`}><path d="M15 6l-6 6 6 6" /></svg>
);
export const IconClose = ({ size = 26, ...r }: P) => (
  <svg {...base(size, r)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconSettings = ({ size = 26, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 7h16M4 12h16M4 17h16" /><circle cx="9" cy="7" r="2" fill="var(--c-surface)" /><circle cx="15" cy="12" r="2" fill="var(--c-surface)" /><circle cx="8" cy="17" r="2" fill="var(--c-surface)" /></svg>
);
export const IconHome = ({ size = 26, ...r }: P) => (
  <svg {...base(size, r)}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg>
);
export const IconSprout = ({ size = 26, ...r }: P) => (
  <svg {...base(size, r)}><path d="M12 21v-9" /><path d="M12 14c-4 0-6-3-6-6 3 0 6 2 6 6Z" /><path d="M12 12c0-4 3-6 6-6 0 3-2 6-6 6Z" /></svg>
);
export const IconBookHeart = ({ size = 26, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z" /><path d="M4 21V5" /><path d="M12 7.5c-1-1.2-3-.6-3 1 0 1.8 3 3.5 3 3.5s3-1.7 3-3.5c0-1.6-2-2.2-3-1Z" /></svg>
);
export const IconSpeaker = ({ size = 26, ...r }: P) => (
  <svg {...base(size, r)}><path d="M11 5L6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>
);
export const IconStop = ({ size = 26, ...r }: P) => (
  <svg {...base(size, r)}><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
);
export const IconRepeat = ({ size = 24, ...r }: P) => (
  <svg {...base(size, r)}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
);
export const IconClock = ({ size = 22, ...r }: P) => (
  <svg {...base(size, r)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconLock = ({ size = 20, ...r }: P) => (
  <svg {...base(size, r)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const IconPlus = ({ size = 24, ...r }: P) => (
  <svg {...base(size, r)} strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconPen = ({ size = 28, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 20h4L19 9l-4-4L4 16Z" /></svg>
);
export const IconImage = ({ size = 28, ...r }: P) => (
  <svg {...base(size, r)}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 8" /></svg>
);
export const IconCheck = ({ size = 18, ...r }: P) => (
  <svg {...base(size, r)} strokeWidth={3}><path d="M5 12l5 5 9-10" /></svg>
);
export const IconDownload = ({ size = 24, ...r }: P) => (
  <svg {...base(size, r)}><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M5 20h14" /></svg>
);
export const IconTrash = ({ size = 24, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const IconPhoneAdd = ({ size = 24, ...r }: P) => (
  <svg {...base(size, r)}><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M12 8v6M9 11h6" /></svg>
);

/** Game icons, keyed by catalog `icon`. */
export function GameIcon({ id, size = 34 }: { id: IconId; size?: number }) {
  const s = { ...base(size, {}), strokeWidth: 1.8 };
  switch (id) {
    case 'cards':
      return <svg {...s} viewBox="0 0 48 48" strokeWidth={2.6}><rect x="7" y="9" width="15" height="20" rx="3" /><rect x="26" y="19" width="15" height="20" rx="3" fill="var(--c-sage-2)" /></svg>;
    case 'basket':
      return <svg {...s}><path d="M5 8h14l-1.5 11a2 2 0 0 1-2 1.7h-7a2 2 0 0 1-2-1.7Z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>;
    case 'bird':
      return <svg {...s}><path d="M4 14c3 0 5-2 6-5 1.5 3 4 4 7 3-1 4-4 6-8 6-2 0-4-1-5-4Z" /><path d="M17 8l3-1" /></svg>;
    case 'stones':
      return <svg {...s}><ellipse cx="7" cy="17" rx="4" ry="2.5" /><ellipse cx="13" cy="11" rx="4" ry="2.5" /><ellipse cx="18" cy="5.5" rx="3" ry="2" /></svg>;
    case 'speech':
      return <svg {...s}><path d="M4 5h16v11H9l-5 4Z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></svg>;
    case 'book':
      return <svg {...s}><path d="M3 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H3Z" /><path d="M21 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7Z" /></svg>;
    case 'pattern':
      return <svg {...s}><circle cx="5" cy="12" r="2.5" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /><path d="M19 9.5l2.5 5h-5Z" /></svg>;
    case 'gate':
      return <svg {...s}><path d="M4 21V9a8 8 0 0 1 16 0v12" /><path d="M4 21h16M12 1v4" /></svg>;
    case 'house':
      return <svg {...s}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" /></svg>;
    case 'map':
      return <svg {...s}><path d="M9 4l-6 3v13l6-3 6 3 6-3V4l-6 3Z" /><path d="M9 4v13M15 7v13" /></svg>;
    default:
      return null;
  }
}
