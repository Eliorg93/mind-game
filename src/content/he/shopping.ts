/** Hebrew content: grocery products by store section, for the shopping-list game. */
export interface Section {
  id: string;
  name: string;
  products: string[];
}

export const SECTIONS: Section[] = [
  { id: 'veg', name: 'הירקות', products: ['עגבניות', 'מלפפונים', 'גזר', 'בצל', 'פלפל אדום', 'חסה', 'תפוחי אדמה'] },
  { id: 'fruit', name: 'הפירות', products: ['תפוחים', 'בננות', 'תפוזים', 'ענבים', 'אבטיח', 'אגסים'] },
  { id: 'dairy', name: 'מוצרי החלב', products: ['חלב', 'גבינה לבנה', 'יוגורט', 'חמאה', 'קוטג׳', 'ביצים'] },
  { id: 'bakery', name: 'המאפייה', products: ['לחם', 'חלה', 'פיתות', 'לחמניות', 'עוגיות'] },
  { id: 'pantry', name: 'המזווה', products: ['אורז', 'פסטה', 'קמח', 'סוכר', 'שמן זית', 'קפה', 'תה', 'טחינה'] },
  { id: 'cleaning', name: 'הניקיון', products: ['סבון כלים', 'נייר טואלט', 'אבקת כביסה', 'מגבונים'] },
];

export interface Product {
  id: string; // stable id "<section>:<index>"
  name: string;
  sectionId: string;
}

export const PRODUCTS: Product[] = SECTIONS.flatMap((s) => s.products.map((name, i) => ({ id: `${s.id}:${i}`, name, sectionId: s.id })));

export function productById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function sectionById(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id);
}
