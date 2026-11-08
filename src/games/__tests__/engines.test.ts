import { seeded } from '../kit/random';
import { itemCredit, selectionCredit } from '../kit/scoring';
import { check, hint, newRecall, nextRound, retryRound, roundResult, sessionAccuracy, startRecall, toggle } from '../kit/recallEngine';
import { answer, beginQuestions, currentQuestion, finish, giveHint, newQuiz, next, retry, accuracy, type QuizQuestion } from '../kit/quizEngine';
import { PICTURE_CONFIG } from '../picture-recall/PictureRecallGame';
import { SHOPPING_CONFIG, sameSectionDistractors } from '../shopping-list/ShoppingListGame';
import { productById } from '@/content/he/shopping';
import * as where from '../where-is-it/logic';

describe('scoring', () => {
  it('rewards first tries most, but never punishes hints or retries to zero', () => {
    expect(itemCredit({ wrongTries: 0, hinted: false })).toBe(1);
    expect(itemCredit({ wrongTries: 0, hinted: true })).toBe(0.5);
    expect(itemCredit({ wrongTries: 1, hinted: false })).toBe(0.5);
    expect(itemCredit({ wrongTries: 3, hinted: true })).toBe(0.25);
    expect(selectionCredit({ targets: 4, hits: 4, falseAlarms: 0, hinted: 0 })).toBe(1);
    expect(selectionCredit({ targets: 4, hits: 2, falseAlarms: 4, hinted: 0 })).toBe(0);
  });
});

describe('recall engine (picture recall / shopping list)', () => {
  it('sizes rounds by level and never repeats a target inside a round', () => {
    for (let level = 1; level <= 6; level++) {
      const s = newRecall(PICTURE_CONFIG, level, seeded(level));
      const k = [3, 4, 5, 6, 7, 8][level - 1]!;
      expect(s.round.targets).toHaveLength(k);
      expect(new Set(s.round.choices).size).toBe(s.round.choices.length);
      expect(s.round.targets.every((t) => s.round.choices.includes(t))).toBe(true);
      expect(s.round.choices.length).toBeLessThanOrEqual(12);
    }
  });

  it('plays a round: select, limit, hint, check, retry, next, finish', () => {
    let s = startRecall(newRecall(PICTURE_CONFIG, 2, seeded(3)));
    const [t1, t2] = s.round.targets;
    const wrong = s.round.choices.find((c) => !s.round.targets.includes(c))!;
    s = toggle(s, t1!).state;
    s = toggle(s, wrong).state;
    s = toggle(s, wrong).state; // deselect
    expect(s.round.selected).toEqual([t1]);
    s = hint(s).state;
    expect(s.round.hinted).toHaveLength(1);
    expect(toggle(s, s.round.hinted[0]!).outcome).toBe('ignored'); // revealed item stays
    while (s.round.selected.length < s.round.targets.length) s = toggle(s, s.round.choices.find((c) => !s.round.selected.includes(c) && !s.round.targets.includes(c))!).state;
    expect(toggle(s, t2!).outcome === 'full' || s.round.selected.includes(t2!)).toBe(true);
    s = check(s);
    expect(s.phase).toBe('review');
    expect(roundResult(s.round).hits).toBe(2);
    const credit1 = s.credits[0]!;
    s = retryRound(s, seeded(4));
    expect(s.phase).toBe('study');
    expect(s.round.selected).toEqual([]);
    s = startRecall(s);
    for (const t of s.round.targets) s = toggle(s, t).state;
    s = check(s);
    expect(s.credits[0]).toBe(1);
    expect(s.credits[0]).toBeGreaterThan(credit1);
    s = nextRound(PICTURE_CONFIG, s, seeded(5));
    expect(s.roundIndex).toBe(1);
    expect(s.round.targets.some((t) => s.used.slice(0, 4).includes(t))).toBe(false);
    s = nextRound(PICTURE_CONFIG, { ...s, roundIndex: 2 }, seeded(6));
    expect(s.phase).toBe('done');
    expect(sessionAccuracy(s)).toBeGreaterThan(0);
  });

  it('hint frees a wrong pick when the selection is full', () => {
    let s = startRecall(newRecall(PICTURE_CONFIG, 1, seeded(9)));
    const wrongs = s.round.choices.filter((c) => !s.round.targets.includes(c));
    for (const w of wrongs.slice(0, 3)) s = toggle(s, w).state;
    expect(s.round.selected).toHaveLength(3);
    const r = hint(s);
    expect(r.revealed).not.toBeNull();
    expect(r.state.round.selected).toHaveLength(3);
    expect(r.state.round.selected).toContain(r.revealed);
  });

  it('shopping distractors come from the same store sections first', () => {
    const s = newRecall(SHOPPING_CONFIG, 3, seeded(2));
    const sections = new Set(s.round.targets.map((t) => productById(t)!.sectionId));
    const distractors = s.round.choices.filter((c) => !s.round.targets.includes(c));
    const near = distractors.filter((d) => sections.has(productById(d)!.sectionId)).length;
    expect(near).toBeGreaterThan(0);
    expect(sameSectionDistractors(['veg:0'], ['veg:1', 'fruit:0'], 1, seeded(1))).toEqual(['veg:1']);
  });
});

describe('where-is-it', () => {
  it('asks about every object, narrows on hint, and records first tries', () => {
    for (let level = 1; level <= 6; level++) {
      const s0 = where.newWhere(level, seeded(level));
      expect(s0.round.spots).toHaveLength(where.SPOTS_BY_LEVEL[level - 1]!);
      expect(new Set(s0.round.placements.map((p) => p.spot)).size).toBe(s0.round.placements.length);
    }
    let s = where.startRecall(where.newWhere(3, seeded(11)));
    const p = where.currentPlacement(s)!;
    const wrongSpot = s.round.spots.find((sp) => sp !== p.spot)!;
    let r = where.guess(s, wrongSpot);
    expect(r.outcome).toBe('wrong');
    expect(where.guess(r.state, wrongSpot).outcome).toBe('ignored');
    s = where.hint(r.state, seeded(1));
    expect(s.round.narrowed).toHaveLength(2);
    expect(s.round.narrowed).toContain(p.spot);
    r = where.guess(s, p.spot);
    expect(r.outcome).toBe('correct');
    s = r.state;
    while (s.phase === 'recall') s = where.guess(s, where.currentPlacement(s)!.spot).state;
    expect(s.phase).toBe('review');
    expect(where.firstTryCount(s)).toBe(s.round.placements.length - 1);
    s = where.retryRound(s, seeded(2));
    expect(s.phase).toBe('study');
    expect(s.round.ask).toBe(0);
    s = where.nextRound(where.nextRound(where.nextRound(s)));
    expect(s.phase).toBe('done');
  });
});

describe('quiz engine', () => {
  const choiceQ: QuizQuestion = { id: 'c', shape: 'choice', type: 't', prompt: 'p', options: ['a', 'b', 'c', 'd'], answer: 2, hint: { kind: 'eliminate' } };
  const orderQ: QuizQuestion = { id: 'o', shape: 'order', type: 't', prompt: 'p', options: ['x', 'y', 'z'], answer: [2, 0, 1], hint: { kind: 'eliminate' } };

  it('lets the player retry wrong answers, and eliminates but keeps two options', () => {
    let s = newQuiz('g', 1, [choiceQ, orderQ]);
    let r = answer(s, 0);
    expect(r.outcome).toBe('wrong');
    expect(answer(r.state, 0).outcome).toBe('ignored');
    s = giveHint(r.state, seeded(1));
    expect(s.cur.eliminated).toHaveLength(1);
    expect(s.cur.eliminated).not.toContain(2);
    s = giveHint(s, seeded(2)); // hint already used: no further elimination beyond 2 left
    r = answer(s, 2);
    expect(r.outcome).toBe('correct');
    s = next(r.state);
    expect(s.outcomes[0]).toEqual({ wrongTries: 1, hinted: true });
  });

  it('runs order questions step by step with a next-step hint', () => {
    let s = next(answer(newQuiz('g', 1, [choiceQ, orderQ]), 2).state);
    expect(currentQuestion(s)!.id).toBe('o');
    expect(answer(s, 0).outcome).toBe('wrong');
    s = giveHint(answer(s, 0).state);
    expect(s.cur.hintIndex).toBe(2);
    let r = answer(s, 2);
    expect(r.outcome).toBe('step');
    expect(r.state.cur.wrong).toEqual([]);
    r = answer(r.state, 0);
    r = answer(r.state, 1);
    expect(r.outcome).toBe('correct');
    s = next(r.state);
    expect(s.phase).toBe('review');
    expect(s.outcomes[1]).toEqual({ wrongTries: 1, hinted: true });
    expect(accuracy(s)).toBeCloseTo((1 + 0.25) / 2);
    s = retry(s);
    expect(s.phase).toBe('question');
    expect(s.outcomes).toEqual([]);
    expect(finish(s).phase).toBe('question'); // finish only from review
  });

  it('starts at the intro when the game has one', () => {
    const s = newQuiz('g', 1, [choiceQ], { hasIntro: true });
    expect(s.phase).toBe('intro');
    expect(beginQuestions(s).phase).toBe('question');
    expect(retry({ ...s, phase: 'review' }).phase).toBe('intro');
  });
});
