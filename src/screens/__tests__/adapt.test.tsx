import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/app/App';
import { AppStateProvider } from '@/app/state';
import { getGameMeta } from '@/core/games/catalog';
import { destroyDB, kvSet } from '@/core/storage/db';
import { resetKeyCache } from '@/core/storage/crypto';
import { getLevel, getSession, recordSession } from '@/core/storage/progress';
import { QuizGame } from '@/games/kit/QuizGame';
import { newQuiz } from '@/games/kit/quizEngine';

beforeEach(async () => {
  await destroyDB();
  resetKeyCache();
  localStorage.clear();
  await kvSet('meta.onboarded', true);
});

const meta = getGameMeta('word-garden')!;
const strong = { accuracy: 1, completed: true, items: 6, hints: 0, wrongTries: 0 };

async function playSessions(results: (typeof strong)[], style: 'calm' | 'balanced' | 'challenging' = 'balanced') {
  let last = '';
  for (const [i, result] of results.entries()) {
    const level = await getLevel(meta);
    const s = await recordSession(meta, { startedAt: Date.now() - 60_000 * (results.length - i), level, result, style });
    last = s.id;
  }
  return last;
}

function openFinish(id: string) {
  window.location.hash = `#/finish/${id}`;
  render(<App />);
}

describe('finish screen suggestions', () => {
  it('after a gentle automatic step up, the person can keep the current level', async () => {
    const user = userEvent.setup();
    const start = await getLevel(meta);
    const id = await playSessions([strong, strong]);
    expect(await getLevel(meta)).toBe(start + 1);
    openFinish(id);
    const card = await screen.findByTestId('adapt-card');
    expect(card).toHaveAttribute('data-kind', 'up');
    await user.click(screen.getByRole('button', { name: 'להשאיר ברמה הנוכחית' }));
    expect(await screen.findByRole('status')).toHaveTextContent('הרמה נשארת');
    expect(await getLevel(meta)).toBe(start);
    expect((await getSession(id))?.adapt?.response).toBe('kept');
  });

  it('in calm style a challenge is only offered, and accepting raises the level', async () => {
    const user = userEvent.setup();
    const start = await getLevel(meta);
    const id = await playSessions([strong, strong], 'calm');
    expect(await getLevel(meta)).toBe(start);
    openFinish(id);
    expect(await screen.findByTestId('adapt-card')).toHaveAttribute('data-kind', 'offer');
    await user.click(screen.getByRole('button', { name: 'כן, בשמחה' }));
    await screen.findByText(/יחכה אתגר קטן/);
    expect(await getLevel(meta)).toBe(start + 1);
  });

  it('declining a challenge keeps the level and pauses further offers', async () => {
    const user = userEvent.setup();
    const start = await getLevel(meta);
    const id = await playSessions([strong, strong], 'calm');
    openFinish(id);
    await user.click(await screen.findByRole('button', { name: 'להישאר ככה' }));
    await screen.findByText(/נמשיך באותו קצב/);
    expect(await getLevel(meta)).toBe(start);
    // The very next strong activity does not ask again.
    const next = await playSessions([strong], 'calm');
    expect((await getSession(next))?.adapt?.offer).toBeNull();
  });

  it('a hard activity eases gently, with no numbers, and can be kept as is', async () => {
    const user = userEvent.setup();
    const start = await getLevel(meta);
    const id = await playSessions([{ accuracy: 0.2, completed: true, items: 6, hints: 1, wrongTries: 8 }]);
    openFinish(id);
    const card = await screen.findByTestId('adapt-card');
    if (start > meta.levels.min) {
      expect(card).toHaveAttribute('data-kind', 'down');
      expect(card.textContent).not.toMatch(/\d/);
      await user.click(screen.getByRole('button', { name: 'להשאיר את הרמה כמו שהיא' }));
      await waitFor(async () => expect(await getLevel(meta)).toBe(start));
    } else {
      expect(card).toHaveAttribute('data-kind', 'hints');
    }
  });
});

describe('challenge pace setting', () => {
  it('switches the style, explains it, and remembers it', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/settings';
    render(<App />);
    const calm = await screen.findByRole('button', { name: 'רגועה' });
    expect(screen.getByRole('button', { name: 'מאוזנת' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(calm);
    expect(calm).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/ההחלטה משאירים לך/)).toBeInTheDocument();
    expect(screen.getByText(/כשמשהו מרגיש קשה/)).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem('mg.settings.fast')).toContain('"challenge":"calm"'));
  });
});

describe('in-game support', () => {
  const spec = {
    gameId: 'word-garden',
    create: (level: number) =>
      newQuiz('word-garden', level, [
        { id: 'q1', shape: 'choice', type: 'definition', prompt: 'שאלה לדוגמה', options: ['אחת', 'שתיים', 'שלוש', 'ארבע'], answer: 2, hint: { kind: 'eliminate' }, explain: 'הסבר קצר לדוגמה' },
      ]),
  } as const;

  function renderQuiz(hintOfferAfter: number) {
    render(
      <AppStateProvider>
        <QuizGame spec={spec as never} level={1} onStateChange={() => {}} onComplete={() => {}} feedback={{ tone: () => {} }} support={{ hintOfferAfter }} />
      </AppStateProvider>,
    );
  }

  it('offers the hint after wrong tries, and explains after a mistake', async () => {
    const user = userEvent.setup();
    renderQuiz(2);
    await user.click(await screen.findByRole('button', { name: 'אחת' }));
    expect(screen.queryByRole('button', { name: 'הראו לי רמז' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'שתיים' }));
    await user.click(await screen.findByRole('button', { name: 'הראו לי רמז' }));
    expect(screen.queryByRole('button', { name: 'הראו לי רמז' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'שלוש' }));
    expect(await screen.findByText('הסבר קצר לדוגמה')).toBeInTheDocument();
  });

  it('shows no explanation when the answer was right the first time', async () => {
    const user = userEvent.setup();
    renderQuiz(1);
    await user.click(await screen.findByRole('button', { name: 'שלוש' }));
    await screen.findByRole('status');
    expect(screen.queryByText('הסבר קצר לדוגמה')).not.toBeInTheDocument();
  });
});

describe('wording', () => {
  const FORBIDDEN = ['ציון', 'אבחנ', 'ירידה', 'דמנציה', 'אלצהיימר', 'נכשל', 'כישלון', 'חלש', 'גרוע', 'טעית'];
  const sources = {
    ...import.meta.glob('/src/i18n/locales/**/*.json', { query: '?raw', import: 'default', eager: true }),
    ...import.meta.glob('/src/content/**/*.ts', { query: '?raw', import: 'default', eager: true }),
  } as Record<string, string>;

  it('never uses judging or medical words in anything the person reads', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(5);
    for (const [f, text] of Object.entries(sources)) {
      for (const w of FORBIDDEN) expect(`${f}: ${text.includes(w) ? w : ''}`).toBe(`${f}: `);
    }
  });
});
