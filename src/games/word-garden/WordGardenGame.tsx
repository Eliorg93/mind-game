import type { GameProps } from '../types';
import { QuizGame, type QuizGameSpec } from '../kit/QuizGame';
import type { QuizState } from '../kit/quizEngine';
import { createWordGame, GAME_ID } from './logic';

const SPEC: QuizGameSpec = {
  gameId: GAME_ID,
  create: (level) => createWordGame(level),
  twoColumns: (q) => q.options.every((o) => o.length <= 9),
};

export default function WordGardenGame(props: GameProps<QuizState>) {
  return <QuizGame spec={SPEC} {...props} />;
}
