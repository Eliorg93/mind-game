import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppState, useLoad, useT } from '@/app/state';
import { getGameMeta } from '@/core/games/catalog';
import type { GameResult } from '@/core/games/types';
import { PROFILES } from '@/core/adaptive/personalization';
import { playTone } from '@/core/sound/sound';
import { clearResume, getLevel, loadResume, recordSession, saveResume } from '@/core/storage/progress';
import { GAME_COMPONENTS } from '@/games/registry';
import { ExitLink, Screen } from '@/ui/Layout';
import { IconRepeat } from '@/ui/icons';

/**
 * Game host: loads level and saved state, saves every move, records the session
 * when the game reports completion. Games never touch storage themselves.
 */
export default function PlayScreen() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const wantResume = params.get('resume') === '1';
  const { t } = useT();
  const { settings, bumpData } = useAppState();
  const meta = getGameMeta(id);
  const Game = GAME_COMPONENTS[id];
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

  const { data } = useLoad(async () => {
    if (!meta) return null;
    const resume = wantResume ? await loadResume(meta.id) : undefined;
    if (!wantResume) await clearResume(meta.id);
    const level = resume?.level ?? (await getLevel(meta));
    return { level, resume, startedAt: resume?.startedAt ?? Date.now() };
    // Reload only when the game changes, not on every data save.
  }, [id, wantResume]);

  // Freeze the first load so saving progress (which bumps data) doesn't reset the game.
  const frozen = useRef<typeof data>(undefined);
  if (data && !frozen.current) frozen.current = data;
  const init = frozen.current;

  const feedback = useMemo(() => ({ tone: (tone: 'tap' | 'match' | 'complete') => settings.sound && playTone(tone) }), [settings.sound]);
  const support = useMemo(() => ({ hintOfferAfter: PROFILES[settings.challenge].hintOfferAfter }), [settings.challenge]);

  const onStateChange = useCallback(
    (state: unknown) => {
      if (!meta || !init || sessionId) return;
      saveResume({ gameId: meta.id, level: init.level, startedAt: init.startedAt, savedAt: Date.now(), state }).catch(() => setSaveError(true));
    },
    [meta, init, sessionId],
  );

  const onComplete = useCallback(
    async (result: GameResult) => {
      if (!meta || !init) return;
      try {
        const s = await recordSession(meta, { startedAt: init.startedAt, level: init.level, result, style: settings.challenge });
        setSessionId(s.id);
        bumpData();
      } catch {
        setSaveError(true);
        setSessionId('unsaved');
      }
    },
    [meta, init, bumpData, settings.challenge],
  );

  if (!meta || meta.status !== 'available' || !Game) return <Navigate to="/games" replace />;

  return (
    <Screen>
      <header className="topbar">
        <ExitLink />
        <Link to={`/games/${id}`} className="topbar__action"><IconRepeat />{t('actions.instructions')}</Link>
      </header>
      <h1 className="display" style={{ fontSize: '1.875rem' }}>{t(`games.${id}.title`)}</h1>
      {init ? (
        <Suspense fallback={<p className="muted">{t('play.loading')}</p>}>
          <Game key={`${id}-${init.startedAt}`} level={init.level} resume={init.resume?.state} onStateChange={onStateChange} onComplete={onComplete} feedback={feedback} support={support} />
        </Suspense>
      ) : (
        <p className="muted" aria-busy="true">{t('play.loading')}</p>
      )}
      <div className="spacer" />
      {saveError && <p className="notice" role="status">{t('status.storageUnavailable')}</p>}
      {sessionId ? (
        <Link to={sessionId === 'unsaved' ? '/' : `/finish/${sessionId}`} className="btn btn--primary">{t('play.finish')}</Link>
      ) : (
        <p className="muted small" style={{ textAlign: 'center' }}>{t('play.savedHint')}</p>
      )}
    </Screen>
  );
}
