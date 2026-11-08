import type { Item } from './logic';

/** Card faces. Every item differs in silhouette as well as color. */
export function ItemArt({ item, size = 52 }: { item: Item; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="card-face">
      {art(item)}
    </svg>
  );
}

function art(item: Item) {
  const stem = <path d="M24 30V44" stroke="#3D6B47" strokeWidth="2.4" strokeLinecap="round" />;
  switch (item) {
    case 'tulip':
      return (<>{stem}<path d="M15 9L19.5 16L24 7L28.5 16L33 9V21C33 27 29 31 24 31C19 31 15 27 15 21Z" fill="#C9744D" /></>);
    case 'sunflower':
      return (<>{stem}<g fill="#D9A21B">{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <ellipse key={a} cx="24" cy="8" rx="3.6" ry="6" transform={`rotate(${a} 24 19)`} />)}</g><circle cx="24" cy="19" r="6.5" fill="#7A4B16" /></>);
    case 'leaf':
      return (<><path d="M24 5C37 12 39 29 24 43C9 29 11 12 24 5Z" fill="#5E8C61" /><path d="M24 12V43M24 22L18 17M24 22L30 17M24 31L17 25M24 31L31 25" stroke="#FFFDF8" strokeWidth="1.8" strokeLinecap="round" /></>);
    case 'lavender':
      return (<><path d="M24 44V10" stroke="#3D6B47" strokeWidth="2.4" strokeLinecap="round" /><g fill="#7A5EA8"><ellipse cx="24" cy="7" rx="3.5" ry="4.5" /><ellipse cx="19.5" cy="13" rx="3.5" ry="4.5" /><ellipse cx="28.5" cy="13" rx="3.5" ry="4.5" /><ellipse cx="19.5" cy="21" rx="3.5" ry="4.5" /><ellipse cx="28.5" cy="21" rx="3.5" ry="4.5" /><ellipse cx="20" cy="29" rx="3.5" ry="4.5" /><ellipse cx="28" cy="29" rx="3.5" ry="4.5" /></g></>);
    case 'daisy':
      return (<>{stem}<g fill="#FFFFFF" stroke="#B9B2A2" strokeWidth="1">{[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => <ellipse key={a} cx="24" cy="9" rx="3" ry="6.5" transform={`rotate(${a} 24 18)`} />)}</g><circle cx="24" cy="18" r="5" fill="#D9A21B" /></>);
    case 'cherry':
      return (<><path d="M17 30C19 20 23 12 32 6M31 30C30 21 30 13 32 6" stroke="#3D6B47" strokeWidth="2.2" fill="none" strokeLinecap="round" /><path d="M32 6C36 5 40 7 41 10C37 11 34 10 32 6Z" fill="#5E8C61" /><circle cx="16" cy="35" r="7.5" fill="#A8323E" /><circle cx="31" cy="36" r="7.5" fill="#A8323E" /><circle cx="13.5" cy="32.5" r="2" fill="#FFFFFF" opacity=".6" /><circle cx="28.5" cy="33.5" r="2" fill="#FFFFFF" opacity=".6" /></>);
    case 'mushroom':
      return (<><path d="M19 26H29L31 42H17Z" fill="#EFE6D2" stroke="#B9A98A" strokeWidth="1.2" /><path d="M6 27C6 15 14 7 24 7C34 7 42 15 42 27Z" fill="#B5542F" /><circle cx="17" cy="17" r="3" fill="#FFFDF8" /><circle cx="29" cy="14" r="2.5" fill="#FFFDF8" /><circle cx="33" cy="22" r="2" fill="#FFFDF8" /></>);
    case 'pinecone':
      return (<><path d="M24 4C33 10 36 22 33 32C31 39 27 44 24 44C21 44 17 39 15 32C12 22 15 10 24 4Z" fill="#8A5A2B" /><path d="M17 16L24 21L31 16M15.5 24L24 30L32.5 24M16.5 32L24 38L31.5 32" stroke="#D9B98A" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>);
  }
}
