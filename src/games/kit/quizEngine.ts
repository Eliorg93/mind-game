/**
 * Shared logic for question-based games (story, words, sequences & logic).
 * Two question shapes:
 *  - 'choice': pick one option. Wrong picks are marked and the player tries again.
 *  - 'order':  tap the options in the right order (e.g. steps of a routine).
 * Questions are stored as plain data inside the state, so resume always works.
 */
import { averageCredit, type ItemOutcome } from './scoring';
import { pick, type Rng } from './random';

export type HintSpec = { kind: 'eliminate' } | { kind: 'text'; text: string };

export interface QuizQuestion {
  id: string;
  shape: 'choice' | 'order';
  /** Task type, used for the label above the question (e.g. "השלמת ביטוי"). */
  type: string;
  prompt: string;
  /** Optional second line, e.g. a quoted saying or a number series. */
  detail?: string;
  options: string[];
  /** choice: index of the right option. order: indexes of options in the right order. */
  answer: number | number[];
  hint: HintSpec;
  /** Optional visual payload rendered by the game (e.g. a shape pattern). */
  visual?: unknown;
  /** Short explanation shown after the question was solved with extra tries or a hint. */
  explain?: string;
}

export interface QuizCurrent {
  wrong: number[];
  eliminated: number[];
  placed: number[];
  hinted: boolean;
  solved: boolean;
  /** Every wrong tap in this question (order questions clear `wrong` marks per step). */
  wrongTotal: number;
  /** For order questions: the option highlighted by a hint. */
  hintIndex: number | null;
}

export interface QuizState {
  kind: 'quiz';
  game: string;
  phase: 'intro' | 'question' | 'review' | 'done';
  hasIntro: boolean;
  level: number;
  questions: QuizQuestion[];
  index: number;
  cur: QuizCurrent;
  outcomes: ItemOutcome[];
  attempt: number;
  /** Free-form game data, e.g. the story being asked about. */
  meta?: unknown;
}

const freshCur = (): QuizCurrent => ({ wrong: [], eliminated: [], placed: [], hinted: false, solved: false, wrongTotal: 0, hintIndex: null });

export function newQuiz(game: string, level: number, questions: QuizQuestion[], opts: { hasIntro?: boolean; meta?: unknown } = {}): QuizState {
  return { kind: 'quiz', game, phase: opts.hasIntro ? 'intro' : 'question', hasIntro: !!opts.hasIntro, level, questions, index: 0, cur: freshCur(), outcomes: [], attempt: 1, meta: opts.meta };
}

export function currentQuestion(s: QuizState): QuizQuestion | undefined {
  return s.questions[s.index];
}

export function beginQuestions(s: QuizState): QuizState {
  return s.phase === 'intro' ? { ...s, phase: 'question' } : s;
}

export type AnswerOutcome = 'correct' | 'wrong' | 'step' | 'ignored';

export function answer(s: QuizState, option: number): { state: QuizState; outcome: AnswerOutcome } {
  const q = currentQuestion(s);
  const c = s.cur;
  if (s.phase !== 'question' || !q || c.solved || option < 0 || option >= q.options.length) return { state: s, outcome: 'ignored' };
  if (c.wrong.includes(option) || c.eliminated.includes(option) || c.placed.includes(option)) return { state: s, outcome: 'ignored' };

  if (q.shape === 'choice') {
    if (option === q.answer) return { state: { ...s, cur: { ...c, solved: true } }, outcome: 'correct' };
    return { state: { ...s, cur: { ...c, wrong: [...c.wrong, option], wrongTotal: c.wrongTotal + 1 } }, outcome: 'wrong' };
  }
  const order = q.answer as number[];
  const expected = order[c.placed.length];
  if (option !== expected) return { state: { ...s, cur: { ...c, wrong: [...c.wrong, option], wrongTotal: c.wrongTotal + 1 } }, outcome: 'wrong' };
  const placed = [...c.placed, option];
  const solved = placed.length === order.length;
  // A wrong tap only marks the option for this step; it is cleared once the right one is placed.
  return { state: { ...s, cur: { ...c, placed, wrong: [], hintIndex: null, solved } }, outcome: solved ? 'correct' : 'step' };
}

export function giveHint(s: QuizState, rng: Rng = Math.random): QuizState {
  const q = currentQuestion(s);
  const c = s.cur;
  if (s.phase !== 'question' || !q || c.solved) return s;
  if (q.shape === 'order') {
    const next = (q.answer as number[])[c.placed.length] ?? null;
    return { ...s, cur: { ...c, hinted: true, hintIndex: next } };
  }
  if (q.hint.kind === 'text') return { ...s, cur: { ...c, hinted: true } };
  const candidates = q.options.map((_, i) => i).filter((i) => i !== q.answer && !c.wrong.includes(i) && !c.eliminated.includes(i));
  if (candidates.length <= 1) return { ...s, cur: { ...c, hinted: true } }; // keep at least two options
  return { ...s, cur: { ...c, hinted: true, eliminated: [...c.eliminated, pick(candidates, rng)] } };
}

/** Moves on after a solved question; records how it went. */
export function next(s: QuizState): QuizState {
  if (!s.cur.solved) return s;
  const outcomes = [...s.outcomes, { wrongTries: s.cur.wrongTotal, hinted: s.cur.hinted }];
  const index = s.index + 1;
  if (index >= s.questions.length) return { ...s, outcomes, phase: 'review', cur: freshCur() };
  return { ...s, outcomes, index, cur: freshCur() };
}

export function retry(s: QuizState): QuizState {
  return { ...s, phase: s.hasIntro ? 'intro' : 'question', index: 0, cur: freshCur(), outcomes: [], attempt: s.attempt + 1 };
}

export function finish(s: QuizState): QuizState {
  return s.phase === 'review' ? { ...s, phase: 'done' } : s;
}

export function accuracy(s: QuizState): number {
  return averageCredit(s.outcomes);
}

export function firstTryCorrect(s: QuizState): number {
  return s.outcomes.filter((o) => o.wrongTries === 0 && !o.hinted).length;
}

export function isQuizState(x: unknown, game: string): x is QuizState {
  if (!x || typeof x !== 'object') return false;
  const s = x as QuizState;
  return s.kind === 'quiz' && s.game === game && Array.isArray(s.questions) && s.questions.length > 0 && !!s.cur;
}


/** Totals for the adaptation engine. */
export function quizStats(s: QuizState): { items: number; hints: number; wrongTries: number } {
  return { items: s.outcomes.length, hints: s.outcomes.filter((o) => o.hinted).length, wrongTries: s.outcomes.reduce((n, o) => n + o.wrongTries, 0) };
}
