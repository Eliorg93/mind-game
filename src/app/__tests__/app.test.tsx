import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/app/App';
import { destroyDB } from '@/core/storage/db';
import { resetKeyCache } from '@/core/storage/crypto';

beforeEach(async () => {
  await destroyDB();
  resetKeyCache();
  localStorage.clear();
  window.location.hash = '#/';
});

async function onboard(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'ברוכה הבאה לגינה שלך' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'בואי נתחיל' }));
  expect(await screen.findByRole('heading', { name: 'השגרה של היום' })).toBeInTheDocument();
}

describe('MIND GARDEN app', () => {
  it('onboards, plays the routine game to the end, plants a plant and shows it in the garden', async () => {
    const user = userEvent.setup();
    await onboard(user);

    await user.click(screen.getByRole('link', { name: 'להתחיל את השגרה' }));
    expect(await screen.findByText('פעילות 1 מתוך 3')).toBeInTheDocument();
    window.location.hash = '#/games/memory-pairs';
    expect(await screen.findByRole('heading', { name: 'גן הזוגות' })).toBeInTheDocument();
    expect(screen.getByText('לחצי על קלף כדי להפוך אותו.')).toBeInTheDocument();
    await user.click(await screen.findByRole('link', { name: 'להתחיל' }));

    const board = await screen.findByRole('group', { name: 'לוח הקלפים' });
    const cards = within(board).getAllByTestId('pair-card');
    expect(cards).toHaveLength(4); // level 1 = 2 pairs
    const items = cards.map((c) => c.getAttribute('data-item'));
    const done = new Set<number>();
    for (let i = 0; i < cards.length; i++) {
      if (done.has(i)) continue;
      const j = items.findIndex((it, k) => k !== i && it === items[i]);
      done.add(i).add(j);
      await user.click(cards[i]!);
      await user.click(cards[j]!);
    }
    expect(await screen.findByText('כל הזוגות נמצאו!')).toBeInTheDocument();
    await user.click(await screen.findByRole('link', { name: 'לסיום הפעילות' }));

    expect(await screen.findByRole('heading', { name: 'לבנדר' })).toBeInTheDocument();
    expect(screen.getByText(/סיימת את גן הזוגות/)).toBeInTheDocument();
    await user.click(screen.getAllByRole('link', { name: 'לראות את הגינה' })[0]!);
    expect(await screen.findByRole('heading', { name: 'הגינה שלי' })).toBeInTheDocument();
    expect(screen.getByText(/צמח אחד/)).toBeInTheDocument();
    expect(screen.getByText('תרגלת 1 מתוך 7 הימים האחרונים')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'בית' }));
    expect(await screen.findByRole('heading', { name: 'השגרה של היום' })).toBeInTheDocument();
  });

  it('keeps a game in progress after leaving, and offers to continue', async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole('link', { name: 'לבחור משחק אחר' }));
    await user.click(await screen.findByRole('link', { name: /^גן הזוגות/ }));
    await user.click(await screen.findByRole('link', { name: 'להתחיל' }));
    const cards = within(await screen.findByRole('group', { name: 'לוח הקלפים' })).getAllByTestId('pair-card');
    const items = cards.map((c) => c.getAttribute('data-item'));
    await user.click(cards[0]!);
    await user.click(cards[items.findIndex((it, k) => k !== 0 && it === items[0])]!);
    await waitFor(() => expect(screen.getByText(/זוגות שנמצאו: 1 מתוך 2/)).toBeInTheDocument());
    await user.click(screen.getByRole('link', { name: 'יציאה' }));
    expect(await screen.findByText('יש משחק שלא הסתיים')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /יש משחק שלא הסתיים/ }));
    await user.click(await screen.findByRole('link', { name: 'להמשיך מאיפה שעצרת' }));
    expect(await screen.findByText(/זוגות שנמצאו: 1 מתוך 2/)).toBeInTheDocument();
  });

  it('saves accessibility settings and applies them immediately', async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole('link', { name: 'הגדרות' }));
    expect(await screen.findByRole('heading', { name: 'הגדרות ונגישות' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'גדול מאוד' }));
    expect(document.documentElement.dataset.textSize).toBe('xlarge');
    await user.click(screen.getByRole('switch', { name: 'ניגודיות גבוהה' }));
    expect(document.documentElement.dataset.contrast).toBe('high');
    await user.click(screen.getByRole('switch', { name: 'הפחתת תנועה' }));
    expect(document.documentElement.dataset.motion).toBe('reduce');
    await user.click(screen.getByRole('button', { name: 'זכר' }));
    expect(screen.getByText('אתה מוכן לשגרה של היום?')).toBeInTheDocument();
    // Read-aloud is disabled where the device has no speech engine (jsdom).
    expect(screen.getByRole('switch', { name: 'הקראת הוראות אוטומטית' })).toBeDisabled();

    await waitFor(() => expect(JSON.parse(localStorage.getItem('mg.settings.fast')!)).toMatchObject({ textSize: 'xlarge', highContrast: true, address: 'male' }));
  });

  it('adds, opens and deletes a written memory', async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole('link', { name: 'זיכרונות' }));
    await user.click(await screen.findByRole('button', { name: 'להוסיף זיכרון' }));
    await user.click(screen.getByRole('button', { name: 'לכתוב סיפור' }));
    await user.click(await screen.findByRole('button', { name: 'לשמור את הזיכרון' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('צריך כותרת קצרה לזיכרון.');
    await user.type(screen.getByLabelText('כותרת'), 'המטבח של סבתא');
    await user.type(screen.getByLabelText('הסיפור'), 'ריח של עוגה בשבת בבוקר');
    await user.click(screen.getByRole('button', { name: 'לשמור את הזיכרון' }));
    expect(await screen.findByText('זיכרון אחד שמור')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /המטבח של סבתא/ }));
    expect(await screen.findByText('ריח של עוגה בשבת בבוקר')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'למחוק את הזיכרון' }));
    await user.click(screen.getByRole('button', { name: 'כן, למחוק' }));
    expect(await screen.findByText('עוד אין כאן זיכרונות. אפשר להתחיל מהשאלה של היום.')).toBeInTheDocument();
  });

  it('redirects planned (not yet built) games back to the games list', async () => {
    const user = userEvent.setup();
    await onboard(user);
    window.location.hash = '#/games/garden-birds';
    expect(await screen.findByRole('heading', { name: 'במה נתרגל עכשיו?' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ציפורים בגן/ })).toBeNull();
    expect(screen.getByText('ציפורים בגן')).toBeInTheDocument();
  });
});
