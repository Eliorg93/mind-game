import { Component, lazy, Suspense, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppStateProvider, useAppState, useT } from './state';
import { useOnline, useUpdateAvailable } from './pwa';
import HomeScreen from '@/screens/HomeScreen';

// Home is in the main bundle for the fastest first screen; the rest load on demand.
const WelcomeScreen = lazy(() => import('@/screens/WelcomeScreen'));
const GamesScreen = lazy(() => import('@/screens/GamesScreen'));
const InstructionsScreen = lazy(() => import('@/screens/InstructionsScreen'));
const PlayScreen = lazy(() => import('@/screens/PlayScreen'));
const FinishScreen = lazy(() => import('@/screens/FinishScreen'));
const GardenScreen = lazy(() => import('@/screens/GardenScreen'));
const MemoriesScreen = lazy(() => import('@/screens/MemoriesScreen'));
const MemoryEditorScreen = lazy(() => import('@/screens/MemoryEditorScreen'));
const MemoryViewScreen = lazy(() => import('@/screens/MemoryViewScreen'));
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen'));
const NotFoundScreen = lazy(() => import('@/screens/NotFoundScreen'));

export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <ErrorBoundary>
          <div className="app">
            <StatusBanners />
            <Suspense fallback={<div className="screen" aria-busy="true" />}>
              <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/welcome" element={<WelcomeScreen />} />
                <Route path="/games" element={<GamesScreen />} />
                <Route path="/games/:id" element={<InstructionsScreen />} />
                <Route path="/play/:id" element={<PlayScreen />} />
                <Route path="/finish/:sessionId" element={<FinishScreen />} />
                <Route path="/garden" element={<GardenScreen />} />
                <Route path="/memories" element={<MemoriesScreen />} />
                <Route path="/memories/new" element={<MemoryEditorScreen />} />
                <Route path="/memories/:id" element={<MemoryViewScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFoundScreen />} />
              </Routes>
            </Suspense>
          </div>
        </ErrorBoundary>
      </HashRouter>
    </AppStateProvider>
  );
}

function StatusBanners() {
  const { t } = useT();
  const online = useOnline();
  const { available, update } = useUpdateAvailable();
  const { storageOk } = useAppState();
  if (online && !available && storageOk) return null;
  return (
    <div style={{ padding: 'var(--space-3) var(--space-5) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {!storageOk && <p className="notice" role="status">{t('status.storageUnavailable')}</p>}
      {!online && <p className="notice" role="status">{t('status.offline')}</p>}
      {available && (
        <div className="notice" role="status" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ flex: 1 }}>{t('status.updateReady')}</span>
          <button type="button" className="btn btn--quiet" onClick={update}>
            {t('status.updateAction')}
          </button>
        </div>
      )}
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? <ErrorFallback /> : this.props.children;
  }
}

function ErrorFallback() {
  const { t } = useT();
  return (
    <main className="screen">
      <h1 className="display">{t('errors.boundaryTitle')}</h1>
      <p className="lead muted">{t('errors.boundaryBody')}</p>
      <button type="button" className="btn btn--primary" onClick={() => location.reload()}>
        {t('actions.reload')}
      </button>
    </main>
  );
}
