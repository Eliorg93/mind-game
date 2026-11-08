import { Link, useNavigate } from 'react-router-dom';
import { useAppState, useT } from '@/app/state';
import { kvSet } from '@/core/storage/db';
import { Screen } from '@/ui/Layout';
import { IconClock, IconLock, IconSprout } from '@/ui/icons';
import { PlantArt } from '@/ui/PlantArt';
import { ONBOARDED_KEY } from './HomeScreen';

export default function WelcomeScreen() {
  const { t } = useT();
  const { bumpData } = useAppState();
  const navigate = useNavigate();

  const start = async () => {
    try {
      await kvSet(ONBOARDED_KEY, true);
    } catch {
      /* storage unavailable: the banner explains; continue anyway */
    }
    bumpData();
    navigate('/', { replace: true });
  };

  const points = [
    { icon: <IconClock size={24} />, text: t('welcome.point1') },
    { icon: <IconSprout size={24} />, text: t('welcome.point2') },
    { icon: <IconLock size={24} />, text: t('welcome.point3') },
  ];

  return (
    <Screen>
      <div className="welcome-art" role="img" aria-label={t('welcome.illustration')}>
        <PlantArt kind="tulip" size={92} />
        <PlantArt kind="sunflower" size={120} />
        <PlantArt kind="lavender" size={96} />
      </div>
      <h1 className="display">{t('welcome.title')}</h1>
      <p className="lead muted">{t('welcome.body')}</p>
      <ul className="list-plain" style={{ gap: 'var(--space-4)' }}>
        {points.map((p) => (
          <li key={p.text} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span className="tile" style={{ inlineSize: 44, blockSize: 44, borderRadius: 22, color: 'var(--c-primary)' }}>{p.icon}</span>
            {p.text}
          </li>
        ))}
      </ul>
      <div className="spacer" />
      <button type="button" className="btn btn--primary" onClick={start}>
        {t('welcome.start')}
      </button>
      <Link to="/settings" className="btn btn--quiet" style={{ alignSelf: 'center' }}>
        {t('welcome.accessibility')}
      </Link>
    </Screen>
  );
}
