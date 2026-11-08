import { useEffect, useRef, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useT } from '@/app/state';
import { IconBack, IconBookHeart, IconClose, IconHome, IconSettings, IconSprout } from './icons';

export function Screen({ children, withNav = false, label }: { children: ReactNode; withNav?: boolean; label?: string }) {
  const ref = useRef<HTMLElement>(null);
  // Move focus to the new screen's heading so screen readers announce it.
  useEffect(() => {
    const h = ref.current?.querySelector<HTMLElement>('h1');
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }, []);
  return (
    <main ref={ref} className={`screen${withNav ? ' screen--with-nav' : ''}`} aria-label={label}>
      {children}
    </main>
  );
}

export function BackLink({ to = '/' }: { to?: string }) {
  const { t } = useT();
  return (
    <Link to={to} className="topbar__action">
      <IconBack />
      {t('actions.back')}
    </Link>
  );
}

export function ExitLink({ to = '/' }: { to?: string }) {
  const { t } = useT();
  return (
    <Link to={to} className="topbar__action">
      <IconClose />
      {t('actions.exit')}
    </Link>
  );
}

export function SettingsLink() {
  const { t } = useT();
  return (
    <Link to="/settings" className="icon-tile-btn">
      <IconSettings />
      {t('actions.settings')}
    </Link>
  );
}

export function BottomNav() {
  const { t } = useT();
  const items = [
    { to: '/', label: t('nav.home'), icon: <IconHome />, end: true },
    { to: '/garden', label: t('nav.garden'), icon: <IconSprout />, end: false },
    { to: '/memories', label: t('nav.memories'), icon: <IconBookHeart />, end: false },
  ];
  return (
    <nav className="bottom-nav" aria-label={t('nav.label')}>
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end}>
          {it.icon}
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Accessible confirm sheet: focus moves in, Escape cancels. */
export function ConfirmSheet(props: { title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useT();
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && props.onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);
  return (
    <div className="overlay" onClick={props.onCancel}>
      <div className="sheet" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title" className="title">{props.title}</h2>
        <p id="confirm-body" className="muted">{props.body}</p>
        <button ref={first} type="button" className="btn btn--secondary" onClick={props.onCancel}>
          {t('actions.cancel')}
        </button>
        <button type="button" className="btn btn--primary" onClick={props.onConfirm}>
          {props.confirmLabel}
        </button>
      </div>
    </div>
  );
}
