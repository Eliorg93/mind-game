/**
 * Hebrew content: everyday objects and places in the home.
 * Art for each id lives in src/games/kit/ObjectArt.tsx and SpotArt.tsx.
 */
export const OBJECT_NAMES = {
  key: 'מפתח',
  glasses: 'משקפיים',
  cup: 'ספל',
  phone: 'טלפון',
  book: 'ספר',
  umbrella: 'מטרייה',
  clock: 'שעון',
  scissors: 'מספריים',
  pen: 'עט',
  hat: 'כובע',
  bell: 'פעמון',
  lamp: 'מנורה',
  apple: 'תפוח',
  shoe: 'נעל',
  bag: 'תיק',
  camera: 'מצלמה',
  wallet: 'ארנק',
  candle: 'נר',
  teapot: 'קומקום',
  ball: 'כדור',
  envelope: 'מכתב',
  spoon: 'כפית',
  ring: 'טבעת',
  remote: 'שלט',
} as const;

export type ObjectId = keyof typeof OBJECT_NAMES;
export const OBJECT_IDS = Object.keys(OBJECT_NAMES) as ObjectId[];

/** Small objects that make sense to "put somewhere" in the where-is-it game. */
export const PLACEABLE_OBJECTS: ObjectId[] = ['key', 'glasses', 'phone', 'book', 'wallet', 'remote', 'pen', 'ring', 'envelope', 'cup', 'scissors', 'candle', 'camera', 'spoon', 'hat'];

export const SPOT_NAMES = {
  drawer: 'מגירה',
  shelf: 'מדף',
  table: 'שולחן',
  sofa: 'ספה',
  window: 'אדן החלון',
  bed: 'מיטה',
  closet: 'ארון',
  chair: 'כיסא',
  fridge: 'מקרר',
  dresser: 'שידה',
  basket: 'סלסלה',
  coatrack: 'מתלה',
} as const;

export type SpotId = keyof typeof SPOT_NAMES;
export const SPOT_IDS = Object.keys(SPOT_NAMES) as SpotId[];

/** "Where" phrase for each place, with the natural Hebrew preposition. */
export const SPOT_AT: Record<SpotId, string> = {
  drawer: 'במגירה',
  shelf: 'על המדף',
  table: 'על השולחן',
  sofa: 'על הספה',
  window: 'על אדן החלון',
  bed: 'על המיטה',
  closet: 'בארון',
  chair: 'על הכיסא',
  fridge: 'במקרר',
  dresser: 'על השידה',
  basket: 'בסלסלה',
  coatrack: 'על המתלה',
};
