import { seeded } from '../kit/random';
import { STORIES } from '@/content/he/stories';
import { CATEGORIES, DEFINITIONS, IDIOMS, SYNONYMS } from '@/content/he/words';
import { PRODUCTS } from '@/content/he/shopping';
import { OBJECT_IDS, SPOT_IDS, PLACEABLE_OBJECTS, SPOT_AT } from '@/content/he/objects';
import { ROUTINES } from '@/content/he/sequences';
import { createStoryGame, storyOf } from '../story-memory/logic';
import { createWordGame, tasksForLevel as wordTasks } from '../word-garden/logic';
import { createSequencesGame, decodeShape, makePattern, tasksForLevel as seqTasks } from '../sequences-logic/logic';
import type { QuizQuestion, QuizState } from '../kit/quizEngine';

function validQuestion(q: QuizQuestion) {
  expect(q.prompt.length).toBeGreaterThan(3);
  expect(new Set(q.options).size).toBe(q.options.length);
  if (q.shape === 'choice') {
    expect(q.options.length).toBeGreaterThanOrEqual(3);
    expect(q.options.length).toBeLessThanOrEqual(4);
    expect(typeof q.answer).toBe('number');
    expect(q.options[q.answer as number]).toBeDefined();
  } else {
    const order = q.answer as number[];
    expect([...order].sort()).toEqual(q.options.map((_, i) => i));
  }
}

describe('Hebrew content packs', () => {
  it('stories: answers in range, clues taken from the story, options unique', () => {
    for (const s of STORIES) {
      expect(s.questions.length).toBeGreaterThanOrEqual(3);
      for (const q of s.questions) {
        expect(q.options[q.answer]).toBeDefined();
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(s.sentences).toContain(q.clue);
      }
    }
    expect(new Set(STORIES.map((s) => s.level))).toEqual(new Set([1, 2, 3]));
  });
  it('word categories do not overlap (otherwise "odd one out" would be ambiguous)', () => {
    const all = CATEGORIES.flatMap((c) => c.members);
    expect(new Set(all).size).toBe(all.length);
    expect(CATEGORIES.filter((c) => c.easy).length).toBeGreaterThanOrEqual(4);
  });
  it('word items have four distinct options', () => {
    for (const it of [...DEFINITIONS, ...SYNONYMS, ...IDIOMS]) expect(new Set([it.answer, ...it.wrong]).size).toBe(4);
    for (const it of IDIOMS) expect(it.prompt).toContain('___');
  });
  it('products, objects, places and routines are consistent', () => {
    expect(new Set(PRODUCTS.map((p) => p.name)).size).toBe(PRODUCTS.length);
    expect(OBJECT_IDS.length).toBeGreaterThanOrEqual(20);
    expect(PLACEABLE_OBJECTS.every((o) => OBJECT_IDS.includes(o))).toBe(true);
    expect(SPOT_IDS.every((s) => SPOT_AT[s])).toBe(true);
    expect(ROUTINES.every((r) => r.steps.length === 4 && new Set(r.steps).size === 4)).toBe(true);
  });
});

describe('generated sessions are always valid (many seeds, every level)', () => {
  const check = (s: QuizState, n: number) => {
    expect(s.questions).toHaveLength(n);
    expect(new Set(s.questions.map((q) => q.id)).size).toBe(n);
    s.questions.forEach(validQuestion);
  };
  it('story game maps shuffled answers back to the right option', () => {
    for (let seed = 1; seed < 40; seed++) {
      const level = (seed % 5) + 1;
      const s = createStoryGame(level, seeded(seed));
      const story = storyOf(s)!;
      s.questions.forEach((q, i) => expect(q.options[q.answer as number]).toBe(story.questions[i]!.options[story.questions[i]!.answer]));
      check(s, story.questions.length);
    }
  });
  it('word game: six valid questions, task types follow the level', () => {
    for (let seed = 1; seed < 60; seed++) {
      const level = (seed % 5) + 1;
      const s = createWordGame(level, seeded(seed));
      check(s, 6);
      expect(s.questions.every((q) => wordTasks(level).includes(q.type as never))).toBe(true);
      if (level < 5) expect(s.questions.filter((q) => q.type === 'idiom').every((q) => !IDIOMS.find((i) => i.id === q.id)?.hard)).toBe(true);
    }
  });
  it('sequences game: five valid questions; order answers follow the routine', () => {
    for (let seed = 1; seed < 60; seed++) {
      const level = (seed % 5) + 1;
      const s = createSequencesGame(level, seeded(seed));
      check(s, 5);
      expect(s.questions.every((q) => seqTasks(level).includes(q.type as never))).toBe(true);
      for (const q of s.questions.filter((x) => x.shape === 'order')) {
        const routine = ROUTINES.find((r) => q.id === `order-${r.id}`)!;
        expect((q.answer as number[]).map((i) => q.options[i])).toEqual(routine.steps.slice(0, q.options.length));
      }
    }
  });
  it('shape patterns continue their own rule', () => {
    for (let seed = 1; seed < 80; seed++) {
      const level = (seed % 5) + 1;
      const q = makePattern(level, seeded(seed));
      const items = (q.visual as { items: { shape: string; color: string }[] }).items;
      const ans = decodeShape(q.options[q.answer as number]!);
      // find the smallest period that explains the shown items, and check the answer follows it
      const period = [2, 3, 4, 6].find((p) => items.every((it, i) => i < p || (it.shape === items[i - p]!.shape && it.color === items[i - p]!.color)))!;
      expect(period).toBeDefined();
      const expected = items[items.length - period]!;
      expect(ans).toEqual(expected);
    }
  });
});
