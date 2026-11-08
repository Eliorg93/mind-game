// Renders the app icons (PNG) from inline SVG with headless Chrome.
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';

const sprout = (stroke, leaf) => `<g fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 39V22"/><path d="M24 27C15 27 10 20 10 13C18 13 24 18 24 27Z" fill="${leaf}"/><path d="M24 22C24 14 30 8 38 8C38 16 32 22 24 22Z" fill="${leaf}"/><path d="M14 39H34"/></g>`;
// "any" icon: green rounded tile. Maskable: full-bleed, sprout inside the 80% safe zone.
const any = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="11" fill="#24482D"/>${sprout('#FAF6EC', '#5E8C61')}</svg>`;
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#24482D"/><g transform="translate(7.2 7.2) scale(0.7)">${sprout('#FAF6EC', '#5E8C61')}</g></svg>`;
const apple = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#24482D"/><g transform="translate(4.8 4.8) scale(0.8)">${sprout('#FAF6EC', '#5E8C61')}</g></svg>`;

const jobs = [
  ['public/icons/icon-192.png', any, 192],
  ['public/icons/icon-512.png', any, 512],
  ['public/icons/icon-maskable-512.png', maskable, 512],
  ['public/icons/apple-touch-icon.png', apple, 180],
];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
const page = await browser.newPage();
for (const [out, svg, size] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  writeFileSync(out, await page.screenshot({ omitBackground: true }));
  console.log('wrote', out);
}
await browser.close();
