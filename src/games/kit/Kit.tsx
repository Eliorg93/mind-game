import { useEffect, useState, type ReactNode } from 'react';
import { useT } from '@/app/state';
import { speak, speechSupported, stopSpeaking } from '@/core/speech/speech';
import { IconBulb, IconCheck, IconSpeaker, IconStop } from '@/ui/icons';
import './kit.css';

/**
 * Shared building blocks for every game, so all games look and behave the same:
 * big choices, a hint button, read-aloud, gentle feedback, progress and a review
 * step with "try again".
 */

export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong' | 'missed' | 'eliminated' | 'hint';

export function Choice(props: {
  state?: ChoiceState;
  onClick?: () => void;
  children: ReactNode;
  ariaLabel?: string;
  testId?: string;
  disabled?: boolean;
  size?: 'normal' | 'tile';
}) {
  const state = props.state ?? 'idle';
  const { t } = useT();
  const marker =
    state === 'correct' ? t('kit.markCorrect') : state === 'wrong' ? t('kit.markWrong') : state === 'missed' ? t('kit.markMissed') : state === 'hint' ? t('kit.markHint') : '';
  return (
    <button
      type="button"
      className={`choice choice--${state}${props.size === 'tile' ? ' choice--tile' : ''}`}
      onClick={props.onClick}
      disabled={props.disabled || state === 'eliminated'}
      aria-pressed={state === 'selected' || state === 'correct' || state === 'hint' ? true : undefined}
      aria-label={props.ariaLabel ? (marker ? `${props.ariaLabel}, ${marker}` : props.ariaLabel) : undefined}
      data-testid={props.testId}
      data-state={state}
    >
      {props.children}
      {(state === 'correct' || state === 'selected' || state === 'hint') && (
        <span className="choice__badge" aria-hidden="true"><IconCheck size={16} /></span>
      )}
      {marker && !props.ariaLabel && <span className="visually-hidden">{marker}</span>}
    </button>
  );
}

export function Progress({ current, total, kind = 'round' }: { current: number; total: number; kind?: 'round' | 'question' }) {
  const { t } = useT();
  return (
    <div className="kit-progress">
      <span className="muted small" style={{ fontWeight: 600 }}>
        {t(kind === 'round' ? 'kit.roundOf' : 'kit.questionOf', { n: current, total })}
      </span>
      <span className="kit-progress__dots" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < current - 1 ? 'is-done' : i === current - 1 ? 'is-now' : ''} />
        ))}
      </span>
    </div>
  );
}

export function HintButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const { t } = useT();
  return (
    <button type="button" className="kit-tool" onClick={onClick} disabled={disabled}>
      <IconBulb />
      {t('kit.hint')}
    </button>
  );
}

/** Reads text aloud with the device voice. Renders nothing where speech is unavailable. */
export function ReadAloud({ text, label, autoRead = false }: { text: string; label?: string; autoRead?: boolean }) {
  const { t } = useT();
  const [reading, setReading] = useState(false);
  const supported = speechSupported();
  useEffect(() => {
    if (autoRead && supported && speak(text, { onEnd: () => setReading(false) })) setReading(true);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  if (!supported) return null;
  const toggle = () => {
    if (reading) {
      stopSpeaking();
      setReading(false);
    } else if (speak(text, { onEnd: () => setReading(false) })) setReading(true);
  };
  return (
    <button type="button" className="kit-tool" onClick={toggle} aria-pressed={reading}>
      {reading ? <IconStop /> : <IconSpeaker />}
      {reading ? t('kit.stopReading') : label ?? t('kit.readAloud')}
    </button>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="kit-toolbar">{children}</div>;
}

export function Feedback({ text, tone = 'info' }: { text: string; tone?: 'positive' | 'gentle' | 'info' }) {
  return (
    <p className={`kit-feedback kit-feedback--${tone}`} aria-live="polite" role="status">
      {text}
    </p>
  );
}

/** Varied, adult, gender-neutral praise. Deterministic by counter (stable in tests). */
export function usePraise() {
  const { t } = useT();
  const list = t('kit.praise', { returnObjects: true }) as unknown as string[];
  return (n: number) => (Array.isArray(list) && list.length ? list[n % list.length]! : '');
}

export function Review(props: { title: string; message?: string; children?: ReactNode; onRetry: () => void; onContinue: () => void; continueLabel: string }) {
  const { t } = useT();
  return (
    <section className="kit-review" aria-labelledby="review-title">
      <h2 id="review-title" className="title">{props.title}</h2>
      {props.message && <p className="lead muted">{props.message}</p>}
      {props.children}
      <div className="kit-actions">
        <button type="button" className="btn btn--primary" onClick={props.onContinue}>{props.continueLabel}</button>
        <button type="button" className="btn btn--secondary" onClick={props.onRetry}>{t('kit.retry')}</button>
      </div>
    </section>
  );
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="kit-actions">{children}</div>;
}

/** Shown when someone is stuck: a friendly offer, never a judgement. */
export function HintNudge({ onHint }: { onHint: () => void }) {
  const { t } = useT();
  return (
    <div className="kit-nudge" role="note">
      <span>{t('kit.nudge')}</span>
      <button type="button" className="kit-tool" onClick={onHint}>
        <IconBulb />
        {t('kit.showHint')}
      </button>
    </div>
  );
}

/** A short explanation after a question that took more than one try. */
export function Explanation({ text }: { text: string }) {
  const { t } = useT();
  return (
    <p className="clue" role="note">
      <b>{t('kit.explainPrefix')}</b> {text}
    </p>
  );
}
