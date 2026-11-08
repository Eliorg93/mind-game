import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted Hebrew fonts (no third-party requests; cached for offline use).
import '@fontsource/assistant/hebrew-400.css';
import '@fontsource/assistant/hebrew-700.css';
import '@fontsource/assistant/latin-400.css';
import '@fontsource/assistant/latin-700.css';
import '@fontsource/frank-ruhl-libre/hebrew-700.css';
import '@fontsource/frank-ruhl-libre/latin-700.css';
import './styles/global.css';
import './styles/screens.css';
import App from './app/App';
import { initI18n } from './i18n';
import { applySettingsToDocument, readFastSettings } from './core/settings/settings';
import { requestPersistentStorage } from './core/storage/db';
import { listenForInstallPrompt, registerServiceWorker } from './app/pwa';

// Apply text size / contrast before the first paint to avoid a visible jump.
applySettingsToDocument(readFastSettings());
initI18n('he');
listenForInstallPrompt();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

document.getElementById('boot')?.remove();
void registerServiceWorker();
void requestPersistentStorage();
