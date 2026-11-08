/**
 * Game 6 – sequences and logic: put everyday steps in order, continue a series,
 * spot a shape pattern and solve small everyday puzzles.
 */
import { COLOR_NAMES, COMPARISONS, FRUIT_PLURAL, LETTERS, MONTHS, NAMES, ROUTINES, SEQ_TEXT, SHAPE_NAMES, WEEKDAYS } from '@/content/he/sequences';
import { byLevel, pick, randInt, sample, shuffle, type Rng } from '../kit/random';
import { newQuiz, type QuizQuestion, type QuizState } from '../kit/quizEngine';

export const GAME_ID = 'sequences-logic';
export const QUESTIONS_PER_SESSION = 5;

export type SeqTask = 'order' | 'series' | 'pattern' | 'logic';
export type ShapeKind = keyof typeof SHAPE_NAMES;
export type ColorKind = keyof typeof COLOR_NAMES;
export interface ShapeItem {
  shape: ShapeKind;
  color: ColorKind;
}
export interface PatternVisual {
  items: ShapeItem[];
}

export const encodeShape = (s: ShapeItem) => `${s.shape}|${s.color}`;
export const decodeShape = (v: string): ShapeItem => {
  const [shape, color] = v.split('|') as [ShapeKind, ColorKind];
  return { shape, color };
};
export const shapeLabel = (s: ShapeItem) => `${SHAPE_NAMES[s.shape]} ${COLOR_NAMES[s.color]}`;

export function tasksForLevel(level: number): SeqTask[] {
  return level >= 2 ? ['order', 'series', 'pattern', 'logic'] : ['order', 'series', 'pattern'];
}

/** Choice question with unique options; the answer is kept and duplicates replaced. */
function choice(id: string, type: SeqTask, prompt: string, answer: string, wrong: string[], rng: Rng, detail?: string, visual?: unknown): QuizQuestion {
  const uniq = Array.from(new Set(wrong.filter((w) => w !== answer))).slice(0, 3);
  const options = shuffle([answer, ...uniq], rng);
  return { id, shape: 'choice', type, prompt, detail, options, answer: options.indexOf(answer), hint: { kind: 'eliminate' }, visual };
}

export function makeOrder(level: number, rng: Rng): QuizQuestion {
  const r = pick(ROUTINES, rng);
  const steps = level <= 1 ? r.steps.slice(0, 3) : r.steps;
  const options = shuffle(steps, rng);
  return { id: `order-${r.id}`, shape: 'order', type: 'order', prompt: SEQ_TEXT.orderPrompt(r.title), options, answer: steps.map((s) => options.indexOf(s)), hint: { kind: 'eliminate' }, explain: SEQ_TEXT.explainOrder(steps) };
}

export function makeSeries(level: number, rng: Rng): QuizQuestion {
  const kind = pick(level <= 1 ? ['num', 'num', 'days'] : level <= 3 ? ['num', 'num', 'days', 'months', 'letters'] : ['num', 'num', 'num', 'months', 'letters'], rng);
  if (kind === 'num') {
    const mode = byLevel(['add-small', 'add-mid', 'add-big', 'sub', 'double'] as const, level);
    let seq: number[];
    let nextVal: number;
    let explain: string;
    if (mode === 'double') {
      const a = randInt(1, 3, rng);
      seq = [a, a * 2, a * 4, a * 8];
      nextVal = a * 16;
      explain = SEQ_TEXT.explainDouble;
    } else {
      const step = mode === 'add-small' ? randInt(1, 2, rng) : mode === 'add-mid' ? randInt(3, 5, rng) : mode === 'add-big' ? pick([10, 20, 25], rng) : -randInt(2, 5, rng);
      const start = mode === 'sub' ? randInt(30, 50, rng) : randInt(1, 12, rng);
      seq = [0, 1, 2, 3].map((i) => start + i * step);
      nextVal = start + 4 * step;
      explain = SEQ_TEXT.explainAdd(step);
    }
    const d = Math.abs((seq[1] ?? 0) - (seq[0] ?? 0)) || 1;
    const wrong = [nextVal + d, nextVal - 1, nextVal + 1, nextVal - d, nextVal + 2].map(String);
    return { ...choice(`series-${seq.join('-')}`, 'series', SEQ_TEXT.seriesPrompt, String(nextVal), wrong, rng, `${seq.join(',  ')},  ?`), explain };
  }
  const list = kind === 'days' ? WEEKDAYS : kind === 'months' ? MONTHS : LETTERS;
  const step = kind === 'letters' && level >= 3 ? 2 : 1;
  const start = randInt(0, list.length - 1, rng);
  const at = (i: number) => list[(((start + i * step) % list.length) + list.length) % list.length] as string;
  const shown = [0, 1, 2, 3].map(at);
  const answer = at(4);
  const wrong = [at(5), at(3), at(6), list[(start + 4 * step + 2) % list.length] as string];
  return { ...choice(`series-${kind}-${start}-${step}`, 'series', SEQ_TEXT.seriesPrompt, answer, wrong, rng, `${shown.join(',  ')},  ?`), explain: SEQ_TEXT.explainList(kind as 'days' | 'months' | 'letters', step === 2) };
}

const SHAPES = Object.keys(SHAPE_NAMES) as ShapeKind[];
const COLORS = Object.keys(COLOR_NAMES) as ColorKind[];

export function makePattern(level: number, rng: Rng): QuizQuestion {
  const motif = byLevel([[0, 1], [0, 1, 2], [0, 1, 1], [0, 0, 1, 1], [0, 1, 2]], level);
  const units = Math.max(...motif) + 1;
  const shapes = sample(SHAPES, units, rng);
  const colors = sample(COLORS, units, rng);
  // Level 5: colors run on their own two-step cycle, independent of the shapes.
  const colorCycle = level >= 5 ? sample(COLORS, 2, rng) : null;
  const item = (i: number): ShapeItem => {
    const m = motif[i % motif.length] as number;
    return { shape: shapes[m] as ShapeKind, color: (colorCycle ? colorCycle[i % 2] : colors[m]) as ColorKind };
  };
  const shown = Array.from({ length: Math.max(5, motif.length * 2 + 1) }, (_, i) => item(i));
  const answer = item(shown.length);
  const all: ShapeItem[] = SHAPES.flatMap((sh) => COLORS.map((c) => ({ shape: sh, color: c })));
  const others = all.filter((w) => !(w.shape === answer.shape && w.color === answer.color));
  // Plausible distractors first: same shape in another color, or same color in another shape.
  const near = shuffle(others.filter((w) => w.shape === answer.shape || w.color === answer.color), rng);
  const n = level <= 2 ? 2 : 3;
  const wrong = Array.from(new Set([...near, ...shuffle(others, rng)].map(encodeShape))).slice(0, n);
  const options = shuffle([encodeShape(answer), ...wrong], rng);
  return { id: `pattern-${shown.map(encodeShape).join('.')}`, shape: 'choice', type: 'pattern', prompt: SEQ_TEXT.patternPrompt, options, answer: options.indexOf(encodeShape(answer)), hint: { kind: 'eliminate' }, visual: { items: shown } satisfies PatternVisual, explain: SEQ_TEXT.explainPattern(Array.from({ length: colorCycle ? 6 : motif.length }, (_, i) => shapeLabel(item(i)))) };
}

export function makeLogic(level: number, rng: Rng): QuizQuestion {
  const kind = pick(byLevel([['day', 'add'], ['day', 'add', 'compare'], ['compare', 'money', 'day'], ['day', 'money', 'time', 'compare'], ['time', 'compare', 'money', 'day']], level), rng);
  if (kind === 'day') {
    const today = randInt(0, 6, rng);
    const offset = level <= 2 ? 1 : pick([2, -1, 3], rng);
    const ans = WEEKDAYS[(today + offset + 7) % 7] as string;
    const wrong = [1, -1, 2, -2, 3].map((d) => WEEKDAYS[(today + offset + d + 14) % 7] as string).map(SEQ_TEXT.dayOption);
    return { ...choice(`day-${today}-${offset}`, 'logic', SEQ_TEXT.dayPrompt(WEEKDAYS[today] as string, offset), SEQ_TEXT.dayOption(ans), wrong, rng), explain: SEQ_TEXT.explainDay(WEEKDAYS[today] as string, offset, ans) };
  }
  if (kind === 'add') {
    const a = randInt(2, 6, rng);
    const b = randInt(1, 4, rng);
    const fruit = pick(FRUIT_PLURAL, rng);
    return { ...choice(`add-${a}-${b}`, 'logic', SEQ_TEXT.addPrompt(a, b, fruit), String(a + b), [a + b + 1, a + b - 1, a, a + b + 2].map(String), rng), explain: SEQ_TEXT.explainSum(a, b) };
  }
  if (kind === 'money') {
    const a = pick([20, 30, 50, 100], rng);
    const b = randInt(5, Math.min(18, a - 2), rng);
    return { ...choice(`money-${a}-${b}`, 'logic', SEQ_TEXT.moneyPrompt(a, b), String(a - b), [a - b + 1, a - b - 1, a - b + 10, a + b].map(String), rng), explain: SEQ_TEXT.explainDiff(a, b) };
  }
  if (kind === 'time') {
    const h = randInt(7, 16, rng);
    const d = pick([1, 2, 3], rng);
    return { ...choice(`time-${h}-${d}`, 'logic', SEQ_TEXT.timePrompt(h, d), SEQ_TEXT.timeOption(h + d), [h + d + 1, h + d - 1, h, h + d + 2].map(SEQ_TEXT.timeOption), rng), explain: SEQ_TEXT.explainTime(h, d) };
  }
  const [a, b, c] = sample(NAMES, 3, rng) as [string, string, string];
  const cmp = pick(COMPARISONS, rng);
  const askMost = level <= 2 ? true : rng() < 0.5;
  const ans = askMost ? a : c;
  const ask = askMost ? cmp.most : cmp.least;
  return { ...choice(`cmp-${a}-${b}-${c}-${askMost}`, 'logic', SEQ_TEXT.comparePrompt(a, b, c, cmp.more, ask), ans, [b, askMost ? c : a], rng), explain: SEQ_TEXT.explainCompare(a, b, c, cmp.more, ans, ask) };
}

export function createSequencesGame(level: number, rng: Rng = Math.random): QuizState {
  const tasks = tasksForLevel(level);
  const plan = shuffle(Array.from({ length: QUESTIONS_PER_SESSION }, (_, i) => tasks[i % tasks.length] as SeqTask), rng);
  const seen = new Set<string>();
  const questions = plan.map((task) => {
    let q: QuizQuestion | undefined;
    for (let tries = 0; tries < 12 && (!q || seen.has(q.id)); tries++) {
      q = task === 'order' ? makeOrder(level, rng) : task === 'series' ? makeSeries(level, rng) : task === 'pattern' ? makePattern(level, rng) : makeLogic(level, rng);
    }
    seen.add(q!.id);
    return q!;
  });
  return newQuiz(GAME_ID, level, questions);
}
