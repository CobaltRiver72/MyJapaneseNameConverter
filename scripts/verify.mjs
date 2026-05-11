// scripts/verify.mjs
// Compares each built dist/<page>.html against current/<page>.html.
// Strips: whitespace, inline <style>, inline mobile-nav <script>, Astro <link>
// to /_astro/*.css, Astro <script src> to /_astro/*.js.
// Then diffs the remaining content. Any diff = unexpected change = build fails.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PAGES = ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html'];

function normalize(html) {
  return html
    // Drop inline <style>...</style> blocks
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    // Drop Astro-injected <link rel="stylesheet" href="/_astro/...">
    .replace(/<link[^>]*rel="stylesheet"[^>]*href="\/_astro\/[^"]+"[^>]*>/g, '')
    // Drop inline non-JSON-LD <script>...</script> blocks
    .replace(/<script(?![^>]*type="application\/ld\+json")[^>]*>[\s\S]*?<\/script>/g, '')
    // Drop Astro-injected <script src="/_astro/...">
    .replace(/<script[^>]*src="\/_astro\/[^"]+"[^>]*><\/script>/g, '')
    // Drop HTML comments (structural markers stripped by Astro)
    .replace(/<!--[\s\S]*?-->/g, '')
    // Normalize SVG self-closing tags to explicit close form (Astro expands them)
    .replace(/<(line|circle|path|polyline|polygon|rect|ellipse|use|g)(\s[^>]*)\/>/g, '<$1$2></$1>')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    // Normalize </body></html> variants (whitespace stripped by Astro between closing tags)
    .replace(/<\/body>\s*<\/html>/g, '</body></html>')
    // Normalize HTML-encoded apostrophe &#39; to literal ' (Astro escapes JSX text)
    .replace(/&#39;/g, "'")
    .trim();
}

let failed = false;
for (const page of PAGES) {
  const currentPath = join('current', page);
  const distPath = join('dist', page);

  if (!existsSync(currentPath)) {
    console.error(`✗ ${page}  missing reference file ${currentPath}`);
    failed = true;
    continue;
  }
  if (!existsSync(distPath)) {
    console.error(`✗ ${page}  missing built file ${distPath}`);
    failed = true;
    continue;
  }

  const current = normalize(readFileSync(currentPath, 'utf8'));
  const built = normalize(readFileSync(distPath, 'utf8'));

  if (current === built) {
    console.log(`✔ ${page}  0 unexpected diffs`);
  } else {
    console.error(`✗ ${page}  HTML differs after normalization`);
    // Print first divergence for debugging
    let i = 0;
    while (i < Math.min(current.length, built.length) && current[i] === built[i]) i++;
    const start = Math.max(0, i - 80);
    console.error(`  current[${start}..${i + 80}]: ${JSON.stringify(current.slice(start, i + 80))}`);
    console.error(`  built  [${start}..${i + 80}]: ${JSON.stringify(built.slice(start, i + 80))}`);
    failed = true;
  }
}

if (failed) {
  console.error('\nVerification FAILED — unexpected differences detected.');
  process.exit(1);
}
console.log('\nAll pages verified — no unexpected differences.');
