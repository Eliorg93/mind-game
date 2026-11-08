import type { ObjectId } from '@/content/he/objects';

/**
 * Everyday objects, drawn simply with a dark outline and one fill color each.
 * Silhouettes differ, so color is never the only cue. 48×48 viewBox.
 */
const INK = '#2B3A2F';

export function ObjectArt({ id, size = 48 }: { id: ObjectId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {ART[id]}
    </svg>
  );
}

const ART: Record<ObjectId, JSX.Element> = {
  key: (<><circle cx="15" cy="24" r="8" fill="#E2B33C" /><circle cx="15" cy="24" r="3" /><path d="M23 24h19M36 24v6M41 24v4" /></>),
  glasses: (<><circle cx="14" cy="27" r="8" fill="#DCEAF2" /><circle cx="34" cy="27" r="8" fill="#DCEAF2" /><path d="M22 26c1.5-2 2.5-2 4 0M6 25l-2-7M42 25l2-7" /></>),
  cup: (<><path d="M9 16h24v14a10 10 0 0 1-10 10h-4A10 10 0 0 1 9 30Z" fill="#F2D3C2" /><path d="M33 20h3a5 5 0 0 1 0 10h-3" /><path d="M17 8c0 3 3 3 3 6M24 8c0 3 3 3 3 6" /></>),
  phone: (<><rect x="14" y="5" width="20" height="38" rx="4" fill="#C9D6E8" /><path d="M21 37h6" /><rect x="17" y="10" width="14" height="22" rx="1" fill="#FFFFFF" /></>),
  book: (<><path d="M8 10h14a3 3 0 0 1 3 3v26a3 3 0 0 0-3-3H8Z" fill="#B9D3B0" /><path d="M40 10H28a3 3 0 0 0-3 3v26a3 3 0 0 1 3-3h12Z" fill="#B9D3B0" /></>),
  umbrella: (<><path d="M5 24a19 19 0 0 1 38 0Z" fill="#7FA6D6" /><path d="M24 24v13a4 4 0 0 1-8 0M24 5v2" /></>),
  clock: (<><circle cx="24" cy="25" r="16" fill="#FFF3D6" /><path d="M24 16v9l6 4M14 6l-5 4M34 6l5 4" /></>),
  scissors: (<><circle cx="13" cy="35" r="6" fill="#E59A8C" /><circle cx="35" cy="35" r="6" fill="#E59A8C" /><path d="M17 31 34 6M31 31 14 6" /></>),
  pen: (<><path d="M33 6l9 9-23 23-11 2 2-11Z" fill="#8FB3E0" /><path d="M28 11l9 9M10 30l8 8" /></>),
  hat: (<><path d="M4 33c0-3 6-5 20-5s20 2 20 5-6 4-20 4-20-1-20-4Z" fill="#C79A6B" /><path d="M13 30V18c0-4 5-7 11-7s11 3 11 7v12" fill="#C79A6B" /><path d="M13 23h22" /></>),
  bell: (<><path d="M12 34V22a12 12 0 0 1 24 0v12l3 3H9Z" fill="#E8C35A" /><path d="M20 41a4 4 0 0 0 8 0M24 6v4" /></>),
  lamp: (<><path d="M14 22 18 6h12l4 16Z" fill="#F3DFA2" /><path d="M24 22v16M15 42h18" /></>),
  apple: (<><path d="M24 14c-4-3-14-3-15 7-1 9 5 19 10 19 2 0 3-1 5-1s3 1 5 1c5 0 11-10 10-19-1-10-11-10-15-7Z" fill="#D9584C" /><path d="M24 14c0-4 1-7 4-9M26 9c3-2 7-1 8 1-3 2-6 1-8-1Z" fill="#6E9E5A" /></>),
  shoe: (<><path d="M5 30c0-6 2-14 6-16l6 6c4 3 10 4 16 5 6 1 10 3 10 7v4H5Z" fill="#9C7A5B" /><path d="M5 34h38" /></>),
  bag: (<><rect x="7" y="17" width="34" height="24" rx="4" fill="#B98AC9" /><path d="M17 17v-4a7 7 0 0 1 14 0v4" /></>),
  camera: (<><rect x="5" y="14" width="38" height="26" rx="4" fill="#A9B4BF" /><circle cx="24" cy="27" r="8" fill="#FFFFFF" /><path d="M16 14l3-5h10l3 5" /></>),
  wallet: (<><rect x="6" y="13" width="36" height="26" rx="4" fill="#B5764E" /><path d="M30 22h12v8H30a4 4 0 0 1 0-8Z" fill="#D9A27C" /></>),
  candle: (<><rect x="18" y="20" width="12" height="22" rx="2" fill="#F5EFE0" /><path d="M24 20v-4" /><path d="M24 4c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8Z" fill="#F0A93A" /></>),
  teapot: (<><path d="M10 22h24v8a12 12 0 0 1-12 12h0A12 12 0 0 1 10 30Z" fill="#9FC7B8" /><path d="M34 26l8-6M10 26c-4 0-6 3-4 6M16 22c0-4 3-6 6-6s6 2 6 6M22 12v4" /></>),
  ball: (<><circle cx="24" cy="24" r="17" fill="#F2C14E" /><path d="M7 24h34M24 7c-6 5-6 29 0 34M24 7c6 5 6 29 0 34" /></>),
  envelope: (<><rect x="5" y="11" width="38" height="26" rx="3" fill="#FFFFFF" /><path d="M5 13l19 14 19-14" /><rect x="33" y="15" width="6" height="7" fill="#D9584C" stroke="none" /></>),
  spoon: (<><ellipse cx="24" cy="13" rx="7" ry="9" fill="#C9CED3" /><path d="M24 22v20" strokeWidth="3" /></>),
  ring: (<><circle cx="24" cy="29" r="12" /><path d="M18 11h12l3 5-9 6-9-6Z" fill="#A8D8EA" /></>),
  remote: (<><rect x="16" y="4" width="16" height="40" rx="5" fill="#5C6670" /><circle cx="24" cy="12" r="3" fill="#D9584C" stroke="none" /><path d="M20 21h2M26 21h2M20 27h2M26 27h2M20 33h2M26 33h2" stroke="#FFFFFF" /></>),
};
