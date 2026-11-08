/** Game 2 – story and memory: read (or listen to) a short story, then answer questions about it. */
import { STORIES, storyLevelFor, type Story } from '@/content/he/stories';
import { pick, shuffle, type Rng } from '../kit/random';
import { newQuiz, type QuizQuestion, type QuizState } from '../kit/quizEngine';

export const GAME_ID = 'story-memory';

export function storyQuestions(story: Story, rng: Rng): QuizQuestion[] {
  return story.questions.map((sq, i) => {
    const order = shuffle(sq.options.map((_, k) => k), rng);
    return {
      id: `${story.id}-${i}`,
      shape: 'choice',
      type: 'detail',
      prompt: sq.q,
      options: order.map((k) => sq.options[k] as string),
      answer: order.indexOf(sq.answer),
      hint: { kind: 'text', text: sq.clue },
    };
  });
}

export function createStoryGame(level: number, rng: Rng = Math.random, avoid?: string): QuizState {
  const lvl = storyLevelFor(level);
  const pool = STORIES.filter((s) => s.level === lvl && s.id !== avoid);
  const story = pick(pool.length ? pool : STORIES.filter((s) => s.level === lvl), rng);
  return newQuiz(GAME_ID, level, storyQuestions(story, rng), { hasIntro: true, meta: { storyId: story.id } });
}

export function storyOf(s: QuizState): Story | undefined {
  const id = (s.meta as { storyId?: string } | undefined)?.storyId;
  return STORIES.find((x) => x.id === id);
}
