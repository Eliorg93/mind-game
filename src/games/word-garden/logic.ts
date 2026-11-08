/**
 * Game 4 – word garden: categories, odd-one-out, word from a definition,
 * completing a saying and words with a similar meaning. Content is Hebrew-native.
 */
import { CATEGORIES, DEFINITIONS, IDIOMS, SYNONYMS, WORD_TEXT, type ChoiceItem } from '@/content/he/words';
import { pick, sample, shuffle, type Rng } from '../kit/random';
import { newQuiz, type QuizQuestion, type QuizState } from '../kit/quizEngine';

export const GAME_ID = 'word-garden';
export const QUESTIONS_PER_SESSION = 6;

export type WordTask = 'category' | 'odd' | 'definition' | 'idiom' | 'synonym';

export function tasksForLevel(level: number): WordTask[] {
  const t: WordTask[] = ['category', 'odd'];
  if (level >= 2) t.push('definition');
  if (level >= 3) t.push('idiom');
  if (level >= 4) t.push('synonym');
  return t;
}

function choice(id: string, type: WordTask, prompt: string, answer: string, wrong: string[], hint: QuizQuestion['hint'], rng: Rng, detail?: string): QuizQuestion {
  const options = shuffle([answer, ...wrong], rng);
  return { id, shape: 'choice', type, prompt, detail, options, answer: options.indexOf(answer), hint };
}

const firstLetter = (w: string) => WORD_TEXT.letterHint(w.trim().charAt(0));

export function makeCategory(level: number, rng: Rng): QuizQuestion {
  const pool = CATEGORIES.filter((c) => level >= 3 || c.easy);
  const [cat, ...others] = sample(pool, 4, rng);
  const answer = pick(cat!.members, rng);
  const wrong = others.map((o) => pick(o.members, rng));
  return choice(`cat-${cat!.id}-${answer}`, 'category', WORD_TEXT.categoryPrompt(cat!.singular), answer, wrong, { kind: 'eliminate' }, rng);
}

export function makeOdd(level: number, rng: Rng): QuizQuestion {
  const pool = CATEGORIES.filter((c) => level >= 3 || c.easy);
  const [cat, other] = sample(pool, 2, rng);
  const same = sample(cat!.members, 3, rng);
  const odd = pick(other!.members, rng);
  const options = shuffle([...same, odd], rng);
  return { id: `odd-${cat!.id}-${odd}`, shape: 'choice', type: 'odd', prompt: WORD_TEXT.oddPrompt, options, answer: options.indexOf(odd), hint: { kind: 'text', text: WORD_TEXT.oddHint(cat!.plural) } };
}

function fromItem(item: ChoiceItem, type: WordTask, rng: Rng): QuizQuestion {
  if (type === 'definition') return choice(item.id, type, WORD_TEXT.definitionPrompt, item.answer, [...item.wrong], { kind: 'text', text: firstLetter(item.answer) }, rng, item.prompt);
  if (type === 'synonym') return choice(item.id, type, WORD_TEXT.synonymPrompt(item.prompt), item.answer, [...item.wrong], { kind: 'eliminate' }, rng);
  return choice(item.id, type, WORD_TEXT.idiomPrompt, item.answer, [...item.wrong], { kind: 'text', text: firstLetter(item.answer) }, rng, item.prompt);
}

export function createWordGame(level: number, rng: Rng = Math.random): QuizState {
  const tasks = tasksForLevel(level);
  const plan = shuffle(Array.from({ length: QUESTIONS_PER_SESSION }, (_, i) => tasks[i % tasks.length] as WordTask), rng);
  const defs = shuffle(DEFINITIONS, rng);
  const syns = shuffle(SYNONYMS, rng);
  const idioms = shuffle(IDIOMS.filter((i) => level >= 5 || !i.hard), rng);
  const questions: QuizQuestion[] = [];
  const seen = new Set<string>();
  for (const task of plan) {
    let q: QuizQuestion | undefined;
    for (let tries = 0; tries < 10 && (!q || seen.has(q.id)); tries++) {
      if (task === 'category') q = makeCategory(level, rng);
      else if (task === 'odd') q = makeOdd(level, rng);
      else if (task === 'definition') q = fromItem(defs.shift() ?? pick(DEFINITIONS, rng), task, rng);
      else if (task === 'synonym') q = fromItem(syns.shift() ?? pick(SYNONYMS, rng), task, rng);
      else q = fromItem(idioms.shift() ?? pick(IDIOMS, rng), task, rng);
    }
    seen.add(q!.id);
    questions.push(q!);
  }
  return newQuiz(GAME_ID, level, questions);
}
