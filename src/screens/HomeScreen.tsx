import { Link, Navigate } from 'react-router-dom';
import { useLoad, useT } from '@/app/state';
import { availableGames, getGameMeta } from '@/core/games/catalog';
import { deriveGarden } from '@/core/garden/garden';
import { buildRoutine, nextInRoutine, routineMinutes } from '@/core/routine/routine';
import { kvGet } from '@/core/storage/db';
import { listSessions, loadResume } from '@/core/storage/progress';
import { dayPart, formatHebrewDate } from '@/core/time/time';
import { BottomNav, Screen, SettingsLink } from '@/ui/Layout';
import { GameIcon, IconCheck, IconForward, IconSprout } from '@/ui/icons';

export const ONBOARDED_KEY = 'meta.onboarded';

async function loadHome() {
  const now = Date.now();
  const games = availableGames();
  const [onboarded, sessions] = await Promise.all([kvGet<boolean>(ONBOARDED_KEY), listSessions()]);
  const resumes = await Promise.all(games.map((g) => loadResume(g.id)));
  const resume = resumes.filter(Boolean).sort((a, b) => b!.savedAt - a!.savedAt)[0];
  return { now, games, onboarded: !!onboarded, routine: buildRoutine(games, sessions, now), garden: deriveGarden(sessions, now), resume };
}

export default function HomeScreen() {
  const { t } = useT();
  const { data } = useLoad(loadHome);

  if (!data) return <Screen withNav><div aria-busy="true" /></Screen>;
  if (!data.onboarded) return <Navigate to="/welcome" replace />;

  const { routine, games, garden, resume, now } = data;
  const next = nextInRoutine(routine);
  const doneCount = routine.filter((r) => r.done).length;
  const resumeMeta = resume ? getGameMeta(resume.gameId) : undefined;

  return (
    <>
      <Screen withNav>
        <header className="topbar" style={{ alignItems: 'flex-start' }}>
          <div>
            <p className="muted">{formatHebrewDate(now)}</p>
            <h1 className="display">{t(`greeting.${dayPart(now)}`)}</h1>
          </div>
          <SettingsLink />
        </header>

        {resumeMeta && (
          <Link to={`/games/${resumeMeta.id}`} className="row-link row-link--sage">
            <span className="tile" style={{ background: 'var(--c-surface)' }}><GameIcon id={resumeMeta.icon} /></span>
            <span className="row-link__body">
              <span className="row-link__title">{t('home.resumeTitle')}</span>
              <span className="muted small">{t(`games.${resumeMeta.id}.title`)} · {t('home.resumeAction')}</span>
            </span>
            <IconForward className="chevron" />
          </Link>
        )}

        <section className="card--hero" aria-labelledby="routine-title" style={{ background: 'var(--c-surface)' }}>
          <div>
            <h2 id="routine-title" className="title">{next ? t('home.routineTitle') : t('home.doneTitle')}</h2>
            <p className="muted">
              {next ? t('home.routineMeta', { count: routine.length, minutes: routineMinutes(routine, games) }) : t('home.doneBody')}
            </p>
          </div>
          <ol className="list-plain">
            {routine.map((item) => {
              const meta = getGameMeta(item.gameId)!;
              return (
                <li key={item.gameId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <span className="tile" style={{ inlineSize: 52, blockSize: 52 }}><GameIcon id={meta.icon} size={30} /></span>
                  <span style={{ flex: 1 }}>
                    <b style={{ display: 'block' }}>{t(`games.${meta.id}.title`)}</b>
                    <span className="muted small">{t(`games.domains.${meta.domains[0]}`)}</span>
                  </span>
                  {item.done && (
                    <span className="done-badge"><IconCheck />{t('home.itemDone')}</span>
                  )}
                </li>
              );
            })}
          </ol>
          {next ? (
            <Link to={`/games/${next.gameId}?from=routine`} className="btn btn--primary">
              {doneCount > 0 ? t('home.continue') : t('home.start')}
            </Link>
          ) : null}
        </section>

        <Link to="/garden" className="row-link row-link--sage">
          <span style={{ color: 'var(--c-primary)' }}><IconSprout size={40} /></span>
          <span className="row-link__body">
            <span className="row-link__title">{garden.totalPlants > 0 ? t('home.gardenSummary', { count: garden.totalPlants }) : t('home.gardenEmpty')}</span>
            <span className="muted small">{garden.practicedDaysLast7 > 0 ? t('home.practiced', { count: garden.practicedDaysLast7 }) : t('home.practicedNone')}</span>
          </span>
          <IconForward className="chevron" />
        </Link>

        <Link to="/games" className="btn btn--quiet" style={{ alignSelf: 'center' }}>
          {t('home.otherGame')}
        </Link>
      </Screen>
      <BottomNav />
    </>
  );
}
