# Design: Migrate myjapanesenametranslator.com to Astro with Externalized CSS/JS

**Date:** 2026-05-10
**Author:** Daniel Sato (founder) + collaborator
**Status:** Approved design (pending spec sign-off)

---

## Goal

Convert the existing static HTML site (`myjapanesenametranslator.com`) into an Astro project that emits the same 5 pages, with all inline CSS and JS extracted into external, content-hashed asset files. The site will be hosted on Hostinger as static files, just like today.

**Non-goals (explicitly out of scope):**
- No new pages, blog template, or tool template
- No URL changes
- No visible UI/UX/content changes
- No refactoring of HTML attributes, class names, or markup
- No CSP tightening (deferred to a later task)
- No clean-URL migration (deferred to a later task)

## Constraints

1. **Strict copy-paste constraint** — every HTML tag, attribute, class name, ID, ARIA attribute, alt text, link `href`, button name, schema field, and visible text must be byte-for-byte from the current `.html` files. The only allowed mechanical changes:
   - Move inline `<style>...</style>` content to external `.css` files referenced by `<link>`
   - Move inline `<script>...</script>` content (excluding JSON-LD) to external `.js` files referenced by `<script src>`
   - Deduplicate `toggleMobileNav()` (currently inline in all 5 pages) into one canonical copy in `site.js`
2. **JSON-LD schema blocks stay inline** — preserved byte-identical per page for SEO reliability.
3. **URLs stay identical** — `/`, `/about.html`, `/privacy.html`, `/terms.html`, `/contact.html`. No redirects needed.
4. **CSP header stays as-is** — keeps `'unsafe-inline'` because JSON-LD and inline event handlers (`onclick="toggleMobileNav()"`) remain.
5. **No SEO regressions** — every `<title>`, meta tag, OG tag, Twitter card, canonical, JSON-LD schema, heading, link, and alt text must be byte-identical post-migration. Verified by Layer 1 of the validation strategy.

## Architecture

### Tech stack
- **Astro** (static site generator) — `output: 'static'`, `build.format: 'file'`
- Vanilla CSS (no preprocessor)
- Vanilla JS (no framework)
- Hosted on Hostinger via File Manager / FTP upload of `dist/`

### Project structure

```
phoenix/
├── astro.config.mjs           # Astro config (output: static, build.format: file)
├── package.json               # npm scripts: dev, build, preview, verify
├── .gitignore                 # adds /node_modules, /dist
│
├── public/                    # Files copied to dist/ unchanged
│   ├── Favicon-My-Japanese-Name-Translator.png
│   ├── My-Japanese-Name-Translator-Logo.png
│   ├── robots.txt
│   └── sitemap.xml
│
├── src/
│   ├── pages/                 # One file per URL
│   │   ├── index.astro        → dist/index.html
│   │   ├── about.astro        → dist/about.html
│   │   ├── privacy.astro      → dist/privacy.html
│   │   ├── terms.astro        → dist/terms.html
│   │   └── contact.astro      → dist/contact.html
│   │
│   ├── layouts/               # Page shells
│   │   ├── BaseLayout.astro   # <html>, <head>, all meta tags, schema slot, body, site.js
│   │   ├── HomeLayout.astro   # extends Base; imports home.css + home.js
│   │   └── LegalLayout.astro  # extends Base; imports legal.css; renders Header/PageBanner/Footer
│   │
│   ├── components/            # Reusable bits
│   │   ├── Header.astro       # Logo, mobile menu button, nav (with currentPage prop)
│   │   ├── Footer.astro       # Site footer (no props)
│   │   └── PageBanner.astro   # Banner (kanji1, kanji2, title, subtitle props)
│   │
│   ├── styles/                # CSS bundled & content-hashed by Astro
│   │   ├── site.css           # Tokens, header, footer, mobile nav, animations (every page)
│   │   ├── home.css           # Index-only styles
│   │   └── legal.css          # about/privacy/terms/contact styles (incl. contact form)
│   │
│   └── scripts/               # JS bundled & content-hashed by Astro
│       ├── site.js            # toggleMobileNav() — every page
│       ├── home.js            # Converter algorithm — index only
│       └── contact.js         # Contact-form submit handler — contact only
│
├── scripts/
│   └── verify.mjs             # Layer 1 HTML-diff validation script
│
└── dist/                      # Build output (.gitignored); upload contents to Hostinger
```

### Component contracts

#### `BaseLayout.astro`
**Props:**
- `title: string`
- `description: string`
- `canonical: string` (full URL)
- `ogImage?: string` (defaults to logo URL)

**Renders:**
- `<!DOCTYPE html><html lang="en">`
- `<head>`: charset, viewport, title, description, canonical, robots, author, referrer, CSP, apple-touch-icon, OG tags (7), Twitter tags (4), font preconnects + Google Fonts URL, favicon, **`<slot name="schema" />`** for page-specific JSON-LD
- `<body>` with `<slot />` and `<script src="/_astro/site.[hash].js" defer>` injected automatically

#### `HomeLayout.astro`
- Wraps `BaseLayout`, forwards meta props
- Imports `home.css` and `home.js`

#### `LegalLayout.astro`
**Props:** Base props + `bannerKanji1`, `bannerKanji2`, `bannerTitle`, `bannerSubtitle`, `currentPage: 'about'|'privacy'|'terms'|'contact'`

**Renders:**
- `BaseLayout` with meta props
- Imports `legal.css`
- Skip-link, `<Header currentPage>`, `<PageBanner>`, `<main id="main-content"><article class="content-card"><slot /></article></main>`, `<Footer />`

#### `Header.astro`
**Props:** `currentPage?: string`
**Renders:** Existing header markup verbatim, with `aria-current="page"` set on the matching nav link.

#### `Footer.astro`
**No props.** Static, identical to existing footer.

#### `PageBanner.astro`
**Props:** `kanji1`, `kanji2`, `title`, `subtitle`

### Page files (5 of them, all small)

Each `src/pages/*.astro` contains only:
1. Frontmatter import of the appropriate layout
2. Layout component invocation with page-specific meta props
3. `<Fragment slot="schema">` containing the page's existing JSON-LD blocks (verbatim)
4. Body content copied byte-for-byte from the corresponding `.html` file's `<main>` content

## CSS extraction map

### `site.css` — selectors present in **all 5** existing pages
`:root` tokens, `*`, `body`, `body::before`, `.skip-link` + `:focus`, `.site-header`, `.logo`, `.logo-img`, `.header-nav`, `.header-nav a`, `.header-nav a[aria-current="page"]`, `.mobile-menu-btn` + `svg` + `:focus-visible`, `.site-footer`, `.footer-brand`, `.footer-tagline`, `.footer-links` + `a` + `a:hover`, `.footer-contact` + `a` + `a:hover`, `.footer-copy`, `@keyframes fadeUp`, `.animate-in`, `.delay-1`, `.delay-2`, `@media (max-width: 640px)` rules for header & mobile nav.

### `home.css` — index.html-only selectors (lines 34–780 of index.html)
`.logo-mark`, `.hero` + `::before`, `.hero-kanji.k1/k2/k3/k4`, `.hero-content`, `.hero-badge`, `.hero h1` + `.jp-text`, `.hero p`, `.converter-section`, `.converter-card`, `.converter-inner`, `.converter-label`, `.input-row`, `.name-input` + `:focus` + `::placeholder`, `.convert-btn` + `:hover` + `:active`, `.faq-q:focus-visible`, `.script-toggles`, `.script-toggle` + `:hover` + `.active` + `.jp`, `.results-area` + `.visible`, `.result-block` + `:hover`, `.result-script-label`, `.result-japanese`, `.result-romaji`, `.result-actions`, `.action-btn` + `:hover` + `svg`, `.copied-toast` + `.show`, `.popular-section`, `.popular-group` + `:last-child`, `.popular-header` + `h2`/`h3`/`span`, `.names-grid`, `.name-chip` + `:hover` + `.chip-jp`, `.about-section`, `.about-card` + `h2`/`p`/`h3`, `.writing-systems`, `.ws-card`, `.ws-char`, `.ws-name`, `.ws-jp`, `.ws-desc`, `.faq-section` + `h2`, `.faq-item` + `:first-child` + `.open .faq-q::after`, `.faq-q` + `::after`, `.faq-a` + `.faq-item.open .faq-a`, `.delay-3`, `.delay-4`, plus home-only mobile media queries.

### `legal.css` — selectors in legal pages but not index
`.page-banner` + `::before`, `.banner-kanji.k1` + `.k2`, `.banner-content` + `h1` + `h1 .jp-text` + `p`, `.page-content`, `.content-card` + `h2` + `h2:first-child` + `h3` + `p` + `ul/ol/li` + `a` + `a:hover` + `strong`, `.highlight-box` + `p`, `.feature-grid`, `.feature-item`, `.feature-icon`, `.feature-title`, `.feature-desc`, `.section-divider`, `.effective-date`, plus legal-page mobile media queries.

**Contact-only selectors (still in legal.css per YAGNI):** `.content-grid`, `.content-card.full-width`, `.contact-info-list`, `.contact-info-item` + `:first-child` + `:last-child`, `.contact-icon` + `svg`, `.contact-info-label`, `.contact-info-value` + `a` + `a:hover`, `.response-badge`, `.response-dot`, `@keyframes pulse`, `.contact-form`, `.form-group`, `.form-label` + `.required`, `.form-textarea` + `:focus` + `::placeholder`, `.submit-btn` + `:focus-visible` + `:hover` + `:active` + `:disabled`, `.form-note`, `.form-message` + `.success` + `.error`, `@keyframes spin` (currently in contact.html's secondary `<style>` block at lines 929–934).

## JS extraction map

### `site.js`
Verbatim copy of `toggleMobileNav()` from any secondary page (e.g., about.html lines 704–709).

### `home.js`
Verbatim copy of index.html lines 1510–1898 (entire inline `<script>` body), **excluding** the duplicate `toggleMobileNav` definition at lines 1868–1874 (provided by site.js instead).

### `contact.js`
Verbatim copy of contact.html lines 869–927 (the contact-form submit handler), **excluding** the duplicate `toggleMobileNav` at lines 862–867 (provided by site.js instead).

## SEO preservation guarantees

Every per-page SEO element is byte-identical post-migration:
- `<title>`, `<meta name="description">`, `<link rel="canonical">`
- `<meta name="robots">`, `<meta name="author">`, `<meta name="referrer">`
- CSP, apple-touch-icon, favicon
- All 7 Open Graph tags
- All 4 Twitter Card tags
- Font preconnect + Google Fonts URL
- All JSON-LD schema blocks (Person, Organization, WebSite, FAQPage on home; WebPage variants on legal pages)
- All H1/H2/H3 headings, visible text, image alt text, ARIA attributes, semantic tags
- All internal links (`/about.html` etc.)
- `robots.txt`, `sitemap.xml`

**Improvements gained for free:**
- Smaller HTML payload per page (~80 KB → ~12–18 KB on index)
- Cross-page CSS caching (visitor downloads `site.css` once)
- Astro auto-minification of HTML/CSS/JS
- Content-hashed asset filenames for perfect cache busting

## Validation strategy

### Layer 1 — Build-time HTML diff (gate)
`scripts/verify.mjs`:
1. For each of the 5 pages: read `current/<page>.html` and `dist/<page>.html`.
2. Strip whitespace, the inline `<style>` block, and the inline mobile-nav `<script>` block from the current file.
3. Strip whitespace and replace the new file's `<link rel="stylesheet" href="/_astro/...">` and `<script src="/_astro/...">` lines with empty strings.
4. Diff. **Expected: zero differences** in title, meta, OG, Twitter, canonical, JSON-LD, headings, body content, links, alt text, ARIA, footer.
5. Fail the build if any unexpected diff is found.

### Layer 2 — Manual smoke test
Via `npm run preview`, side-by-side with live site:
- Header/footer render identically
- Mobile menu opens/closes
- Homepage converter: produces correct Katakana/Romaji output, copy buttons work, popular-name chips functional
- Contact form: validation, mailto submit
- FAQ accordions expand/collapse
- Skip-link reachable via Tab

### Layer 3 — Live post-deploy
- Google Rich Results Test on each of 5 URLs
- PageSpeed Insights on each of 5 URLs (capture before/after)
- View-source spot check

## Migration approach

**Big-bang cutover:** Build the full Astro version, run all 3 validation layers locally, then upload `dist/` contents to Hostinger `public_html/` in one operation.

**Reference-snapshot for diff verification:** Before any source file is moved or modified, the current 5 `.html` files at the repo root are copied to `current/` (gitignored). The Layer 1 diff script reads from `current/<page>.html` to compare against `dist/<page>.html`. The `current/` directory can be deleted once the migration is verified and deployed.

**Backup before deploy:** Download a zip of current `public_html/` from Hostinger File Manager. Provides ~2-minute rollback path if anything looks wrong.

## Build & deploy flow

### Local development
```
npm install
npm run dev         # http://localhost:4321
npm run build       # produces dist/
npm run preview     # serves dist/ at http://localhost:4321
npm run verify      # runs Layer 1 HTML diff
```

### Deploy to Hostinger
1. Backup `public_html/` to local zip via File Manager.
2. `npm run build && npm run verify && npm run preview` — all must pass.
3. Upload `dist/` contents to `public_html/` (drag-drop in File Manager, or FTP).
4. Spot-check live URLs in incognito.

### Rollback
1. Delete contents of `public_html/`.
2. Re-upload backup zip.

## Open questions / future work (out of scope for this migration)

- Tightening CSP to remove `'unsafe-inline'` once tooling is stable.
- Migrating to clean URLs (`/about` instead of `/about.html`) once tooling is stable — would require 301 redirects on Hostinger.
- Adding tool/blog templates when those features become real.
- Adding `astro-sitemap` integration once we add new pages (current `sitemap.xml` is hand-maintained).
