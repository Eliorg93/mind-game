import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useT } from '@/app/state';
import type { GameProps } from '../types';
import { Actions, Choice, Feedback, HintButton, Progress, ReadAloud, Review, Toolbar, usePraise, type ChoiceState } from './Kit';
import { accuracy, answer, beginQuestions, currentQuestion, finish, firstTryCorrect, giveHint, isQuizState, next, retry, type QuizQuestion, type QuizState } from './quizEngine';

export interface QuizGameSpec {
  gameId: string;
  create: (level: number) => QuizState;
  /** Shown before the questions when the state has an intro (e.g. the story). */
  renderIntro?: (s: QuizState, begin: () => void) => ReactNode;
  /** Optional picture for a question (e.g. a shape pattern). */
  renderVisual?: (q: QuizQuestion) => ReactNode;
  /** Optional custom content for an option (e.g. a shape instead of text). */
  renderOption?: (q: QuizQuestion, option: string) => { content: ReactNode; label: string } | null;
  /** Lay options out in two columns when they are short. */
  twoColumns?: (q: QuizQuestion) => boolean;
}

export function QuizGame({ spec, level, resume, onStateChange, onComplete, feedback }: GameProps<QuizState> & { spec: QuizGameSpec }) {
  const { t } = useT();
  const praise = usePraise();
  const [s, setS] = useState<QuizState>(() => (isQuizState(resume, spec.gameId) ? resume : spec.create(level)));
  const [msg, setMsg] = useState<{ text: string; tone: 'positive' | 'gentle' | 'info' } | null>(null);
  const [praiseN, setPraiseN] = useState(0);
  const reported = useRef(false);
  const g = (k: string, o?: Record<string, unknown>) => t(`games.${spec.gameId}.${k}`, o);

  const set = (n: QuizState) => {
    setS(n);
    onStateChange(n);
  };

  useEffect(() => {
    if (s.phase === 'done' && !reported.current) {
      reported.current = true;
      feedback.tone('complete');
      onComplete({ accuracy: accuracy(s), completed: true });
    }
  }, [s, onComplete, feedback]);

  if (s.phase === 'done') {
    return (
      <section className="kit-review">
        <h2 className="title">{t('kit.allDoneTitle')}</h2>
        <p className="lead muted">{t('kit.allDoneBody')}</p>
      </section>
    );
  }

  if (s.phase === 'intro' && spec.renderIntro) return <>{spec.renderIntro(s, () => { setMsg(null); set(beginQuestions(s)); })}</>;

  if (s.phase === 'review') {
    const first = firstTryCorrect(s);
    const total = s.questions.length;
    return (
      <Review
        title={first === total ? praise(s.attempt) : t('kit.quizResult', { count: first, total })}
        message={first === total ? t('kit.quizPerfect') : t('kit.quizNote')}
        onRetry={() => { setMsg(null); set(retry(s)); }}
        onContinue={() => set(finish(s))}
        continueLabel={t('kit.finish')}
      />
    );
  }

  const q = currentQuestion(s)!;
  const c = s.cur;
  const last = s.index + 1 >= s.questions.length;

  const onAnswer = (i: number) => {
    const res = answer(s, i);
    if (res.outcome === 'ignored') return;
    if (res.outcome === 'correct') {
      feedback.tone('match');
      setMsg({ text: praise(praiseN), tone: 'positive' });
      setPraiseN((n) => n + 1);
    } else if (res.outcome === 'step') {
      feedback.tone('tap');
      setMsg({ text: t('kit.stepOk'), tone: 'positive' });
    } else {
      feedback.tone('tap');
      setMsg({ text: q.shape === 'order' ? t('kit.notNextStep') : t('kit.tryAgain'), tone: 'gentle' });
    }
    set(res.state);
  };

  const onHint = () => {
    set(giveHint(s));
    if (q.shape === 'order') setMsg({ text: t('kit.hintNextStep'), tone: 'info' });
    else if (q.hint.kind === 'eliminate') setMsg({ text: t('kit.hintEliminated'), tone: 'info' });
    else setMsg(null);
  };

  const readText = [q.prompt, q.detail ?? '', ...(q.shape === 'choice' ? q.options : [])].filter(Boolean).join('. ');
  const optionView = (opt: string) => spec.renderOption?.(q, opt) ?? { content: <span>{opt}</span>, label: opt };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Progress current={s.index + 1} total={s.questions.length} kind="question" />
      <p className="eyebrow">{g(`types.${q.type}`)}</p>
      <p className="prompt-big">{q.prompt}</p>
      {q.detail && <p className="prompt-quote">{q.detail}</p>}
      {spec.renderVisual?.(q)}
      <Toolbar>
        <HintButton onClick={onHint} disabled={c.solved || c.hinted} />
        {!spec.renderOption && <ReadAloud text={readText} label={t('kit.readQuestion')} />}
      </Toolbar>
      {c.hinted && q.hint.kind === 'text' && (
        <p className="clue" role="note"><b>{t('kit.hintPrefix')}</b> {q.hint.text}</p>
      )}

      {q.shape === 'order' && (
        <div className="study-card" aria-live="polite">
          <p className="eyebrow">{t('kit.yourOrder')}</p>
          {c.placed.length === 0 ? (
            <p className="muted">{t('kit.orderEmpty')}</p>
          ) : (
            <ol className="study-list" style={{ listStyle: 'none' }}>
              {c.placed.map((i, n) => (
                <li key={i} style={{ fontSize: 'var(--fs-lead)' }}><span className="step-num" style={{ marginInlineEnd: 'var(--space-3)' }}>{n + 1}</span>{q.options[i]}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className={spec.twoColumns?.(q) ? 'choice-grid choice-grid--2' : 'choice-list'} role="group" aria-label={t('kit.options')}>
        {q.options.map((opt, i) => {
          if (q.shape === 'order' && c.placed.includes(i)) return null;
          const isAnswer = q.shape === 'choice' && i === q.answer;
          const state: ChoiceState =
            c.solved && isAnswer ? 'correct' : c.wrong.includes(i) ? 'wrong' : c.eliminated.includes(i) ? 'eliminated' : c.hintIndex === i ? 'hint' : 'idle';
          const v = optionView(opt);
          return (
            <Choice key={`${q.id}-${i}`} state={state} onClick={() => onAnswer(i)} ariaLabel={v.label} testId="quiz-option" disabled={c.solved && !isAnswer}>
              {v.content}
            </Choice>
          );
        })}
      </div>

      {msg && <Feedback text={msg.text} tone={msg.tone} />}
      {c.solved && (
        <Actions>
          <button type="button" className="btn btn--primary" onClick={() => { setMsg(null); set(next(s)); }}>
            {last ? t('kit.toSummary') : t('kit.continue')}
          </button>
        </Actions>
      )}
    </div>
  );
}
