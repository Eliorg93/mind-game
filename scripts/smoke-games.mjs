// Real-browser check of every game on small phones: renders, fits the screen,
// responds to taps, and plays to the end. Usage: npm run build && node scripts/smoke-games.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const PORT = 4181;
const BASE = `http://localhost:${PORT}/`;
const SHOTS = new URL('../screenshots/games/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((r) => { server.stdout.on('data', (d) => String(d).includes(String(PORT)) && r()); setTimeout(r, 6000); });

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`); };
const GAMES = [
  ['picture-recall', 'זוכרים בתמונות', 'recall'],
  ['story-memory', 'סיפור וזיכרון', 'quiz'],
  ['shopping-list', 'רשימת הקניות', 'recall'],
  ['word-garden', 'גן המילים', 'quiz'],
  ['where-is-it', 'איפה הנחתי את זה?', 'where'],
  ['sequences-logic', 'רצפים והיגיון', 'quiz'],
];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
try {
  for (const vp of [{ name: 'se320', width: 320, height: 640 }, { name: 'android360', width: 360, height: 760 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(BASE);
    await page.getByRole('button', { name: 'בואי נתחיל' }).click();
    await page.getByRole('heading', { name: 'השגרה של היום' }).waitFor();
    const overflow = async () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const P = `[${vp.name}]`;

    for (const [id, title, kind] of GAMES) {
      await page.goto(BASE + `#/games/${id}`);
      await page.getByRole('heading', { name: title }).waitFor();
      if (vp.name === 'se320') await page.screenshot({ path: `${SHOTS}${id}-0-instructions.png`, fullPage: true });
      await page.getByRole('link', { name: 'להתחיל', exact: true }).click();
      await page.getByText(/^(סבב 1 מתוך|שאלה 1 מתוך|קוראים את הסיפור)/).first().waitFor();
      let maxOverflow = await overflow();
      if (vp.name === 'se320') await page.screenshot({ path: `${SHOTS}${id}-1-start.png`, fullPage: true });

      if (kind === 'recall') {
        for (let round = 0; round < 3; round++) {
          const names = id === 'picture-recall'
            ? await page.$$eval('ul[aria-label="החפצים לזכירה"] li', (els) => els.map((e) => e.textContent.trim()))
            : await page.$$eval('.study-list li', (els) => els.map((e) => e.textContent.trim()));
          await page.getByRole('button', { name: 'זכרתי, אפשר להמשיך' }).click();
          if (round === 0) await page.getByRole('button', { name: 'רמז' }).click();
          for (const n of names) {
            const btn = page.locator(`[data-testid="recall-choice"][aria-label="${n}"]`);
            if (await btn.count()) await btn.click();
          }
          maxOverflow = Math.max(maxOverflow, await overflow());
          if (vp.name === 'se320' && round === 0) await page.screenshot({ path: `${SHOTS}${id}-2-recall.png`, fullPage: true });
          await page.getByRole('button', { name: 'לבדוק' }).click();
          if (vp.name === 'se320' && round === 0) await page.screenshot({ path: `${SHOTS}${id}-3-review.png`, fullPage: true });
          await page.getByRole('button', { name: round < 2 ? 'לסבב הבא' : 'לסיים' }).click();
        }
      } else if (kind === 'where') {
        for (let round = 0; round < 3; round++) {
          const map = Object.fromEntries(await page.$$eval('li[data-obj]', (els) => els.map((e) => [e.dataset.obj, e.dataset.spot])));
          await page.getByRole('button', { name: 'זכרתי, אפשר להמשיך' }).click();
          let first = true;
          while (await page.locator('.where-ask').count()) {
            const obj = await page.locator('.where-ask').getAttribute('data-obj');
            if (first && round === 0) {
              const wrong = await page.$$eval('button[data-spot]', (bs, right) => bs.map((b) => b.dataset.spot).find((s) => s !== right), map[obj]);
              await page.locator(`button[data-spot="${wrong}"]`).click();
              await page.getByRole('button', { name: 'רמז' }).click();
              if (vp.name === 'se320') await page.screenshot({ path: `${SHOTS}${id}-2-recall-hint.png`, fullPage: true });
            }
            first = false;
            maxOverflow = Math.max(maxOverflow, await overflow());
            await page.locator(`button[data-spot="${map[obj]}"]`).click();
          }
          await page.getByRole('button', { name: round < 2 ? 'לסבב הבא' : 'לסיים' }).click();
        }
      } else {
        let guard = 0;
        let shot = 0;
        while (!(await page.getByRole('button', { name: 'לסיים' }).count()) && guard++ < 150) {
          if (await page.getByRole('button', { name: 'לשאלות' }).count()) { await page.getByRole('button', { name: 'לשאלות' }).click(); continue; }
          const go = page.getByRole('button', { name: /^(להמשיך|לסיכום)$/ });
          if (await go.count()) { await go.click(); continue; }
          maxOverflow = Math.max(maxOverflow, await overflow());
          if (vp.name === 'se320' && shot < 6) await page.screenshot({ path: `${SHOTS}${id}-q${shot++}.png`, fullPage: true });
          const opts = page.locator('[data-testid="quiz-option"]:not([disabled])[data-state="idle"], [data-testid="quiz-option"]:not([disabled])[data-state="hint"]');
          await opts.first().click();
        }
        check(`${P} ${id}: all questions answered`, guard < 150);
        await page.getByRole('button', { name: 'לסיים' }).click();
      }
      await page.getByRole('link', { name: 'לסיום הפעילות' }).click();
      const planted = await page.getByText('צמח חדש נוסף לגינה שלך').waitFor({ timeout: 5000 }).then(() => true, () => false);
      check(`${P} ${id}: plays to the end and plants a plant`, planted);
      check(`${P} ${id}: fits the screen (no sideways scrolling)`, maxOverflow <= 1, `${maxOverflow}px`);
    }
    check(`${P} no console errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
