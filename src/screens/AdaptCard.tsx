import { useState } from 'react';
import { useAppState, useT } from '@/app/state';
import type { GameMeta } from '@/core/games/types';
import type { SessionRecord } from '@/core/storage/db';
import { respondToAdaptation } from '@/core/storage/progress';
import { IconBulb } from '@/ui/icons';

type Resp = 'accepted' | 'declined' | 'kept';

/**
 * A friendly suggestion after an activity. It never shows numbers or scores:
 * only what changes next time and a way to say "no thanks".
 */
export function AdaptCard({ session, meta }: { session: SessionRecord; meta: GameMeta }) {
  const { t } = useT();
  const { settings } = useAppState();
  const a = session.adapt;
  const [response, setResponse] = useState<Resp | undefined>(a?.response);
  const [busy, setBusy] = useState(false);
  if (!a) return null;

  const respond = async (r: Resp) => {
    setBusy(true);
    try {
      await respondToAdaptation(meta, session.id, r, settings.challenge);
      setResponse(r);
    } finally {
      setBusy(false);
    }
  };

  let kind: 'up' | 'offer' | 'down' | 'hints' | 'steady';
  if (a.change === 'up') kind = 'up';
  else if (a.offer === 'challenge') kind = 'offer';
  else if (a.change === 'down') kind = 'down';
  else if (a.offer === 'hints') kind = 'hints';
  else kind = 'steady';

  const done = response !== undefined;
  const confirm = response ? t(`adapt.done.${response === 'kept' ? (kind === 'up' ? 'keptSame' : 'keptEasy') : response}`) : '';

  return (
    <section className="card card--sage adapt-card" aria-labelledby="adapt-title" data-testid="adapt-card" data-kind={kind}>
      <h2 id="adapt-title" style={{ fontSize: 'var(--fs-body)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {kind === 'hints' && <IconBulb />}
        {t(`adapt.${kind}.title`)}
      </h2>
      {!done && <p className="small">{t(`adapt.${kind}.body`)}</p>}
      {done && <p className="small" role="status">{confirm}</p>}
      {!done && kind === 'up' && (
        <button type="button" className="btn btn--quiet" disabled={busy} onClick={() => void respond('kept')}>{t('adapt.up.keep')}</button>
      )}
      {!done && kind === 'offer' && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--secondary" disabled={busy} onClick={() => void respond('accepted')}>{t('adapt.offer.accept')}</button>
          <button type="button" className="btn btn--quiet" disabled={busy} onClick={() => void respond('declined')}>{t('adapt.offer.decline')}</button>
        </div>
      )}
      {!done && kind === 'down' && (
        <button type="button" className="btn btn--quiet" disabled={busy} onClick={() => void respond('kept')}>{t('adapt.down.keep')}</button>
      )}
    </section>
  );
}
