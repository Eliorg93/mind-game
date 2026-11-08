import type { ComponentType } from 'react';
import type { GameResult } from '@/core/games/types';

/**
 * Contract between the game host and every game. A game is a self-contained
 * module: it receives its level and any saved state, reports every change so the
 * host can save it, and reports the result once at the end.
 */
export interface GameProps<S> {
  level: number;
  /** Saved state from an earlier visit, if the player chose to continue. */
  resume?: S;
  onStateChange: (state: S) => void;
  onComplete: (result: GameResult) => void;
  feedback: {
    tone: (t: 'tap' | 'match' | 'complete') => void;
  };
}

export type GameComponent = ComponentType<GameProps<any>>;
