import { Link } from 'react-router-dom';
import { useT } from '@/app/state';
import { availableGames, plannedGames } from '@/core/games/catalog';
import { BackLink, Screen } from '@/ui/Layout';
import { GameIcon, IconForward } from '@/ui/icons';

export default function GamesScreen() {
  const { t } = useT();
  return (
    <Screen>
      <header className="topbar"><BackLink /></header>
      <div>
        <h1 className="display">{t('games.title')}</h1>
        <p className="lead muted">{t('games.subtitle')}</p>
      </div>
      <ul className="list-plain">
        {availableGames().map((g) => (
          <li key={g.id}>
            <Link to={`/games/${g.id}`} className="row-link">
              <span className="tile" style={{ inlineSize: 64, blockSize: 64, borderRadius: 20 }}><GameIcon id={g.icon} size={36} /></span>
              <span className="row-link__body">
                <span className="row-link__title">{t(`games.${g.id}.title`)}</span>
                <span className="muted small">{t(`games.${g.id}.desc`)}</span>
                <span className="eyebrow">{t(`games.domains.${g.domains[0]}`)} · {t('games.minutes', { count: g.minutes })}</span>
              </span>
              <IconForward className="chevron" />
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="soon-title" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 id="soon-title" className="lead" style={{ fontWeight: 700 }}>{t('games.comingSoon')}</h2>
        <p className="muted small">{t('games.comingSoonNote')}</p>
        <ul className="soon-grid">
          {plannedGames().map((g) => (
            <li key={g.id}>
              <b>{t(`games.${g.id}.title`)}</b>
              <span className="muted small">{t(`games.domains.${g.domains[0]}`)}</span>
            </li>
          ))}
        </ul>
      </section>
    </Screen>
  );
}
