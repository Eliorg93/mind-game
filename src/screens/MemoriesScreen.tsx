import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoad, useT } from '@/app/state';
import { listMemories, promptIndexForDay } from '@/core/memories/memories';
import { formatHebrewDate } from '@/core/time/time';
import { BottomNav, Screen } from '@/ui/Layout';
import { IconForward, IconImage, IconLock, IconPen, IconPlus } from '@/ui/icons';

export const PROMPT_COUNT = 10;

export default function MemoriesScreen() {
  const { t } = useT();
  const navigate = useNavigate();
  const { data } = useLoad(listMemories);
  const [sheet, setSheet] = useState(false);
  const prompt = t(`memories.prompts.${promptIndexForDay(Date.now(), PROMPT_COUNT)}`);
  const go = (type: 'text' | 'photo') => navigate(`/memories/new?type=${type}&prompt=${encodeURIComponent(prompt)}`);

  return (
    <>
      <Screen withNav>
        <header>
          <h1 className="display">{t('memories.title')}</h1>
          <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><IconLock />{t('memories.private')}</p>
        </header>

        <section className="card--hero" style={{ background: 'var(--c-surface)' }} aria-labelledby="prompt">
          <span className="eyebrow">{t('memories.promptLabel')}</span>
          <p id="prompt" className="prompt-text">{prompt}</p>
          <button type="button" className="btn btn--primary" onClick={() => setSheet(true)}>
            <IconPlus />{t('memories.add')}
          </button>
        </section>

        {data && data.length === 0 && <p className="muted">{t('memories.empty')}</p>}
        {data && data.length > 0 && (
          <section aria-labelledby="saved-title" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h2 id="saved-title" className="lead" style={{ fontWeight: 700 }}>{t('memories.count', { count: data.length })}</h2>
            <ul className="list-plain">
              {data.map((m) => (
                <li key={m.id}>
                  <Link to={`/memories/${m.id}`} className="row-link">
                    <span className="tile" style={{ background: m.kind === 'photo' ? 'var(--c-sage)' : '#F6E3D6', color: m.kind === 'photo' ? 'var(--c-leaf)' : '#9A4F2C' }}>
                      {m.kind === 'photo' ? <IconImage /> : <IconPen />}
                    </span>
                    <span className="row-link__body">
                      <span className="row-link__title">{m.title}</span>
                      <span className="muted small">{t(`memories.kind_${m.kind}`)} · {formatHebrewDate(m.createdAt)}</span>
                    </span>
                    <IconForward className="chevron" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Screen>
      <BottomNav />
      {sheet && <AddSheet onPick={go} onClose={() => setSheet(false)} />}
    </>
  );
}

function AddSheet({ onPick, onClose }: { onPick: (type: 'text' | 'photo') => void; onClose: () => void }) {
  const { t } = useT();
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="sheet-title" className="title">{t('memories.sheetTitle')}</h2>
        <button ref={first} type="button" className="sheet-option" onClick={() => onPick('text')}><IconPen />{t('memories.writeOption')}</button>
        <button type="button" className="sheet-option" onClick={() => onPick('photo')}><IconImage />{t('memories.photoOption')}</button>
        <button type="button" className="btn btn--quiet" style={{ alignSelf: 'center' }} onClick={onClose}>{t('actions.cancel')}</button>
      </div>
    </div>
  );
}
