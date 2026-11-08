// Guards two project rules (part 1):
//  1. RTL-safe layout: no physical left/right CSS in app code (use logical properties).
//  2. No hard-coded UI text: Hebrew letters may appear only in locale files (src/i18n/locales)
//     and in game content packs (src/content/<lang>/), which are per-language by design.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../src/', import.meta.url).pathname;
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(f) && !/\.test\./.test(f)) files.push(p);
  }
})(root);

const physical = /\b(margin|padding|border)-(left|right)\b|\b(text-align|float|clear)\s*:\s*(left|right)\b|(^|[;{\s])(left|right)\s*:|\b(marginLeft|marginRight|paddingLeft|paddingRight|borderLeft|borderRight)\b|textAlign:\s*'(left|right)'|\b(left|right):\s*['\d]/m;
const hebrew = /[֐-׿]/;
const problems = [];
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$|\/\*.*?\*\//g, '');
    if (physical.test(code)) problems.push(`${f.replace(root, 'src/')}:${i + 1}  physical left/right: ${line.trim()}`);
    if (hebrew.test(code) && !f.includes('/src/content/')) problems.push(`${f.replace(root, 'src/')}:${i + 1}  Hebrew text outside locale files: ${line.trim()}`);
  });
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`RTL and i18n check passed (${files.length} files).`);
