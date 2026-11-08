import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useT } from '@/app/state';
import type { GameProps } from '../types';
import { Actions, Choice, Feedback, HintButton, Progress, ReadAloud, Review, Toolbar, usePraise, type ChoiceState } from './Kit';
import { check, hint, isRecallState, newRecall, nextRound, retryRound, roundResult, sessionAccuracy, startRecall, toggle, type RecallConfig, type RecallState } from './recallEngine';

/**
 * Generic UI for "look, hide, pick what you saw". Each game supplies how items
 * look while studying and as choices; everything else is shared.
 */
export interface RecallGameSpec {
  gameId: string;
  config: RecallConfig;
  columns: 2 | 3;
  renderStudy: (targets: string[]) => ReactNode;
  renderChoice: (id: string) => { content: ReactNode; label: string };
  studyReadText?: (targets: string[]) => string;
  hintText: (id: string) => string;
}

export function RecallGame({ spec, level, resume, onStateChange, onComplete, feedback }: GameProps<RecallState> & { spec: RecallGameSpec }) {
  const { t } = useT();
  const praise = usePraise();
  const [s, setS] = useState<RecallState>(() => (isRecallState(resume, spec.config.pool) ? resume : newRecall(spec.config, level)));
  const [msg, setMsg] = useState<{ text: string; tone: 'positive' | 'gentle' | 'info' } | null>(null);
  const reported = useRef(false);
  const p = (k: string, o?: Record<string, unknown>) => t(`games.${spec.gameId}.${k}`, o);
  const r = s.round;
  const k = r.targets.length;

  const set = (next: RecallState) => {
    setS(next);
    onStateChange(next);
  };

  useEffect(() => {
    if (s.phase === 'done' && !reported.current) {
      reported.current = true;
      feedback.tone('complete');
      onComplete({ accuracy: sessionAccuracy(s), completed: true });
    }
  }, [s, onComplete, feedback]);

  if (s.phase === 'done') {
    return (
      <section className="kit-review" aria-labelledby="done-title">
        <h2 id="done-title" className="title">{t('kit.allDoneTitle')}</h2>
        <p className="lead muted">{t('kit.allDoneBody')}</p>
      </section>
    );
  }

  const progress = <Progress current={s.roundIndex + 1} total={s.rounds} />;

  if (s.phase === 'study') {
    return (
      <div className="kit-screen" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {progress}
        <p className="prompt-big">{p('studyPrompt', { count: k })}</p>
        {spec.studyReadText && (
          <Toolbar>
            <ReadAloud text={spec.studyReadText(r.targets)} label={t('kit.readList')} />
          </Toolbar>
        )}
        {spec.renderStudy(r.targets)}
        <p className="muted small">{t('kit.noRush')}</p>
        <Actions>
          <button type="button" className="btn btn--primary" onClick={() => { setMsg(null); set(startRecall(s)); }}>
            {t('kit.ready')}
          </button>
        </Actions>
      </div>
    );
  }

  if (s.phase === 'recall') {
    const onPick = (id: string) => {
      const { state, outcome } = toggle(s, id);
      if (outcome === 'full') setMsg({ text: t('kit.selectionFull', { count: k }), tone: 'info' });
      else if (outcome !== 'ignored') {
        feedback.tone('tap');
        setMsg(null);
        set(state);
      }
    };
    const onHint = () => {
      const { state, revealed } = hint(s);
      if (revealed) {
        set(state);
        setMsg({ text: spec.hintText(revealed), tone: 'info' });
      }
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {progress}
        <p className="prompt-big">{p('recallPrompt', { count: k })}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <span className="muted" aria-live="polite">{t('kit.selectedOf', { n: r.selected.length, total: k })}</span>
          <HintButton onClick={onHint} disabled={r.selected.filter((x) => r.targets.includes(x)).length >= k} />
        </div>
        <div className={`choice-grid${spec.columns === 2 ? ' choice-grid--2' : ''}`} role="group" aria-label={p('gridLabel')}>
          {r.choices.map((id) => {
            const { content, label } = spec.renderChoice(id);
            const state: ChoiceState = r.hinted.includes(id) ? 'hint' : r.selected.includes(id) ? 'selected' : 'idle';
            return (
              <Choice key={id} state={state} onClick={() => onPick(id)} ariaLabel={label} testId="recall-choice" size={spec.columns === 3 ? 'tile' : 'normal'}>
                {content}
              </Choice>
            );
          })}
        </div>
        {msg && <Feedback text={msg.text} tone={msg.tone} />}
        <Actions>
          <button type="button" className="btn btn--primary" disabled={r.selected.length === 0} onClick={() => { setMsg(null); set(check(s)); }}>
            {t('kit.check')}
          </button>
        </Actions>
      </div>
    );
  }

  // review
  const res = roundResult(r);
  const perfect = res.hits === res.total && res.falseAlarms === 0;
  const last = s.roundIndex + 1 >= s.rounds;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {progress}
      <Review
        title={perfect ? praise(s.roundIndex) : t('kit.recallResult', { hits: res.hits, total: res.total })}
        message={perfect ? t('kit.recallPerfect') : res.misses > 0 ? t('kit.recallMissedNote') : t('kit.recallExtraNote')}
        onRetry={() => { setMsg(null); set(retryRound(s)); }}
        onContinue={() => { setMsg(null); set(nextRound(spec.config, s)); }}
        continueLabel={last ? t('kit.finish') : t('kit.nextRound')}
      >
        <div className={`choice-grid${spec.columns === 2 ? ' choice-grid--2' : ''}`} role="list" aria-label={t('kit.reviewList')}>
          {r.choices
            .filter((id) => r.targets.includes(id) || r.selected.includes(id))
            .map((id) => {
              const { content, label } = spec.renderChoice(id);
              const isT = r.targets.includes(id);
              const isS = r.selected.includes(id);
              const state: ChoiceState = isT && isS ? (r.hinted.includes(id) ? 'hint' : 'correct') : isT ? 'missed' : 'wrong';
              return (
                <div role="listitem" key={id}>
                  <Choice state={state} ariaLabel={label} size={spec.columns === 3 ? 'tile' : 'normal'} disabled>
                    {content}
                  </Choice>
                </div>
              );
            })}
        </div>
      </Review>
    </div>
  );
}

