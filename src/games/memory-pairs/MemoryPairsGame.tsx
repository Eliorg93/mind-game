import { useEffect, useRef, useState } from 'react';
import { useT } from '@/app/state';
import type { GameProps } from '../types';
import { ItemArt } from './ItemArt';
import { accuracy, closeOpen, columnsFor, flip, isDone, isFaceUp, isValidState, newGame, type PairsState } from './logic';
import './memory-pairs.css';

const MISS_DELAY_MS = 1400;

export default function MemoryPairsGame({ level, resume, onStateChange, onComplete, feedback }: GameProps<PairsState>) {
  const { t } = useT();
  const [state, setState] = useState<PairsState>(() => (isValidState(resume) ? closeOpen(resume) : newGame(level)));
  const [msg, setMsg] = useState(() => t('games.memory-pairs.msgStart'));
  const timer = useRef<number | undefined>(undefined);
  const reported = useRef(false);
  const total = state.deck.length / 2;
  const name = (i: number) => t(`games.memory-pairs.items.${state.deck[i]}`);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const update = (next: PairsState) => {
    setState(next);
    onStateChange(next);
  };

  const onFlip = (i: number) => {
    const { state: next, outcome } = flip(state, i);
    if (outcome === 'ignored') return;
    update(next);
    if (outcome === 'first') {
      feedback.tone('tap');
      setMsg(t('games.memory-pairs.msgSecond'));
    } else if (outcome === 'match') {
      if (isDone(next)) {
        feedback.tone('complete');
        setMsg(t('games.memory-pairs.msgDone'));
        if (!reported.current) {
          reported.current = true;
          onComplete({ accuracy: accuracy(next), completed: true });
        }
      } else {
        feedback.tone('match');
        setMsg(t('games.memory-pairs.msgMatch', { name: name(i) }));
      }
    } else if (outcome === 'miss') {
      feedback.tone('tap');
      setMsg(t('games.memory-pairs.msgMiss'));
      timer.current = window.setTimeout(() => update(closeOpen(next)), MISS_DELAY_MS);
    }
  };

  const cols = columnsFor(state.deck.length);
  return (
    <div className="pairs">
      <p className="lead muted">
        {t('games.memory-pairs.pairsFound', { found: state.matched.length, total })}
      </p>
      <div className="pairs__grid" role="group" aria-label={t('games.memory-pairs.board')} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} data-cards={state.deck.length}>
        {state.deck.map((item, i) => {
          const up = isFaceUp(state, i);
          const matched = state.matched.includes(item);
          return (
            <button
              key={i}
              type="button"
              className={`pairs__card${up ? ' is-up' : ''}${matched ? ' is-matched' : ''}`}
              onClick={() => onFlip(i)}
              aria-label={up ? t('games.memory-pairs.cardOpen', { n: i + 1, name: name(i) }) : t('games.memory-pairs.cardClosed', { n: i + 1 })}
              aria-pressed={up}
              data-testid="pair-card"
              data-item={item}
            >
              {up ? <ItemArt item={item} size={state.deck.length > 12 ? 40 : 52} /> : <CardBack />}
            </button>
          );
        })}
      </div>
      <p className="pairs__msg" aria-live="polite">{msg}</p>
    </div>
  );
}

function CardBack() {
  return (
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" stroke="#9DB596" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M24 40V22" /><path d="M24 27C15 27 10 20 10 13C18 13 24 18 24 27Z" /><path d="M24 22C24 14 30 8 38 8C38 16 32 22 24 22Z" />
    </svg>
  );
}
