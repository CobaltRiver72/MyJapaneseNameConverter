// scripts/verify.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PAGES = ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html', 'kanji-to-hiragana-converter.html', 'converter.html', 'converter/kanji-to-katakana.html', 'converter/hiragana-to-katakana.html'];

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
// ---------------------------------------------------------------------------
// Regression guardrails (added per pre-launch SEO audit). These assert SEO /
// crawl / mobile invariants on the built dist/ output so a future edit cannot
// silently degrade them past the byte-parity check above.
// ---------------------------------------------------------------------------
const ALL_PAGES = [...PAGES, '404.html'];
// URL POLICY (docs/URL-POLICY.md): legacy pages keep their indexed .html URLs
// (200, no redirects, .html self-canonicals). All NEW pages are extensionless.
const LEGACY_HTML_ROUTES = ['about', 'contact', 'privacy', 'terms', 'kanji-to-hiragana-converter'];
// Extensionless routes include the /converter silo hub and its spoke pages.
const EXTENSIONLESS_ROUTES = ['converter', 'converter/kanji-to-katakana', 'converter/hiragana-to-katakana'];
const PUBLIC_URLS = [
  'https://myjapanesenametranslator.com/',
  'https://myjapanesenametranslator.com/about.html',
  'https://myjapanesenametranslator.com/contact.html',
  'https://myjapanesenametranslator.com/kanji-to-hiragana-converter.html',
  'https://myjapanesenametranslator.com/converter',
  'https://myjapanesenametranslator.com/converter/kanji-to-katakana',
  'https://myjapanesenametranslator.com/converter/hiragana-to-katakana',
  'https://myjapanesenametranslator.com/privacy.html',
  'https://myjapanesenametranslator.com/terms.html',
];
// page file in dist/ -> exact expected canonical URL
const CANONICALS = {
  'index.html': 'https://myjapanesenametranslator.com/',
  'about.html': 'https://myjapanesenametranslator.com/about.html',
  'contact.html': 'https://myjapanesenametranslator.com/contact.html',
  'privacy.html': 'https://myjapanesenametranslator.com/privacy.html',
  'terms.html': 'https://myjapanesenametranslator.com/terms.html',
  'kanji-to-hiragana-converter.html': 'https://myjapanesenametranslator.com/kanji-to-hiragana-converter.html',
  'converter.html': 'https://myjapanesenametranslator.com/converter',
  'converter/kanji-to-katakana.html': 'https://myjapanesenametranslator.com/converter/kanji-to-katakana',
  'converter/hiragana-to-katakana.html': 'https://myjapanesenametranslator.com/converter/hiragana-to-katakana',
};
// page -> the browser JS file that must define toggleMobileNav
const NAV_SCRIPT = {
  'index.html': 'dist/script.js',
  'about.html': 'dist/scripts/site.js',
  'privacy.html': 'dist/scripts/site.js',
  'terms.html': 'dist/scripts/site.js',
  'contact.html': 'dist/scripts/site.js',
  '404.html': 'dist/scripts/site.js',
  'kanji-to-hiragana-converter.html': 'dist/scripts/kanji.js',
  'converter.html': 'dist/scripts/site.js',
  'converter/kanji-to-katakana.html': 'dist/scripts/kanji-katakana.js',
  'converter/hiragana-to-katakana.html': 'dist/scripts/hiragana-katakana.js',
};
const CSS_BUNDLES = ['dist/styles.css'];

function assert(cond, msg) {
  if (cond) { console.log(`✔ ${msg}`); }
  else { console.error(`✗ ${msg}`); failed = true; }
}

console.log('\n— Crawl / index guardrails —');
// Canonical self-reference + robots per page
for (const page of ALL_PAGES) {
  const html = existsSync(join('dist', page)) ? readFileSync(join('dist', page), 'utf8') : '';
  const robots = (html.match(/<meta name="robots" content="([^"]*)">/) || [])[1];
  if (page === '404.html') {
    assert(/noindex/.test(robots || ''), `404.html is noindex (${robots})`);
  } else {
    assert(robots === 'index, follow', `${page} robots = index, follow`);
  }
}
// Canonical URLs follow the URL policy exactly (legacy .html, new extensionless)
for (const [page, expected] of Object.entries(CANONICALS)) {
  const html = existsSync(join('dist', page)) ? readFileSync(join('dist', page), 'utf8') : '';
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)">/) || [])[1];
  assert(canonical === expected, `${page} canonical = ${expected} (got ${canonical})`);
}
// Sitemap = exactly the public URLs (legacy .html, new extensionless), never lists 404
const sitemap = existsSync('dist/sitemap.xml') ? readFileSync('dist/sitemap.xml', 'utf8') : '';
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
assert(JSON.stringify(locs) === JSON.stringify([...PUBLIC_URLS].sort()), 'sitemap lists exactly the public URLs');
assert(!/404\.html/.test(sitemap), 'sitemap excludes 404.html');
for (const route of LEGACY_HTML_ROUTES) {
  assert(sitemap.includes(`<loc>https://myjapanesenametranslator.com/${route}.html</loc>`), `sitemap lists legacy /${route}.html (indexed URL, must keep .html)`);
}
for (const route of EXTENSIONLESS_ROUTES) {
  assert(sitemap.includes(`<loc>https://myjapanesenametranslator.com/${route}</loc>`) && !sitemap.includes(`/${route}.html`), `sitemap lists /${route} extensionless`);
}
// robots.txt sane
const robotsTxt = existsSync('dist/robots.txt') ? readFileSync('dist/robots.txt', 'utf8') : '';
assert(/Sitemap:\s*https:\/\/myjapanesenametranslator\.com\/sitemap\.xml/.test(robotsTxt), 'robots.txt has correct Sitemap line');
assert(!/^\s*Disallow:\s*\/\S/m.test(robotsTxt), 'robots.txt has no active Disallow');
assert(!/Crawl-delay/i.test(robotsTxt), 'robots.txt has no Crawl-delay');
// ErrorDocument wired for genuine 404 status
assert(existsSync('dist/.htaccess') && /ErrorDocument 404 \/404\.html/.test(readFileSync('dist/.htaccess', 'utf8')), '.htaccess wires ErrorDocument 404');
const htaccess = existsSync('dist/.htaccess') ? readFileSync('dist/.htaccess', 'utf8') : '';
assert(/RewriteRule \^index\\\.html\$ \/\s+\[R=301,L\]/.test(htaccess), '.htaccess redirects /index.html to /');
assert(/RewriteCond %\{HTTP_HOST\} \^www\\\.myjapanesenametranslator\\\.com\$/.test(htaccess) && /https:\/\/myjapanesenametranslator\.com\/\$1 \[R=301,L\]/.test(htaccess), '.htaccess 301s www to non-www (canonical host)');
assert(/Strict-Transport-Security/.test(htaccess) && /X-Content-Type-Options/.test(htaccess), '.htaccess sets security headers');
assert(/ExpiresByType text\/html "access plus 0 seconds"/.test(htaccess), '.htaccess never long-caches HTML');
const exemptCond = htaccess.match(/RewriteCond %\{REQUEST_URI\} !\^\/\(([^)]+)\)\\\.html\$/);
assert(!!exemptCond, '.htaccess has a legacy-exemption RewriteCond before the .html redirect');
for (const route of LEGACY_HTML_ROUTES) {
  assert(!!exemptCond && exemptCond[1].split('|').includes(route), `.htaccess never redirects legacy /${route}.html (indexed URL)`);
}
assert(/RewriteRule \^\(\.\+\)\\\.html\$ \/\$1\s+\[R=301,L\]/.test(htaccess), '.htaccess redirects NEW pages\' .html variants to extensionless URLs');
assert(/RewriteRule \^\(\.\+\)\$ \$1\.html\s+\[L\]/.test(htaccess), '.htaccess internally serves extensionless URLs from .html files');
// Silo hub (/converter) collides with the converter/ spoke folder — serve the
// hub file explicitly and canonicalize the trailing slash away.
assert(/DirectorySlash Off/.test(htaccess), '.htaccess disables DirectorySlash for silo hub pages');
assert(/RewriteRule \^converter\\?\$ \/converter\.html \[L\]/.test(htaccess) || /RewriteRule \^converter\$ \/converter\.html \[L\]/.test(htaccess), '.htaccess serves /converter hub from converter.html');
assert(/RewriteRule \^converter\/\$ \/converter \[R=301,L\]/.test(htaccess), '.htaccess 301s /converter/ to /converter (no trailing slash)');

console.log('\n— URL policy guardrails (legacy .html / new extensionless) —');
for (const page of ALL_PAGES) {
  const html = existsSync(join('dist', page)) ? readFileSync(join('dist', page), 'utf8') : '';
  // Links to legacy pages must keep .html (exactly as indexed; no extensionless variants)
  for (const route of LEGACY_HTML_ROUTES) {
    assert(!html.includes(`href="/${route}"`), `${page} links to legacy /${route}.html, not extensionless /${route}`);
    assert(!html.includes(`https://myjapanesenametranslator.com/${route}"`) && !html.includes(`https://myjapanesenametranslator.com/${route}#`), `${page} does not reference extensionless URL for legacy /${route}`);
  }
  // Links to new pages must never expose .html
  for (const route of EXTENSIONLESS_ROUTES) {
    assert(!html.includes(`href="/${route}.html"`), `${page} does not link to /${route}.html`);
    assert(!html.includes(`https://myjapanesenametranslator.com/${route}.html`), `${page} does not reference .html URL for new page /${route}`);
  }
}

console.log('\n— Mobile guardrails —');
for (const page of ALL_PAGES) {
  const html = existsSync(join('dist', page)) ? readFileSync(join('dist', page), 'utf8') : '';
  assert(/<meta name="viewport" content="width=device-width, initial-scale=1.0">/.test(html), `${page} has viewport meta`);
}
for (const [page, script] of Object.entries(NAV_SCRIPT)) {
  const js = existsSync(script) ? readFileSync(script, 'utf8') : '';
  assert(/function toggleMobileNav/.test(js), `${page} -> ${script} defines toggleMobileNav`);
}
for (const css of CSS_BUNDLES) {
  const txt = existsSync(css) ? readFileSync(css, 'utf8') : '';
  assert(/@media\s*\(max-width:\s*640px\)/.test(txt), `${css} has 640px media query`);
}

if (failed) { console.error('\nVerification FAILED'); process.exit(1); }
console.log('\nAll pages verified — no unexpected differences.');
