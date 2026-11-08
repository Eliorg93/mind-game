import { useEffect, useRef, useState } from 'react';
import { useT } from '@/app/state';
import { OBJECT_NAMES, SPOT_AT, SPOT_NAMES, type SpotId } from '@/content/he/objects';
import type { GameProps } from '../types';
import { Actions, Feedback, HintButton, HintNudge, Progress, Review, usePraise } from '../kit/Kit';
import { ObjectArt } from '../kit/ObjectArt';
import { SpotArt } from '../kit/SpotArt';
import { currentPlacement, firstTryCount, foundPlacements, guess, hint, isWhereState, newWhere, nextRound, retryRound, sessionAccuracy, startRecall, whereStats, type WhereState } from './logic';
import './where.css';

export default function WhereIsItGame({ level, resume, onStateChange, onComplete, feedback, support }: GameProps<WhereState>) {
  const { t } = useT();
  const praise = usePraise();
  const [s, setS] = useState<WhereState>(() => (isWhereState(resume) ? resume : newWhere(level)));
  const [msg, setMsg] = useState<{ text: string; tone: 'positive' | 'gentle' | 'info' } | null>(null);
  const [praiseN, setPraiseN] = useState(0);
  const reported = useRef(false);
  const r = s.round;
  const cols = r.spots.length <= 4 ? 2 : 3;

  const set = (next: WhereState) => {
    setS(next);
    onStateChange(next);
  };

  useEffect(() => {
    if (s.phase === 'done' && !reported.current) {
      reported.current = true;
      feedback.tone('complete');
      onComplete({ accuracy: sessionAccuracy(s), completed: true, ...whereStats(s) });
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

  const progress = <Progress current={s.roundIndex + 1} total={s.rounds} />;
  const objAt = (spot: SpotId, list: { obj: keyof typeof OBJECT_NAMES; spot: SpotId }[]) => list.find((p) => p.spot === spot)?.obj;

  if (s.phase === 'study') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {progress}
        <p className="prompt-big">{t('games.where-is-it.studyPrompt', { count: r.placements.length })}</p>
        <ul className="room" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-label={t('games.where-is-it.roomLabel')}>
          {r.spots.map((spot) => {
            const obj = objAt(spot, r.placements);
            return (
              <li key={spot} className={`spot${obj ? ' spot--has' : ''}`} data-spot={spot} data-obj={obj}>
                <SpotArt id={spot} size={34} />
                <span className="spot__name">{SPOT_NAMES[spot]}</span>
                {obj && (
                  <span className="spot__obj">
                    <ObjectArt id={obj} size={40} />
                    <span className="item-label">{OBJECT_NAMES[obj]}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="muted small">{t('kit.noRush')}</p>
        <Actions>
          <button type="button" className="btn btn--primary" onClick={() => { setMsg(null); set(startRecall(s)); }}>{t('kit.ready')}</button>
        </Actions>
      </div>
    );
  }

  if (s.phase === 'recall') {
    const p = currentPlacement(s)!;
    const found = foundPlacements(s);
    const onGuess = (spot: SpotId) => {
      const res = guess(s, spot);
      if (res.outcome === 'ignored') return;
      if (res.outcome === 'correct') {
        feedback.tone('match');
        setMsg({ text: `${praise(praiseN)} ${t('games.where-is-it.foundAt', { item: OBJECT_NAMES[p.obj], at: SPOT_AT[p.spot] })}`, tone: 'positive' });
        setPraiseN((n) => n + 1);
      } else {
        feedback.tone('tap');
        setMsg({ text: t('games.where-is-it.notHere', { at: SPOT_AT[spot] }), tone: 'gentle' });
      }
      set(res.state);
    };
    const onHint = () => { set(hint(s)); setMsg({ text: t('games.where-is-it.hint'), tone: 'info' }); };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {progress}
        <div className="where-ask" data-obj={p.obj}>
          <ObjectArt id={p.obj} size={56} />
          <p className="prompt-big">{t('games.where-is-it.askPrompt', { item: OBJECT_NAMES[p.obj] })}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="muted">{t('games.where-is-it.itemOf', { n: r.ask + 1, total: r.placements.length })}</span>
          <HintButton onClick={onHint} disabled={!!r.narrowed} />
        </div>
        <div className="room" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="group" aria-label={t('games.where-is-it.roomLabel')}>
          {r.spots.map((spot) => {
            const placed = objAt(spot, found);
            const wrong = r.wrong.includes(spot);
            const dimmed = !!r.narrowed && !r.narrowed.includes(spot);
            const highlighted = !!r.narrowed && r.narrowed.includes(spot);
            return (
              <button
                key={spot}
                type="button"
                className={`spot spot--btn${wrong ? ' spot--wrong' : ''}${dimmed ? ' spot--dim' : ''}${highlighted ? ' spot--hint' : ''}${placed ? ' spot--has' : ''}`}
                onClick={() => onGuess(spot)}
                disabled={wrong || dimmed}
                aria-label={`${SPOT_NAMES[spot]}${placed ? `, ${OBJECT_NAMES[placed]}` : ''}${wrong ? `, ${t('games.where-is-it.notHereShort')}` : ''}`}
                data-testid="spot"
                data-spot={spot}
              >
                <SpotArt id={spot} size={34} />
                <span className="spot__name">{SPOT_NAMES[spot]}</span>
                {placed && <span className="spot__obj"><ObjectArt id={placed} size={32} /></span>}
              </button>
            );
          })}
        </div>
        {msg && <Feedback text={msg.text} tone={msg.tone} />}
        {!r.narrowed && !r.current.hinted && r.current.wrongTries >= (support?.hintOfferAfter ?? 2) && <HintNudge onHint={onHint} />}
      </div>
    );
  }

  const first = firstTryCount(s);
  const total = r.placements.length;
  const last = s.roundIndex + 1 >= s.rounds;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {progress}
      <Review
        title={first === total ? praise(s.roundIndex) : t('games.where-is-it.result')}
        message={first === total ? t('games.where-is-it.perfect') : t('games.where-is-it.firstTry', { count: first, total })}
        onRetry={() => { setMsg(null); set(retryRound(s)); }}
        onContinue={() => { setMsg(null); set(nextRound(s)); }}
        continueLabel={last ? t('kit.finish') : t('kit.nextRound')}
      />
    </div>
  );
}
