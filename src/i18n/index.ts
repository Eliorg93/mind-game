import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './locales/he/common.json';
import games from './locales/he/games.json';
import garden from './locales/he/garden.json';
import memories from './locales/he/memories.json';
import settings from './locales/he/settings.json';

/**
 * Hebrew is the only language in phase one. Adding a language = a new folder
 * under locales/<lang>/ with the same keys, plus an entry in SUPPORTED.
 *
 * Gendered address uses i18next "context": key (neutral) / key_female / key_male.
 * Plurals use the platform's Intl.PluralRules (he: one / two / other).
 */
export const SUPPORTED = { he: { dir: 'rtl' as const } };
export type Lang = keyof typeof SUPPORTED;

export const resources = {
  he: { translation: { ...common, ...games, ...garden, ...memories, ...settings } },
};

export function initI18n(lang: Lang = 'he') {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: lang,
      fallbackLng: 'he',
      interpolation: { escapeValue: false }, // React already escapes output
      returnNull: false,
      initAsync: false,
    });
  }
  return i18n;
}

export default i18n;
