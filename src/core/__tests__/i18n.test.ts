import i18n, { resources } from '@/i18n';
import { CATALOG, availableGames } from '@/core/games/catalog';

const he = resources.he.translation as Record<string, unknown>;
function flatten(o: unknown, p = ''): [string, string][] {
  if (typeof o === 'string') return [[p, o]];
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => flatten(v, p ? `${p}.${k}` : k));
}
const all = flatten(he);

describe('Hebrew locale', () => {
  it('every UI string is Hebrew (apart from the brand name)', () => {
    const allowedLatin = new Set(['app.name']);
    const bad = all.filter(([k, v]) => !allowedLatin.has(k) && !/[֐-׿]/.test(v));
    expect(bad).toEqual([]);
  });
  it('has title and description for every game in the catalog', () => {
    for (const g of CATALOG) {
      expect(i18n.exists(`games.${g.id}.title`)).toBe(true);
      expect(i18n.exists(`games.${g.id}.desc`)).toBe(true);
    }
  });
  it('has neutral, female and male instruction steps for playable games', () => {
    for (const g of availableGames()) {
      for (let i = 1; i <= g.instructionSteps; i++) {
        const n = i18n.t(`games.${g.id}.steps.${i}`);
        const f = i18n.t(`games.${g.id}.steps.${i}`, { context: 'female' });
        const m = i18n.t(`games.${g.id}.steps.${i}`, { context: 'male' });
        expect(new Set([n, f, m]).size).toBe(3);
      }
    }
  });
  it('uses Hebrew plural forms', () => {
    expect(i18n.t('minutes', { count: 1 })).toBe('דקה אחת');
    expect(i18n.t('minutes', { count: 2 })).toBe('שתי דקות');
    expect(i18n.t('minutes', { count: 7 })).toBe('7 דקות');
    expect(i18n.t('home.gardenSummary', { count: 12 })).toBe('בגינה שלך 12 צמחים');
  });
  it('has a domain label for every domain used', () => {
    for (const d of new Set(CATALOG.flatMap((g) => g.domains))) expect(i18n.exists(`games.domains.${d}`)).toBe(true);
  });
});
