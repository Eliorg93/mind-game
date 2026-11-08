import { Link } from 'react-router-dom';
import { useT } from '@/app/state';
import { Screen } from '@/ui/Layout';

export default function NotFoundScreen() {
  const { t } = useT();
  return (
    <Screen>
      <h1 className="display">{t('errors.notFound')}</h1>
      <div className="spacer" />
      <Link to="/" className="btn btn--primary">{t('actions.toHome')}</Link>
    </Screen>
  );
}
