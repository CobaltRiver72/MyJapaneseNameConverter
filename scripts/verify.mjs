// scripts/verify.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PAGES = ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html', 'kanji-to-hiragana-converter.html'];

function normalize(html) {
  return html
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/g, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<link[^>]*rel="stylesheet"[^>]*href="\/_astro\/[^"]+"[^>]*>/g, '')
    .replace(/<script(?![^>]*type="application\/ld\+json")[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<script[^>]*src="\/_astro\/[^"]+"[^>]*><\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(line|circle|path|polyline|polygon|rect|ellipse|use|g)(\s[^>]*)\/>/g, '<$1$2></$1>')
    .replace(/\s+/g, ' ')
    .replace(/<\/body>\s*<\/html>/g, '</body></html>')
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&copy;/g, '©')
    .trim();
}

let failed = false;
for (const page of PAGES) {
  const currentPath = join('current', page);
  const distPath = join('dist', page);
  if (!existsSync(currentPath)) { console.error(`✗ ${page}  missing reference file`); failed = true; continue; }
  if (!existsSync(distPath)) { console.error(`✗ ${page}  missing built file`); failed = true; continue; }
  const current = normalize(readFileSync(currentPath, 'utf8'));
  const built = normalize(readFileSync(distPath, 'utf8'));
  if (current === built) {
    console.log(`✔ ${page}  0 unexpected diffs`);
  } else {
    console.error(`✗ ${page}  HTML differs after normalization`);
    let i = 0;
    while (i < Math.min(current.length, built.length) && current[i] === built[i]) i++;
    const start = Math.max(0, i - 100);
    console.error(`  current[${start}..${i + 100}]: ${JSON.stringify(current.slice(start, i + 100))}`);
    console.error(`  built  [${start}..${i + 100}]: ${JSON.stringify(built.slice(start, i + 100))}`);
    failed = true;
  }
}
if (failed) { console.error('\nVerification FAILED'); process.exit(1); }
console.log('\nAll pages verified — no unexpected differences.');
