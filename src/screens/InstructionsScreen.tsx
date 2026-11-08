import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppState, useLoad, useT } from '@/app/state';
import { availableGames, getGameMeta } from '@/core/games/catalog';
import { buildRoutine } from '@/core/routine/routine';
import { listSessions, loadResume } from '@/core/storage/progress';
import { speak, speechSupported, stopSpeaking } from '@/core/speech/speech';
import { hasComponent } from '@/games/registry';
import { ExitLink, Screen } from '@/ui/Layout';
import { GameIcon, IconClock, IconSpeaker, IconStop } from '@/ui/icons';

export default function InstructionsScreen() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { t } = useT();
  const { settings } = useAppState();
  const meta = getGameMeta(id);
  const playable = !!meta && meta.status === 'available' && hasComponent(id);
  const [reading, setReading] = useState(false);

  const { data } = useLoad(async () => {
    if (!playable) return null;
    const [resume, sessions] = await Promise.all([loadResume(id), listSessions()]);
    const routine = buildRoutine(availableGames(), sessions, Date.now());
    const pos = routine.findIndex((r) => r.gameId === id);
    return { resume, routine, pos };
  }, [id]);

  const steps = meta ? Array.from({ length: meta.instructionSteps }, (_, i) => t(`games.${id}.steps.${i + 1}`)) : [];
  const script = meta ? [t(`games.${id}.title`), ...steps, t('instructions.noTimeLimit')].join(' ') : '';
  const canSpeak = speechSupported();

  const toggleRead = () => {
    if (reading) {
      stopSpeaking();
      setReading(false);
    } else if (speak(script, { onEnd: () => setReading(false) })) {
      setReading(true);
    }
  };

  useEffect(() => {
    if (playable && settings.autoReadInstructions && canSpeak && speak(script, { onEnd: () => setReading(false) })) setReading(true);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!playable) return <Navigate to="/games" replace />;

  const fromRoutine = params.get('from') === 'routine' && data && data.pos >= 0;
  return (
    <Screen>
      <header className="topbar">
        <ExitLink />
        {fromRoutine && <span className="muted small" style={{ fontWeight: 600 }}>{t('instructions.activityOf', { n: data.pos + 1, total: data.routine.length })}</span>}
      </header>
      <span className="tile" style={{ inlineSize: 88, blockSize: 88, borderRadius: 26, alignSelf: 'center' }}><GameIcon id={meta.icon} size={52} /></span>
      <div>
        <h1 className="display">{t(`games.${id}.title`)}</h1>
        <p className="lead muted">{t(`games.domains.${meta.domains[0]}`)}</p>
      </div>
      <ol className="list-plain steps">
        {steps.map((s, i) => (
          <li key={i}><span className="step-num" aria-hidden="true">{i + 1}</span><span>{s}</span></li>
        ))}
      </ol>
      <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)' }}>
        <IconClock />{t('instructions.noTimeLimit')}
      </p>
      <div className="spacer" />
      {canSpeak && (
        <button type="button" className="btn btn--secondary" onClick={toggleRead} aria-pressed={reading}>
          {reading ? <IconStop /> : <IconSpeaker />}
          {reading ? t('instructions.stopReading') : t('instructions.readAloud')}
        </button>
      )}
      {data?.resume ? (
        <>
          <Link to={`/play/${id}?resume=1`} className="btn btn--primary">{t('instructions.resume')}</Link>
          <Link to={`/play/${id}`} className="btn btn--quiet" style={{ alignSelf: 'center' }}>{t('instructions.restart')}</Link>
        </>
      ) : (
        <Link to={`/play/${id}`} className="btn btn--primary">{t('instructions.start')}</Link>
      )}
    </Screen>
  );
}
