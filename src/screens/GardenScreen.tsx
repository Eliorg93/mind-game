import { Link } from 'react-router-dom';
import { useLoad, useT } from '@/app/state';
import { availableGames } from '@/core/games/catalog';
import { deriveGarden } from '@/core/garden/garden';
import { buildRoutine, nextInRoutine } from '@/core/routine/routine';
import { listSessions } from '@/core/storage/progress';
import { formatHebrewDate, formatWeekdayShort } from '@/core/time/time';
import { BottomNav, Screen, SettingsLink } from '@/ui/Layout';
import { IconCheck } from '@/ui/icons';
import { PlantArt } from '@/ui/PlantArt';

/** Plants shown in the scene; older ones are summarized in a line below it. */
const SCENE_MAX = 24;

export default function GardenScreen() {
  const { t } = useT();
  const { data } = useLoad(async () => {
    const now = Date.now();
    const sessions = await listSessions();
    return { garden: deriveGarden(sessions, now), next: nextInRoutine(buildRoutine(availableGames(), sessions, now)) };
  });

  if (!data) return <><Screen withNav><div aria-busy="true" /></Screen><BottomNav /></>;
  const { garden, next } = data;
  const shown = garden.plants.slice(-SCENE_MAX);

  return (
    <>
      <Screen withNav>
        <header className="topbar" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1 className="display">{t('garden.title')}</h1>
            <p className="lead muted">{garden.totalPlants > 0 ? t('garden.summary', { count: garden.totalPlants, blooming: garden.bloomingCount }) : t('garden.empty')}</p>
          </div>
          <SettingsLink />
        </header>

        <div className="garden-scene" role="img" aria-label={t('garden.scene', { count: garden.totalPlants })}>
          <div className="garden-scene__hill" />
          <div className="garden-scene__beds">
            {shown.length === 0 ? (
              <div className="garden-scene__empty"><PlantArt kind="fern" blooming={false} size={84} /></div>
            ) : (
              shown.map((p) => (
                <div key={p.id} className="garden-scene__plant"><PlantArt kind={p.kind} blooming={p.blooming} size={64} /></div>
              ))
            )}
          </div>
        </div>
        {garden.totalPlants > SCENE_MAX && <p className="muted small">{t('garden.morePlants', { count: garden.totalPlants - SCENE_MAX })}</p>}

        <section className="card">
          <h2 className="lead" style={{ fontWeight: 700, marginBlockEnd: 'var(--space-3)' }}>{t('garden.last7', { count: garden.practicedDaysLast7 })}</h2>
          <ol className="days" aria-label={t('garden.last7Label')}>
            {garden.last7.map((d) => {
              const label = d.isToday ? t('garden.today') : formatWeekdayShort(d.ts);
              const full = formatHebrewDate(d.ts);
              return (
                <li key={d.ts} aria-label={d.practiced ? t('garden.dayPracticed', { day: full }) : t('garden.dayNotPracticed', { day: full })}>
                  <span className={`day-dot${d.practiced ? ' is-on' : ''}${d.isToday ? ' is-today' : ''}`} aria-hidden="true">{d.practiced && <IconCheck />}</span>
                  <span aria-hidden="true" style={{ fontWeight: d.isToday ? 700 : 400 }}>{label}</span>
                </li>
              );
            })}
          </ol>
          <p className="muted small" style={{ marginBlockStart: 'var(--space-3)' }}>{t('garden.gentle')}</p>
        </section>

        {next && <Link to={`/games/${next.gameId}?from=routine`} className="btn btn--primary">{t('garden.cta')}</Link>}
      </Screen>
      <BottomNav />
    </>
  );
}
