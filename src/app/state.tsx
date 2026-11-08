import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { applySettingsToDocument, loadSettings, readFastSettings, saveSettings, type Settings } from '@/core/settings/settings';
import { getDB } from '@/core/storage/db';

interface AppState {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Increments whenever stored data changes, so screens can reload what they show. */
  dataVersion: number;
  bumpData: () => void;
  storageOk: boolean;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => readFastSettings());
  const [dataVersion, setDataVersion] = useState(0);
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => {
    let alive = true;
    getDB()
      .then(() => loadSettings())
      .then((s) => {
        if (alive) setSettings(s);
      })
      .catch(() => {
        if (alive) setStorageOk(false);
      });
    return () => {
      alive = false;
    };
  }, []); // load once; "delete all data" reloads the page

  useEffect(() => {
    applySettingsToDocument(settings);
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next).catch(() => setStorageOk(false));
      return next;
    });
  }, []);

  const bumpData = useCallback(() => setDataVersion((v) => v + 1), []);

  const value = useMemo(() => ({ settings, updateSettings, dataVersion, bumpData, storageOk }), [settings, updateSettings, dataVersion, bumpData, storageOk]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState outside provider');
  return v;
}

/**
 * Translation hook that applies the user's chosen form of address automatically.
 * Neutral uses the base key; female/male look for key_female / key_male first.
 */
export function useT() {
  const { t, i18n } = useTranslation();
  const { settings } = useAppState();
  const context = settings.address === 'neutral' ? undefined : settings.address;
  const tg = useCallback(
    (key: string, options: Record<string, unknown> = {}) => t(key, { context, ...options }) as string,
    [t, context],
  );
  return { t: tg, i18n };
}

/** Loads async data and reloads it when stored data changes. */
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []): { data: T | undefined; error: unknown; loading: boolean } {
  const { dataVersion } = useAppState();
  const [state, setState] = useState<{ data: T | undefined; error: unknown; loading: boolean }>({ data: undefined, error: null, loading: true });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    loader()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: undefined, error, loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion, ...deps]);
  return state;
}
