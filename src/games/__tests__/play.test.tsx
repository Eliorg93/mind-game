import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/app/App';
import { destroyDB, kvSet } from '@/core/storage/db';
import { resetKeyCache } from '@/core/storage/crypto';
import { listSessions, getLevel } from '@/core/storage/progress';
import { getGameMeta } from '@/core/games/catalog';

type User = ReturnType<typeof userEvent.setup>;

beforeEach(async () => {
  await destroyDB();
  resetKeyCache();
  localStorage.clear();
  await kvSet('meta.onboarded', true);
});

async function openGame(user: User, id: string, title: RegExp | string) {
  window.location.hash = `#/games/${id}`;
  render(<App />);
  expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
  await user.click(await screen.findByRole('link', { name: 'להתחיל' }));
  // Games are code-split: wait until the game itself is on screen.
  await screen.findByText(/^(סבב 1 מתוך|שאלה 1 מתוך|קוראים את הסיפור)/, {}, { timeout: 4000 });
}

async function finishAndCheck(user: User, id: string) {
  await user.click(await screen.findByRole('link', { name: 'לסיום הפעילות' }));
  expect(await screen.findByText('צמח חדש נוסף לגינה שלך')).toBeInTheDocument();
  const sessions = await listSessions();
  expect(sessions.map((s) => s.gameId)).toContain(id);
}

async function playRecallRound(user: User, studyNames: () => string[], opts: { useHint?: boolean; wrongFirst?: boolean } = {}) {
  const names = studyNames();
  expect(names.length).toBeGreaterThanOrEqual(3);
  await user.click(screen.getByRole('button', { name: 'זכרתי, אפשר להמשיך' }));
  const choices = await screen.findAllByTestId('recall-choice');
  if (opts.useHint) {
    await user.click(screen.getByRole('button', { name: 'רמז' }));
    expect(screen.getByRole('status')).toHaveTextContent('רמז');
  }
  if (opts.wrongFirst) {
    const wrong = choices.find((c) => !names.some((n) => c.getAttribute('aria-label')?.startsWith(n)))!;
    await user.click(wrong);
  }
  for (const c of await screen.findAllByTestId('recall-choice')) {
    const label = c.getAttribute('aria-label') ?? '';
    const isTarget = names.some((n) => label === n || label.startsWith(`${n},`));
    const pressed = c.getAttribute('aria-pressed') === 'true';
    if (isTarget !== pressed && c.getAttribute('data-state') !== 'hint') await user.click(c);
  }
  await user.click(screen.getByRole('button', { name: 'לבדוק' }));
}

describe('playing every game end to end', () => {
  it('picture recall: three rounds with hint, a wrong pick, retry and finish', async () => {
    const user = userEvent.setup();
    await openGame(user, 'picture-recall', 'זוכרים בתמונות');
    const names = () => within(screen.getByRole('list', { name: 'החפצים לזכירה' })).getAllByRole('listitem').map((li) => li.textContent!.trim());
    expect(screen.getByText('סבב 1 מתוך 3')).toBeInTheDocument();
    await playRecallRound(user, names, { useHint: true, wrongFirst: true });
    expect(await screen.findByRole('heading', { name: 'נכון!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'לנסות שוב' }));
    await playRecallRound(user, names);
    await user.click(await screen.findByRole('button', { name: 'לסבב הבא' }));
    await playRecallRound(user, names);
    await user.click(await screen.findByRole('button', { name: 'לסבב הבא' }));
    expect(screen.getByText('סבב 3 מתוך 3')).toBeInTheDocument();
    await playRecallRound(user, names);
    await user.click(await screen.findByRole('button', { name: 'לסיים' }));
    await finishAndCheck(user, 'picture-recall');
    expect(await getLevel(getGameMeta('picture-recall')!)).toBe(1); // the engine waits for a second strong activity
  });

  it('shopping list: reads the list, picks the products, partial result and finish', async () => {
    const user = userEvent.setup();
    await openGame(user, 'shopping-list', 'רשימת הקניות');
    const names = () => Array.from(document.querySelectorAll('.study-list li')).map((li) => li.textContent!.trim());
    // Round 1: choose only one product to see the "partial" review.
    const first = names();
    await user.click(screen.getByRole('button', { name: 'זכרתי, אפשר להמשיך' }));
    await user.click((await screen.findAllByTestId('recall-choice')).find((c) => c.getAttribute('aria-label') === first[0])!);
    await user.click(screen.getByRole('button', { name: 'לבדוק' }));
    expect(await screen.findByRole('heading', { name: `זכרת 1 מתוך ${first.length}` })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'לסבב הבא' }));
    await playRecallRound(user, names, { useHint: true });
    await user.click(await screen.findByRole('button', { name: 'לסבב הבא' }));
    await playRecallRound(user, names);
    await user.click(await screen.findByRole('button', { name: 'לסיים' }));
    await finishAndCheck(user, 'shopping-list');
  });

  it('where is it: wrong place, hint, all objects, retry, finish', async () => {
    const user = userEvent.setup();
    await openGame(user, 'where-is-it', 'איפה הנחתי את זה?');
    const playRound = async (mistake: boolean) => {
      const map = new Map(Array.from(document.querySelectorAll('li[data-obj]')).map((li) => [li.getAttribute('data-obj')!, li.getAttribute('data-spot')!]));
      expect(map.size).toBeGreaterThanOrEqual(2);
      await user.click(screen.getByRole('button', { name: 'זכרתי, אפשר להמשיך' }));
      let first = true;
      while (document.querySelector('.where-ask')) {
        const obj = document.querySelector('.where-ask')!.getAttribute('data-obj')!;
        const spot = map.get(obj)!;
        if (mistake && first) {
          const wrong = Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-spot]')).find((b) => b.getAttribute('data-spot') !== spot)!;
          await user.click(wrong);
          expect(screen.getByRole('status')).toHaveTextContent('אפשר לנסות מקום אחר');
          await user.click(screen.getByRole('button', { name: 'רמז' }));
          expect(document.querySelectorAll('button[data-spot]:not(:disabled)').length).toBe(2);
        }
        first = false;
        await user.click(document.querySelector<HTMLButtonElement>(`button[data-spot="${spot}"]`)!);
      }
    };
    await playRound(true);
    expect(await screen.findByText(/נמצאו כבר בניסיון הראשון/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'לנסות שוב' }));
    await playRound(false);
    expect(await screen.findByText('כל החפצים נמצאו כבר בניסיון הראשון.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'לסבב הבא' }));
    await playRound(false);
    await user.click(await screen.findByRole('button', { name: 'לסבב הבא' }));
    await playRound(false);
    await user.click(await screen.findByRole('button', { name: 'לסיים' }));
    await finishAndCheck(user, 'where-is-it');
  });

  /** Answers every question by trying options until one is right (exercises the retry path). */
  async function playQuiz(user: User, opts: { hintOnFirst?: boolean } = {}) {
    let guard = 0;
    let first = true;
    while (!screen.queryByRole('button', { name: 'לסיים' }) && guard++ < 200) {
      const intro = screen.queryByRole('button', { name: 'לשאלות' });
      if (intro) {
        await user.click(intro);
        continue;
      }
      const go = screen.queryByRole('button', { name: /^(להמשיך|לסיכום)$/ });
      if (go) {
        await user.click(go);
        continue;
      }
      if (first && opts.hintOnFirst) {
        await user.click(screen.getByRole('button', { name: 'רמז' }));
        first = false;
        continue;
      }
      const option = screen.getAllByTestId('quiz-option').find((b) => !(b as HTMLButtonElement).disabled && ['idle', 'hint'].includes(b.getAttribute('data-state')!));
      await user.click(option!);
    }
    expect(guard).toBeLessThan(200);
  }

  it('story and memory: read, answer with hint and retries, try again, finish', async () => {
    const user = userEvent.setup();
    await openGame(user, 'story-memory', 'סיפור וזיכרון');
    expect(await screen.findByRole('article')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'לשאלות' }));
    expect(screen.getByText('שאלה 1 מתוך 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'רמז' }));
    expect(screen.getByRole('note')).toHaveTextContent('רמז:');
    await playQuiz(user);
    await user.click(screen.getByRole('button', { name: 'לנסות שוב' }));
    expect(await screen.findByRole('article')).toBeInTheDocument();
    await playQuiz(user);
    await user.click(screen.getByRole('button', { name: 'לסיים' }));
    await finishAndCheck(user, 'story-memory');
  });

  it('word garden: six questions with hints and retries, finish', async () => {
    const user = userEvent.setup();
    await openGame(user, 'word-garden', 'גן המילים');
    expect(screen.getByText('שאלה 1 מתוך 6')).toBeInTheDocument();
    await playQuiz(user, { hintOnFirst: true });
    await user.click(screen.getByRole('button', { name: 'לסיים' }));
    await finishAndCheck(user, 'word-garden');
  });

  it('sequences and logic: order steps, series, patterns; finish', async () => {
    const user = userEvent.setup();
    await openGame(user, 'sequences-logic', 'רצפים והיגיון');
    expect(screen.getByText('שאלה 1 מתוך 5')).toBeInTheDocument();
    await playQuiz(user, { hintOnFirst: true });
    await user.click(screen.getByRole('button', { name: 'לסיים' }));
    await finishAndCheck(user, 'sequences-logic');
  });

});

describe('leaving and returning', () => {
  it('resumes a question game at the same question', async () => {
    const user = userEvent.setup();
    await openGame(user, 'sequences-logic', 'רצפים והיגיון');
    // solve question 1 by trying options
    while (!screen.queryByRole('button', { name: 'להמשיך' })) {
      const option = screen.getAllByTestId('quiz-option').find((b) => !(b as HTMLButtonElement).disabled && ['idle', 'hint'].includes(b.getAttribute('data-state')!));
      await user.click(option!);
    }
    await user.click(screen.getByRole('button', { name: 'להמשיך' }));
    expect(screen.getByText('שאלה 2 מתוך 5')).toBeInTheDocument();
    const prompt = document.querySelector('.prompt-big')!.textContent;
    await user.click(screen.getByRole('link', { name: 'יציאה' }));
    expect(await screen.findByText('יש משחק שלא הסתיים')).toBeInTheDocument();
    window.location.hash = '#/games/sequences-logic';
    await user.click(await screen.findByRole('link', { name: 'להמשיך מאיפה שעצרת' }));
    expect(await screen.findByText('שאלה 2 מתוך 5')).toBeInTheDocument();
    expect(document.querySelector('.prompt-big')!.textContent).toBe(prompt);
  });

  it('resumes a picture game mid-round with the same selection', async () => {
    const user = userEvent.setup();
    await openGame(user, 'picture-recall', 'זוכרים בתמונות');
    const names = within(screen.getByRole('list', { name: 'החפצים לזכירה' })).getAllByRole('listitem').map((li) => li.textContent!.trim());
    await user.click(screen.getByRole('button', { name: 'זכרתי, אפשר להמשיך' }));
    await user.click((await screen.findAllByTestId('recall-choice')).find((c) => c.getAttribute('aria-label') === names[0])!);
    expect(screen.getByText('נבחרו 1 מתוך 3')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'יציאה' }));
    window.location.hash = '#/games/picture-recall';
    await user.click(await screen.findByRole('link', { name: 'להמשיך מאיפה שעצרת' }));
    expect(await screen.findByText('נבחרו 1 מתוך 3')).toBeInTheDocument();
    const chosen = screen.getAllByTestId('recall-choice').find((c) => c.getAttribute('aria-pressed') === 'true')!;
    expect(chosen.getAttribute('aria-label')).toBe(names[0]);
  });

  it('lets the player choose an easier or harder level', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/games/picture-recall';
    render(<App />);
    expect(await screen.findByText('רמה 1 מתוך 6')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'קל יותר' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'מאתגר יותר' }));
    await user.click(screen.getByRole('button', { name: 'מאתגר יותר' }));
    expect(await screen.findByText('רמה 3 מתוך 6')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'להתחיל' }));
    await waitFor(() => expect(document.querySelectorAll('ul[aria-label="החפצים לזכירה"] li')).toHaveLength(5));
  });
});
