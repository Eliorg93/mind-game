/** Hebrew content for the word-garden game. */

export interface Category {
  id: string;
  plural: string; // "פירות"
  singular: string; // "פרי" — used in "איזו מהמילים היא ___?"
  easy: boolean;
  members: string[];
}

export const CATEGORIES: Category[] = [
  { id: 'fruit', plural: 'פירות', singular: 'פרי', easy: true, members: ['תפוח', 'בננה', 'אגס', 'תפוז', 'אבטיח', 'שזיף', 'אפרסק', 'רימון'] },
  { id: 'veg', plural: 'ירקות', singular: 'ירק', easy: true, members: ['גזר', 'מלפפון', 'עגבנייה', 'בצל', 'חסה', 'פלפל', 'כרובית', 'קישוא'] },
  { id: 'animals', plural: 'בעלי חיים', singular: 'בעל חיים', easy: true, members: ['כלב', 'חתול', 'סוס', 'פרה', 'ארנב', 'אריה', 'ג׳ירפה', 'תרנגולת'] },
  { id: 'colors', plural: 'צבעים', singular: 'צבע', easy: true, members: ['אדום', 'כחול', 'ירוק', 'צהוב', 'סגול', 'כתום', 'לבן'] },
  { id: 'clothes', plural: 'בגדים', singular: 'פריט לבוש', easy: true, members: ['חולצה', 'מכנסיים', 'שמלה', 'מעיל', 'גרביים', 'חצאית', 'סוודר'] },
  { id: 'vehicles', plural: 'כלי תחבורה', singular: 'כלי תחבורה', easy: false, members: ['אוטובוס', 'רכבת', 'מטוס', 'אופניים', 'מונית', 'אונייה', 'משאית'] },
  { id: 'kitchen', plural: 'כלי מטבח', singular: 'כלי מטבח', easy: false, members: ['סיר', 'מחבת', 'כף', 'מזלג', 'צלחת', 'קומקום', 'מסננת'] },
  { id: 'music', plural: 'כלי נגינה', singular: 'כלי נגינה', easy: false, members: ['פסנתר', 'גיטרה', 'כינור', 'חליל', 'תוף', 'חצוצרה'] },
  { id: 'jobs', plural: 'מקצועות', singular: 'מקצוע', easy: false, members: ['רופאה', 'מורה', 'נגר', 'טבח', 'נהג', 'ספרנית', 'אחות'] },
  { id: 'cities', plural: 'ערים בישראל', singular: 'עיר בישראל', easy: false, members: ['חיפה', 'ירושלים', 'באר שבע', 'נתניה', 'טבריה', 'אילת', 'עכו'] },
];

export interface ChoiceItem {
  id: string;
  prompt: string;
  answer: string;
  wrong: [string, string, string];
}

/** "Which word fits the definition?" Hint: the first letter. */
export const DEFINITIONS: ChoiceItem[] = [
  { id: 'd1', prompt: 'כלי ששותים ממנו תה או קפה', answer: 'ספל', wrong: ['צלחת', 'מזלג', 'סיר'] },
  { id: 'd2', prompt: 'מקום שבו שואלים ספרים', answer: 'ספרייה', wrong: ['מאפייה', 'מרפאה', 'תחנה'] },
  { id: 'd3', prompt: 'מכשיר שמראה מה השעה', answer: 'שעון', wrong: ['מצפן', 'משקל', 'מדחום'] },
  { id: 'd4', prompt: 'אדם שמכין לחם ועוגות', answer: 'אופה', wrong: ['נגר', 'צבעי', 'דוור'] },
  { id: 'd5', prompt: 'חפץ ששומר עלינו מהגשם', answer: 'מטרייה', wrong: ['כובע', 'צעיף', 'מגבת'] },
  { id: 'd6', prompt: 'בעל חיים שנותן חלב', answer: 'פרה', wrong: ['סוס', 'תרנגולת', 'ארנב'] },
  { id: 'd7', prompt: 'חג שבו מדליקים נרות במשך שמונה ימים', answer: 'חנוכה', wrong: ['פורים', 'סוכות', 'שבועות'] },
  { id: 'd8', prompt: 'מקום שממנו ממריאים מטוסים', answer: 'שדה תעופה', wrong: ['נמל', 'תחנת רכבת', 'חניון'] },
  { id: 'd9', prompt: 'כלי שבו גוזרים נייר', answer: 'מספריים', wrong: ['מחק', 'סרגל', 'מהדק'] },
  { id: 'd10', prompt: 'פרי צהוב וארוך', answer: 'בננה', wrong: ['לימון', 'תפוח', 'אגס'] },
  { id: 'd11', prompt: 'האדם שמביא את המכתבים', answer: 'דוור', wrong: ['שוטר', 'נהג', 'סבל'] },
  { id: 'd12', prompt: 'מכשיר ששומר על האוכל קר', answer: 'מקרר', wrong: ['תנור', 'מכונת כביסה', 'מאוורר'] },
  { id: 'd13', prompt: 'צמח קוצני שגדל במדבר', answer: 'קקטוס', wrong: ['ורד', 'חמנייה', 'שושן'] },
  { id: 'd14', prompt: 'כלי שבו מטגנים ביצה', answer: 'מחבת', wrong: ['קערה', 'כוס', 'מסננת'] },
];

/** "Which word is closest in meaning?" Hint: removes one wrong option. */
export const SYNONYMS: ChoiceItem[] = [
  { id: 's1', prompt: 'שמח', answer: 'מאושר', wrong: ['עייף', 'כועס', 'רעב'] },
  { id: 's2', prompt: 'גדול', answer: 'ענק', wrong: ['צר', 'נמוך', 'רך'] },
  { id: 's3', prompt: 'חבר', answer: 'ידיד', wrong: ['שכן', 'אורח', 'זר'] },
  { id: 's4', prompt: 'לסיים', answer: 'לגמור', wrong: ['להתחיל', 'לחכות', 'לשכוח'] },
  { id: 's5', prompt: 'לדבר', answer: 'לשוחח', wrong: ['לשתוק', 'לשמוע', 'לרוץ'] },
  { id: 's6', prompt: 'אוכל', answer: 'מזון', wrong: ['שתייה', 'כלי', 'ספר'] },
  { id: 's7', prompt: 'עצוב', answer: 'עגום', wrong: ['רגוע', 'צמא', 'מהיר'] },
  { id: 's8', prompt: 'יפה', answer: 'נאה', wrong: ['חזק', 'רטוב', 'כבד'] },
  { id: 's9', prompt: 'מהר', answer: 'במהירות', wrong: ['בשקט', 'מחר', 'בזהירות'] },
];

/** Common Hebrew sayings with one word missing. `hard` ones appear at higher levels. */
export interface Idiom extends ChoiceItem {
  hard: boolean;
}

export const IDIOMS: Idiom[] = [
  { id: 'i1', hard: false, prompt: 'אין עשן בלי ___', answer: 'אש', wrong: ['מים', 'רוח', 'ענן'] },
  { id: 'i2', hard: false, prompt: 'כל ההתחלות ___', answer: 'קשות', wrong: ['קלות', 'יפות', 'ארוכות'] },
  { id: 'i3', hard: false, prompt: 'טובה ציפור אחת ב___ משתיים על העץ', answer: 'יד', wrong: ['כלוב', 'שמיים', 'קן'] },
  { id: 'i4', hard: false, prompt: 'מרוב עצים לא רואים את ה___', answer: 'יער', wrong: ['שמיים', 'דרך', 'שדה'] },
  { id: 'i5', hard: false, prompt: 'צומחים כמו ___ אחרי הגשם', answer: 'פטריות', wrong: ['פרחים', 'עשבים', 'עצים'] },
  { id: 'i6', hard: false, prompt: 'אין חכם כבעל ___', answer: 'ניסיון', wrong: ['ידע', 'ספר', 'כסף'] },
  { id: 'i7', hard: false, prompt: 'הרבה ___ על כלום', answer: 'רעש', wrong: ['צחוק', 'דיבור', 'אבק'] },
  { id: 'i8', hard: false, prompt: 'לפתוח דף ___', answer: 'חדש', wrong: ['לבן', 'ריק', 'ישן'] },
  { id: 'i9', hard: true, prompt: 'בין הפטיש ל___', answer: 'סדן', wrong: ['מסמר', 'קיר', 'ברזל'] },
  { id: 'i10', hard: true, prompt: 'כמו מחט בערימת ___', answer: 'שחת', wrong: ['חול', 'אבנים', 'בגדים'] },
  { id: 'i11', hard: true, prompt: 'אל תסתכל ב___, אלא במה שיש בו', answer: 'קנקן', wrong: ['ספל', 'בקבוק', 'ארגז'] },
  { id: 'i12', hard: true, prompt: 'סוף מעשה ב___ תחילה', answer: 'מחשבה', wrong: ['תוכנית', 'עבודה', 'תפילה'] },
  { id: 'i13', hard: true, prompt: 'יצא שכרו ב___', answer: 'הפסדו', wrong: ['כספו', 'ביתו', 'כבודו'] },
  { id: 'i14', hard: true, prompt: 'מים גנובים ___', answer: 'ימתקו', wrong: ['יתקררו', 'יזרמו', 'יתחממו'] },
  { id: 'i15', hard: true, prompt: 'לא דובים ולא ___', answer: 'יער', wrong: ['אריות', 'ציפורים', 'מערה'] },
  { id: 'i16', hard: true, prompt: 'להוציא את ה___ מהשק', answer: 'חתול', wrong: ['כלב', 'כסף', 'תפוח'] },
];

/** Question wording (content-language specific, so it lives with the content). */
export const WORD_TEXT = {
  categoryPrompt: (singular: string) => `איזו מהמילים היא ${singular}?`,
  oddPrompt: 'איזו מילה לא שייכת לקבוצה?',
  oddHint: (plural: string) => `שלוש מהמילים הן ${plural}.`,
  definitionPrompt: 'איזו מילה מתאימה להגדרה?',
  synonymPrompt: (word: string) => `איזו מילה קרובה במשמעות למילה "${word}"?`,
  idiomPrompt: 'השלימו את הביטוי:',
  letterHint: (letter: string) => `המילה מתחילה באות ${letter}.`,
  explainCategory: (plural: string, examples: string[]) => `קבוצת ה${plural}: ${examples.join(', ')}.`,
  explainOdd: (plural: string, odd: string) => `שאר המילים הן ${plural}, ו"${odd}" לא.`,
  explainDefinition: (word: string, definition: string) => `${word}: ${definition}.`,
  explainIdiom: (full: string) => `הביטוי המלא: "${full}".`,
  explainSynonym: (a: string, b: string) => `"${a}" ו"${b}" הן מילים קרובות במשמעות.`,
};
