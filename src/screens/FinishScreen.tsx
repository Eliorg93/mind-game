import { Link, Navigate, useParams } from 'react-router-dom';
import { useLoad, useT } from '@/app/state';
import { availableGames, getGameMeta } from '@/core/games/catalog';
import { buildRoutine, nextInRoutine } from '@/core/routine/routine';
import { getSession, listSessions } from '@/core/storage/progress';
import { Screen } from '@/ui/Layout';
import { PlantArt } from '@/ui/PlantArt';
import { AdaptCard } from './AdaptCard';
import type { PlantKind } from '@/core/games/types';

export default function FinishScreen() {
  const { sessionId = '' } = useParams();
  const { t } = useT();
  const { data, loading } = useLoad(async () => {
    const [session, sessions] = await Promise.all([getSession(sessionId), listSessions()]);
    const routine = buildRoutine(availableGames(), sessions, Date.now());
    return { session, routine };
  }, [sessionId]);

  if (loading && !data) return <Screen><div aria-busy="true" /></Screen>;
  if (!data?.session) return <Navigate to="/" replace />;

  const { session, routine } = data;
  const meta = getGameMeta(session.gameId);
  const plant = session.plantKind as PlantKind;
  const plantName = t(`plants.${plant}`);
  const minutes = Math.round(session.durationMs / 60_000);
  const next = nextInRoutine(routine);
  const doneCount = routine.filter((r) => r.done).length;

  return (
    <Screen>
      <div className="finish-hero" role="img" aria-label={t('finish.plantIllustration', { plant: plantName })}>
        <div className="finish-hero__soil" />
        <PlantArt kind={plant} size={190} animate />
      </div>
      <div>
        <p className="eyebrow">{t('finish.newPlant')}</p>
        <h1 className="display">{plantName}</h1>
        <p className="lead muted" style={{ marginBlockStart: 'var(--space-2)' }}>{t('finish.body', { game: meta ? t(`games.${meta.id}.title`) : '' })}</p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="muted small">{t('finish.time')}</div>
          <div className="title">{minutes < 1 ? t('lessThanMinute') : t('minutes', { count: minutes })}</div>
        </div>
        {routine.length > 0 && (
          <div className="card" style={{ flex: 1 }}>
            <div className="muted small">{t('finish.routine')}</div>
            <div className="title">{t('finish.routineProgress', { done: doneCount, total: routine.length })}</div>
          </div>
        )}
      </div>
      {meta && <AdaptCard session={session} meta={meta} />}
      <div className="spacer" />
      {next ? (
        <>
          <p className="muted" style={{ textAlign: 'center' }}>{t('finish.next', { game: t(`games.${next.gameId}.title`) })}</p>
          <Link to={`/games/${next.gameId}?from=routine`} className="btn btn--primary">{t('finish.nextCta')}</Link>
        </>
      ) : (
        <>
          <p className="muted" style={{ textAlign: 'center' }}>{t('finish.routineDone')}</p>
          <Link to="/garden" className="btn btn--primary">{t('finish.seeGarden')}</Link>
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {next && <Link to="/garden" className="btn btn--quiet">{t('finish.seeGarden')}</Link>}
        <Link to="/" className="btn btn--quiet">{t('actions.toHome')}</Link>
      </div>
    </Screen>
  );
}
