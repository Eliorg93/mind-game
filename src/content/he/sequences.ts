/** Hebrew content for the sequences-and-logic game. */

/** Everyday routines in the correct order. */
export interface Routine {
  id: string;
  title: string;
  steps: string[];
}

export const ROUTINES: Routine[] = [
  { id: 'tea', title: 'הכנת כוס תה', steps: ['להרתיח מים בקומקום', 'לשים שקית תה בכוס', 'למזוג את המים לכוס', 'לחכות כמה דקות ולשתות'] },
  { id: 'letter', title: 'שליחת מכתב', steps: ['לכתוב את המכתב', 'לשים אותו במעטפה', 'להדביק בול', 'להכניס לתיבת הדואר'] },
  { id: 'plant', title: 'שתילת פרח', steps: ['לחפור גומה באדמה', 'להכניס את השתיל', 'לכסות את השורשים באדמה', 'להשקות במים'] },
  { id: 'laundry', title: 'כביסה', steps: ['לשים את הבגדים במכונה', 'להוסיף אבקת כביסה', 'להפעיל את המכונה', 'לתלות את הבגדים לייבוש'] },
  { id: 'salad', title: 'הכנת סלט', steps: ['לשטוף את הירקות', 'לחתוך אותם לקוביות', 'לשים אותם בקערה', 'לתבל בשמן ולימון'] },
  { id: 'doctor', title: 'ביקור אצל הרופא', steps: ['לקבוע תור', 'להגיע למרפאה', 'לחכות בחדר ההמתנה', 'להיכנס לרופא'] },
  { id: 'cake', title: 'אפיית עוגה', steps: ['לערבב קמח, ביצים וסוכר', 'לשפוך את הבלילה לתבנית', 'להכניס לתנור', 'להוציא ולתת לעוגה להתקרר'] },
];

export const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
export const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'];

/** Names used in generated comparison riddles (all feminine, so verb and adjective forms agree). */
export const NAMES = ['רותי', 'דנה', 'יעל', 'מיכל', 'שושנה', 'אורית', 'חנה', 'ציפי'];

/** Comparison words: [more, most-opposite-question]. */
export const COMPARISONS = [
  { more: 'גבוהה', most: 'הכי גבוהה', least: 'הכי נמוכה' },
  { more: 'מבוגרת', most: 'הכי מבוגרת', least: 'הכי צעירה' },
];

export const FRUIT_PLURAL = ['תפוחים', 'תפוזים', 'אגסים', 'לימונים'];

export const SHAPE_NAMES = { circle: 'עיגול', square: 'ריבוע', triangle: 'משולש', star: 'כוכב' } as const;
export const COLOR_NAMES = { green: 'ירוק', orange: 'כתום', gold: 'צהוב', purple: 'סגול', blue: 'כחול' } as const;

/** Question wording for the sequences-and-logic game. */
export const SEQ_TEXT = {
  orderPrompt: (title: string) => `מה הסדר הנכון? ${title}`,
  seriesPrompt: 'מה בא אחר כך ברצף?',
  patternPrompt: 'איזו צורה ממשיכה את הדפוס?',
  dayPrompt: (today: string, offset: number) =>
    offset === 1 ? `אם היום יום ${today}, איזה יום יהיה מחר?` : offset === 2 ? `אם היום יום ${today}, איזה יום יהיה בעוד יומיים?` : offset === -1 ? `אם היום יום ${today}, איזה יום היה אתמול?` : `אם היום יום ${today}, איזה יום יהיה בעוד ${offset} ימים?`,
  dayOption: (d: string) => `יום ${d}`,
  comparePrompt: (a: string, b: string, c: string, more: string, ask: string) => `${a} ${more} מ${b}. ${b} ${more} מ${c}. מי ${ask}?`,
  addPrompt: (a: number, b: number, fruit: string) => `בסל היו ${a} ${fruit}. הוסיפו עוד ${b}. כמה ${fruit} יש בסל עכשיו?`,
  moneyPrompt: (a: number, b: number) => `בארנק היו ${a} שקלים. קנו לחם ב-${b} שקלים. כמה שקלים נשארו?`,
  timePrompt: (h: number, d: number) => `האוטובוס יוצא בשעה ${h}:00, והנסיעה נמשכת ${d === 1 ? 'שעה' : d === 2 ? 'שעתיים' : `${d} שעות`}. באיזו שעה מגיעים?`,
  timeOption: (h: number) => `${h}:00`,
  explainOrder: (steps: string[]) => `הסדר הנכון: ${steps.join('; ואז ')}.`,
  explainAdd: (step: number) => (step > 0 ? `בכל צעד מוסיפים ${step}.` : `בכל צעד מורידים ${-step}.`),
  explainDouble: 'בכל צעד המספר גדל פי 2.',
  explainList: (kind: 'days' | 'months' | 'letters', skip: boolean) =>
    `${kind === 'days' ? 'ימי השבוע' : kind === 'months' ? 'חודשי השנה' : 'אותיות האלף-בית'} לפי הסדר${skip ? ', בדילוג על אחד' : ''}.`,
  explainPattern: (motif: string[]) => `הדפוס חוזר על עצמו: ${motif.join(', ')}.`,
  explainDay: (today: string, offset: number, ans: string) =>
    offset === 1 ? `אחרי יום ${today} בא יום ${ans}.` : offset === -1 ? `לפני יום ${today} בא יום ${ans}.` : `סופרים ${offset} ימים קדימה מיום ${today}, ומגיעים ליום ${ans}.`,
  explainSum: (a: number, b: number) => `${a} ועוד ${b} הם ${a + b}.`,
  explainDiff: (a: number, b: number) => `${a} פחות ${b} הם ${a - b}.`,
  explainTime: (h: number, d: number) => `${h}:00 ועוד ${d === 1 ? 'שעה' : d === 2 ? 'שעתיים' : `${d} שעות`} זה ${h + d}:00.`,
  explainCompare: (a: string, b: string, c: string, more: string, ans: string, ask: string) => `${a} ${more} מ${b}, ו${b} ${more} מ${c}. לכן ${ans} ${ask}.`,
};
