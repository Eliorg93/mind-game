import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { initI18n } from '@/i18n';

(globalThis as unknown as { __APP_VERSION__: string }).__APP_VERSION__ = 'test';
initI18n('he');
window.scrollTo = () => {};
