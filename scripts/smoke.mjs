// Real-browser smoke test of the production build on phone-sized screens.
// Usage: npm run build && npm run smoke   (needs Chrome; set CHROME_PATH if not /usr/bin/google-chrome)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const SHOTS = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => String(d).includes(String(PORT)) && resolve());
  server.on('exit', reject);
  setTimeout(resolve, 6000);
});

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
try {
  for (const device of [
    { name: 'iphone', viewport: { width: 390, height: 844 }, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
    { name: 'android', viewport: { width: 360, height: 780 }, ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' },
  ]) {
    const ctx = await browser.newContext({ viewport: device.viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL', userAgent: device.ua });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    const shot = (n) => page.screenshot({ path: `${SHOTS}${device.name}-${n}.png` });
    const noOverflow = async (label) => {
      const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`[${device.name}] no horizontal overflow: ${label}`, o <= 1, `${o}px`);
    };
    const P = `[${device.name}]`;

    const t0 = Date.now();
    await page.goto(BASE);
    await page.getByRole('heading', { name: 'ברוכה הבאה לגינה שלך' }).waitFor();
    const fcp = await page.evaluate(() => performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? -1);
    check(`${P} first screen visible`, true, `${Date.now() - t0} ms incl. navigation, FCP ${Math.round(fcp)} ms (local)`);
    check(`${P} document is RTL Hebrew`, await page.evaluate(() => document.documentElement.dir === 'rtl' && document.documentElement.lang === 'he'));
    await page.evaluate(() => document.fonts.ready);
    check(`${P} Hebrew fonts loaded locally`, await page.evaluate(() => document.fonts.check('700 20px "Frank Ruhl Libre"', 'ש') && document.fonts.check('20px Assistant', 'ש')));
    await shot('01-welcome');
    await noOverflow('welcome');

    // Primary button is on the right-to-left flow and big enough to tap.
    const btn = await page.getByRole('button', { name: 'בואי נתחיל' }).boundingBox();
    check(`${P} primary button height >= 56px`, btn.height >= 56, `${Math.round(btn.height)}px`);

    await page.getByRole('button', { name: 'בואי נתחיל' }).click();
    await page.getByRole('heading', { name: 'השגרה של היום' }).waitFor();
    await shot('02-home');
    await noOverflow('home');
    const navOrder = await page.$$eval('.bottom-nav a', (as) => as.map((a) => [a.textContent, Math.round(a.getBoundingClientRect().left)]));
    check(`${P} bottom nav runs right-to-left (בית on the right)`, navOrder[0][1] > navOrder[2][1], JSON.stringify(navOrder));

    const swOk = await page.evaluate(() => Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((r) => setTimeout(() => r(false), 8000))]));
    check(`${P} service worker active`, swOk);
    const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel=manifest]').href)).json());
    check(`${P} web app manifest (rtl, he, standalone, icons)`, manifest.dir === 'rtl' && manifest.lang === 'he' && manifest.display === 'standalone' && manifest.icons.length >= 3);

    await page.getByRole('link', { name: 'להתחיל את השגרה' }).click();
    await page.getByText('פעילות 1 מתוך 3').waitFor();
    await page.goto(BASE + '#/games/memory-pairs');
    await page.getByRole('heading', { name: 'גן הזוגות' }).waitFor();
    await shot('03-instructions');
    await page.getByRole('link', { name: 'להתחיל', exact: true }).click();
    await page.getByRole('group', { name: 'לוח הקלפים' }).waitFor();
    await shot('04-game');
    await noOverflow('game');
    const cards = page.getByTestId('pair-card');
    const items = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-item')));
    // One deliberate miss first, to check cards turn back.
    const miss = items.findIndex((it) => it !== items[0]);
    await cards.nth(0).click();
    await cards.nth(miss).click();
    await page.waitForTimeout(1700);
    const closed = await cards.evaluateAll((els) => els.filter((e) => e.getAttribute('aria-pressed') === 'true').length);
    check(`${P} mismatched cards turn back over`, closed === 0);
    const done = new Set();
    for (let i = 0; i < items.length; i++) {
      if (done.has(i)) continue;
      const j = items.findIndex((it, k) => k !== i && it === items[i]);
      done.add(i).add(j);
      await cards.nth(i).click();
      await cards.nth(j).click();
    }
    await page.getByText('כל הזוגות נמצאו!').waitFor();
    await page.getByRole('link', { name: 'לסיום הפעילות' }).click();
    await page.getByRole('heading', { name: 'לבנדר' }).waitFor();
    await page.waitForTimeout(1900);
    await shot('05-finish');
    check(`${P} game completes and plants a plant`, true);

    await page.getByRole('link', { name: 'לראות את הגינה' }).first().click();
    await page.getByRole('heading', { name: 'הגינה שלי' }).waitFor();
    await shot('06-garden');
    await noOverflow('garden');

    await page.getByRole('link', { name: 'זיכרונות' }).click();
    await page.getByRole('button', { name: 'להוסיף זיכרון' }).click();
    await page.waitForTimeout(350);
    await shot('07-memories-sheet');
    await page.getByRole('button', { name: 'לכתוב סיפור' }).click();
    await page.getByLabel('כותרת').fill('המטבח של סבתא');
    await page.getByLabel('הסיפור').fill('ריח של עוגת שמרים בשבת בבוקר.');
    await page.getByRole('button', { name: 'לשמור את הזיכרון' }).click();
    await page.getByText('זיכרון אחד שמור').waitFor();
    await shot('08-memories');

    await page.getByRole('link', { name: 'בית' }).click();
    await page.getByRole('link', { name: 'הגדרות' }).click();
    await page.getByRole('heading', { name: 'הגדרות ונגישות' }).waitFor();
    await shot('09-settings');
    await page.getByRole('button', { name: 'גדול מאוד' }).click();
    await page.getByRole('switch', { name: 'ניגודיות גבוהה' }).click();
    await page.waitForTimeout(200);
    await shot('10-settings-xlarge-contrast');
    await noOverflow('settings at largest text');

    // Settings and data survive a reload.
    await page.reload();
    await page.getByRole('heading', { name: 'הגדרות ונגישות' }).waitFor();
    check(`${P} settings persist after reload`, await page.evaluate(() => document.documentElement.dataset.textSize === 'xlarge' && document.documentElement.dataset.contrast === 'high'));
    await page.getByRole('switch', { name: 'ניגודיות גבוהה' }).click();
    await page.getByRole('button', { name: 'גדול', exact: true }).click();

    // Offline: the installed shell, data and game keep working.
    await ctx.setOffline(true);
    await page.goto(BASE + '#/garden');
    const offlineOk = await page.getByRole('heading', { name: 'הגינה שלי' }).waitFor({ timeout: 8000 }).then(() => true, () => false);
    check(`${P} works offline after first visit (garden with saved plant)`, offlineOk && (await page.getByText(/צמח אחד/).count()) > 0);
    await page.getByText('אין חיבור לאינטרנט. האפליקציה ממשיכה לעבוד כרגיל.').waitFor({ timeout: 3000 }).then(() => check(`${P} offline notice shown`, true), () => check(`${P} offline notice shown`, false));
    await page.goto(BASE + '#/play/memory-pairs');
    const offlineGame = await page.getByRole('group', { name: 'לוח הקלפים' }).waitFor({ timeout: 8000 }).then(() => true, () => false);
    check(`${P} game loads offline`, offlineGame);
    await shot('11-offline-game');
    await ctx.setOffline(false);

    const relevant = errors.filter((e) => !/favicon/.test(e));
    check(`${P} no console errors`, relevant.length === 0, relevant.slice(0, 3).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
