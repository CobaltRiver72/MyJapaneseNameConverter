# Migrate myjapanesenametranslator.com to Astro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the existing static-HTML site (5 pages) to an Astro project that emits the same 5 pages with all inline CSS and JS extracted into external, content-hashed asset files. No URL changes, no UI/UX/content changes, no SEO regressions.

**Architecture:** Astro `output: 'static'` with `build.format: 'file'` so URLs stay `/about.html` etc. Three layouts (Base, Home, Legal), three components (Header, Footer, PageBanner), three CSS files (site, home, legal), three JS files (site, home, contact). Strict copy-paste from existing HTML; only mechanical change is moving `<style>`/`<script>` content to external files.

**Tech Stack:** Astro 5.x, Node 18+, vanilla CSS, vanilla JS. No framework. No preprocessor.

**Spec:** `docs/superpowers/specs/2026-05-10-extract-inline-assets-design.md`

---

## File Structure

**Created:**
- `astro.config.mjs` — Astro config
- `package.json` — npm scripts + Astro dep (project may not have package.json yet)
- `.gitignore` — adds /node_modules, /dist, /current
- `scripts/verify.mjs` — Layer 1 HTML diff validation script
- `current/index.html`, `current/about.html`, `current/privacy.html`, `current/terms.html`, `current/contact.html` — reference snapshot of existing source (gitignored, used by verify script)
- `public/Favicon-My-Japanese-Name-Translator.png`, `public/My-Japanese-Name-Translator-Logo.png`, `public/robots.txt`, `public/sitemap.xml` — static assets served as-is
- `src/styles/site.css`, `src/styles/home.css`, `src/styles/legal.css`
- `src/scripts/site.js`, `src/scripts/home.js`, `src/scripts/contact.js`
- `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/PageBanner.astro`
- `src/layouts/BaseLayout.astro`, `src/layouts/HomeLayout.astro`, `src/layouts/LegalLayout.astro`
- `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/privacy.astro`, `src/pages/terms.astro`, `src/pages/contact.astro`

**Deleted (final cleanup, after verification passes):**
- Root-level `index.html`, `about.html`, `privacy.html`, `terms.html`, `contact.html` (their content lives in `src/pages/*.astro` and `src/styles/*.css` and `src/scripts/*.js`)
- Root-level `Favicon-My-Japanese-Name-Translator.png`, `My-Japanese-Name-Translator-Logo.png`, `robots.txt`, `sitemap.xml` (moved to `public/`)

---

## Phase 1 — Foundation

### Task 1: Snapshot current HTML files for diff verification

**Files:**
- Create: `current/index.html`, `current/about.html`, `current/privacy.html`, `current/terms.html`, `current/contact.html`

- [ ] **Step 1: Create the `current/` directory and copy the 5 existing HTML files into it**

```bash
mkdir -p current
cp index.html current/index.html
cp about.html current/about.html
cp privacy.html current/privacy.html
cp terms.html current/terms.html
cp contact.html current/contact.html
```

- [ ] **Step 2: Verify the snapshot is byte-identical to the originals**

```bash
diff index.html current/index.html
diff about.html current/about.html
diff privacy.html current/privacy.html
diff terms.html current/terms.html
diff contact.html current/contact.html
```
Expected: zero output from each diff (files identical).

- [ ] **Step 3: Commit** (no `current/` in git yet — just an intermediate snapshot, will be gitignored next task)

```bash
# Skip this commit — we'll add current/ to .gitignore in the next task
```

---

### Task 2: Initialize Astro project structure

**Files:**
- Create: `package.json`, `astro.config.mjs`, `.gitignore`, `tsconfig.json`

- [ ] **Step 1: Create `package.json` at the project root**

```json
{
  "name": "myjapanesenametranslator-com",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "verify": "node scripts/verify.mjs",
    "check": "npm run build && npm run verify"
  },
  "dependencies": {
    "astro": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create `astro.config.mjs` at the project root**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://myjapanesenametranslator.com',
  output: 'static',
  build: {
    format: 'file',
  },
  trailingSlash: 'never',
});
```

- [ ] **Step 3: Create `.gitignore` at the project root**

```
node_modules/
dist/
current/
.astro/
.DS_Store
*.log
```

- [ ] **Step 4: Create `tsconfig.json` at the project root** (Astro requires this for `.astro` file IntelliSense; no actual TS code is written)

```json
{
  "extends": "astro/tsconfigs/base"
}
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```
Expected: `node_modules/` appears, `package-lock.json` is created, no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json astro.config.mjs .gitignore tsconfig.json
git commit -m "Initialize Astro project for static-site migration"
```

---

### Task 3: Move static assets to `public/`

**Files:**
- Create: `public/Favicon-My-Japanese-Name-Translator.png`, `public/My-Japanese-Name-Translator-Logo.png`, `public/robots.txt`, `public/sitemap.xml`

- [ ] **Step 1: Create `public/` and move assets**

```bash
mkdir -p public
mv Favicon-My-Japanese-Name-Translator.png public/
mv My-Japanese-Name-Translator-Logo.png public/
mv robots.txt public/
mv sitemap.xml public/
```

- [ ] **Step 2: Verify the move**

```bash
ls public/
```
Expected: 4 files listed: `Favicon-My-Japanese-Name-Translator.png`, `My-Japanese-Name-Translator-Logo.png`, `robots.txt`, `sitemap.xml`.

- [ ] **Step 3: Commit**

```bash
git add public/ -A
git commit -m "Move static assets to public/ for Astro build"
```

---

### Task 4: Write verify.mjs HTML-diff script (the validation gate)

**Files:**
- Create: `scripts/verify.mjs`

- [ ] **Step 1: Create the verify script**

```js
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
    // Collapse whitespace
    .replace(/\s+/g, ' ')
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
```

- [ ] **Step 2: Run the script (must fail because `dist/` doesn't exist yet — TDD style)**

```bash
mkdir -p scripts && node scripts/verify.mjs
```
Expected: 5 lines reporting `missing built file dist/<page>.html`, exit code 1, final line "Verification FAILED".

- [ ] **Step 3: Commit**

```bash
git add scripts/verify.mjs
git commit -m "Add verify.mjs HTML-diff script for migration validation"
```

---

## Phase 2 — Build foundational components and one legal page (terms.html — the smallest)

### Task 5: Create the Header component

**Files:**
- Create: `src/components/Header.astro`

- [ ] **Step 1: Read the existing header from current/about.html**

```bash
sed -n '581,596p' current/about.html
```
Expected: outputs the `<header class="site-header">...</header>` block, lines 581–596.

- [ ] **Step 2: Create `src/components/Header.astro`**

The component takes a `currentPage` prop and adds `aria-current="page"` to the matching nav link. All other markup is byte-identical to the existing header.

```astro
---
interface Props {
  currentPage?: 'home' | 'about' | 'privacy' | 'terms' | 'contact';
}
const { currentPage } = Astro.props;
---
<header class="site-header" role="banner">
    <a href="/" class="logo" aria-label="My Japanese Name Translator - Home">
        <img src="https://myjapanesenametranslator.com/My-Japanese-Name-Translator-Logo.png" alt="My Japanese Name Translator Logo" class="logo-img" width="132" height="44">
    </a>
    <button class="mobile-menu-btn" aria-label="Toggle navigation menu" aria-expanded="false" onclick="toggleMobileNav()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <nav class="header-nav" role="navigation" aria-label="Main navigation">
        <a href="/" {...(currentPage === 'home' ? { 'aria-current': 'page' } : {})}>Home</a>
        <a href="/about.html" {...(currentPage === 'about' ? { 'aria-current': 'page' } : {})}>About</a>
        <a href="/privacy.html" {...(currentPage === 'privacy' ? { 'aria-current': 'page' } : {})}>Privacy</a>
        <a href="/terms.html" {...(currentPage === 'terms' ? { 'aria-current': 'page' } : {})}>Terms</a>
        <a href="/contact.html" {...(currentPage === 'contact' ? { 'aria-current': 'page' } : {})}>Contact</a>
    </nav>
</header>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.astro
git commit -m "Add Header component with currentPage-driven aria-current"
```

---

### Task 6: Create the Footer component

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Read the existing footer from current/about.html**

```bash
sed -n '687,701p' current/about.html
```
Expected: outputs the `<footer class="site-footer">...</footer>` block, lines 687–701.

- [ ] **Step 2: Create `src/components/Footer.astro`** (no props, byte-identical to current footer)

```astro
---
---
<footer class="site-footer" role="contentinfo">
    <div class="footer-brand">My Japanese Name Translator</div>
    <div class="footer-tagline">Translate Your Name in Japanese</div>
    <nav class="footer-links" aria-label="Footer navigation">
        <a href="/">Home</a>
        <a href="/about.html">About</a>
        <a href="/privacy.html">Privacy Policy</a>
        <a href="/terms.html">Terms of Service</a>
        <a href="/contact.html">Contact</a>
    </nav>
    <div class="footer-contact">
        <a href="mailto:contact@myjapanesenametranslator.com">contact@myjapanesenametranslator.com</a>
    </div>
    <div class="footer-copy">&copy; 2026 My Japanese Name Translator. All rights reserved.</div>
</footer>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.astro
git commit -m "Add Footer component"
```

---

### Task 7: Create the PageBanner component

**Files:**
- Create: `src/components/PageBanner.astro`

- [ ] **Step 1: Read the existing page banner from current/about.html**

```bash
sed -n '598,606p' current/about.html
```
Expected: outputs the `<section class="page-banner">...</section>` block.

- [ ] **Step 2: Create `src/components/PageBanner.astro`** (props: kanji1, kanji2, title, subtitle)

```astro
---
interface Props {
  kanji1: string;
  kanji2: string;
  title: string;
  subtitle: string;
}
const { kanji1, kanji2, title, subtitle } = Astro.props;
---
<section class="page-banner">
    <div class="banner-kanji k1" aria-hidden="true">{kanji1}</div>
    <div class="banner-kanji k2" aria-hidden="true">{kanji2}</div>
    <div class="banner-content">
        <h1 class="animate-in delay-1">{title}</h1>
        <p class="animate-in delay-2">{subtitle}</p>
    </div>
</section>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PageBanner.astro
git commit -m "Add PageBanner component"
```

---

### Task 8: Extract `site.js` (toggleMobileNav)

**Files:**
- Create: `src/scripts/site.js`

- [ ] **Step 1: Read the existing inline script from current/about.html lines 704–709**

```bash
sed -n '704,709p' current/about.html
```
Expected: outputs the `function toggleMobileNav()` body.

- [ ] **Step 2: Create `src/scripts/site.js` — verbatim copy of those 6 lines**

```js
function toggleMobileNav() {
    const nav = document.querySelector('.header-nav');
    const btn = document.querySelector('.mobile-menu-btn');
    const isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/scripts/site.js
git commit -m "Extract site.js with toggleMobileNav (shared across all pages)"
```

---

### Task 9: Extract `site.css` (selectors common to all 5 pages)

**Files:**
- Create: `src/styles/site.css`

- [ ] **Step 1: Read the head-CSS portion of current/about.html (lines 176–294 covers the shared header/banner section, but the shared selectors run beyond that — read the full block)**

```bash
sed -n '176,575p' current/about.html
```
Expected: outputs the full `<style>...</style>` content of about.html.

- [ ] **Step 2: Create `src/styles/site.css` containing only selectors that exist in every page**

Copy these exact CSS rule blocks from `current/about.html`'s `<style>` (each rule copied byte-for-byte from its current source), grouped into one file:

- `:root { ... }` (CSS custom properties / brand tokens) — copy lines ~177–193 from about.html's style block
- `* { margin: 0; padding: 0; box-sizing: border-box; }`
- `body { ... }` and `body::before { ... }` (texture overlay)
- `.skip-link { ... }` and `.skip-link:focus { ... }`
- `.site-header { ... }`, `.logo { ... }`, `.logo-img { ... }`
- `.header-nav { ... }`, `.header-nav a { ... }`, `.header-nav a[aria-current="page"] { ... }`
- `.mobile-menu-btn { ... }`, `.mobile-menu-btn svg { ... }`, `.mobile-menu-btn:focus-visible { ... }`
- `.site-footer { ... }`, `.footer-brand { ... }`, `.footer-tagline { ... }`, `.footer-links { ... }`, `.footer-links a { ... }`, `.footer-links a:hover { ... }`, `.footer-contact { ... }`, `.footer-contact a { ... }`, `.footer-contact a:hover { ... }`, `.footer-copy { ... }`
- `@keyframes fadeUp { ... }`, `.animate-in { ... }`, `.delay-1 { ... }`, `.delay-2 { ... }`
- `@media (max-width: 640px) { .site-header { ... } .header-nav { ... } .header-nav a { ... } .header-nav.open { ... } .mobile-menu-btn { ... } }` — only those 5 mobile rules go in site.css; the other rules in the about.html mobile media query block (`.page-banner`, `.content-card`, `.feature-grid`) belong to legal.css.

Do NOT copy any selector that is `.page-banner*`, `.banner-*`, `.content-*`, `.highlight-*`, `.feature-*`, `.section-divider`, `.effective-date` — those go in legal.css (next task).

- [ ] **Step 3: Verify by counting unique top-level selectors**

```bash
grep -cE '^\.[a-zA-Z]|^@(media|keyframes)|^:root|^\*|^body' src/styles/site.css
```
Expected: a number around 25–30 (the shared selectors enumerated above).

- [ ] **Step 4: Commit**

```bash
git add src/styles/site.css
git commit -m "Extract site.css with selectors shared by all 5 pages"
```

---

### Task 10: Extract `legal.css` (selectors for legal pages)

**Files:**
- Create: `src/styles/legal.css`

- [ ] **Step 1: Create `src/styles/legal.css`**

Copy these exact CSS rule blocks from `current/about.html`'s `<style>` block (verbatim):

- `.page-banner { ... }`, `.page-banner::before { ... }`
- `.banner-kanji { ... }`, `.banner-kanji.k1 { ... }`, `.banner-kanji.k2 { ... }`
- `.banner-content { ... }`, `.banner-content h1 { ... }`, `.banner-content h1 .jp-text { ... }`, `.banner-content p { ... }`
- `.page-content { ... }`
- `.content-card { ... }`, `.content-card h2 { ... }`, `.content-card h2:first-child { ... }`, `.content-card h3 { ... }`, `.content-card p { ... }`, `.content-card ul, .content-card ol { ... }`, `.content-card li { ... }`, `.content-card a { ... }`, `.content-card a:hover { ... }`, `.content-card strong { ... }`
- `.highlight-box { ... }`, `.highlight-box p { ... }`
- `.feature-grid { ... }`, `.feature-item { ... }`, `.feature-icon { ... }`, `.feature-title { ... }`, `.feature-desc { ... }`
- `.section-divider { ... }`
- The legal-specific portion of `@media (max-width: 640px)` from about.html: `.page-banner { ... }`, `.content-card { ... }`, `.feature-grid { ... }`

Then append the privacy/terms-only selector from `current/privacy.html`'s `<style>`:
- `.effective-date { ... }`

Then append the contact-only selectors from `current/contact.html`'s `<style>` blocks (BOTH the main one starting line 176 and the trailing one with `@keyframes spin`):
- `.content-grid { ... }`
- `.content-card.full-width { ... }`
- `.contact-info-list { ... }`, `.contact-info-item { ... }`, `.contact-info-item:first-child { ... }`, `.contact-info-item:last-child { ... }`
- `.contact-icon { ... }`, `.contact-icon svg { ... }`
- `.contact-info-label { ... }`, `.contact-info-value { ... }`, `.contact-info-value a { ... }`, `.contact-info-value a:hover { ... }`
- `.response-badge { ... }`, `.response-dot { ... }`, `@keyframes pulse { ... }`
- `.contact-form { ... }`
- `.form-group { ... }`, `.form-label { ... }`, `.form-label .required { ... }`
- `.form-textarea { ... }`, `.form-textarea:focus { ... }`, `.form-textarea::placeholder { ... }`
- `.submit-btn { ... }`, `.submit-btn:focus-visible { ... }`, `.submit-btn:hover { ... }`, `.submit-btn:active { ... }`, `.submit-btn:disabled { ... }`
- `.form-note { ... }`, `.form-message { ... }`, `.form-message.success { ... }`, `.form-message.error { ... }`
- The contact-only portion of mobile `@media`: `.content-grid { ... }` from contact.html
- `@keyframes spin { ... }` (from contact.html lines 930–933)

- [ ] **Step 2: Commit**

```bash
git add src/styles/legal.css
git commit -m "Extract legal.css for about/privacy/terms/contact pages"
```

---

### Task 11: Create the BaseLayout

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Read the existing `<head>` of current/about.html to see exactly which tags to preserve**

```bash
sed -n '1,34p' current/about.html
```
Expected: shows DOCTYPE, html, head opening, charset, viewport, title placeholder, description, canonical, robots, author, referrer, CSP, apple-touch-icon, OG×7, Twitter×4, font preconnects, Google Fonts URL, favicon link.

- [ ] **Step 2: Create `src/layouts/BaseLayout.astro`**

```astro
---
import '../scripts/site.js';

interface Props {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}
const {
  title,
  description,
  canonical,
  ogImage = 'https://myjapanesenametranslator.com/My-Japanese-Name-Translator-Logo.png',
  ogTitle = title,
  ogDescription = description,
  twitterTitle = title,
  twitterDescription = description,
} = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content={description}>
    <link rel="canonical" href={canonical}>
    <meta name="robots" content="index, follow">
    <meta name="author" content="Daniel Sato">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://myjapanesenametranslator.com data:; connect-src 'self' https://www.google-analytics.com;">
    <link rel="apple-touch-icon" href="https://myjapanesenametranslator.com/Favicon-My-Japanese-Name-Translator.png">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content={canonical}>
    <meta property="og:title" content={ogTitle}>
    <meta property="og:description" content={ogDescription}>
    <meta property="og:image" content={ogImage}>
    <meta property="og:site_name" content="My Japanese Name Translator">
    <meta property="og:locale" content="en_US">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content={twitterTitle}>
    <meta name="twitter:description" content={twitterDescription}>
    <meta name="twitter:image" content={ogImage}>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=Noto+Serif+JP:wght@400;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="icon" type="image/png" href="https://myjapanesenametranslator.com/Favicon-My-Japanese-Name-Translator.png">

    <slot name="schema" />
</head>
<body>
    <slot />
</body>
</html>
```

**Important:** The order of `<head>` elements matches `current/about.html` exactly (line-for-line). The page-specific `<title>` and `<meta name="description">` are templated; everything else is byte-identical.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "Add BaseLayout with full head metadata + schema slot"
```

---

### Task 12: Create the LegalLayout

**Files:**
- Create: `src/layouts/LegalLayout.astro`

- [ ] **Step 1: Create `src/layouts/LegalLayout.astro`**

```astro
---
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import PageBanner from '../components/PageBanner.astro';
import '../styles/site.css';
import '../styles/legal.css';

interface Props {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  bannerKanji1: string;
  bannerKanji2: string;
  bannerTitle: string;
  bannerSubtitle: string;
  currentPage: 'about' | 'privacy' | 'terms' | 'contact';
}
const {
  title, description, canonical, ogImage, ogTitle, ogDescription, twitterTitle, twitterDescription,
  bannerKanji1, bannerKanji2, bannerTitle, bannerSubtitle, currentPage,
} = Astro.props;
---
<BaseLayout
  {title} {description} {canonical}
  {ogImage} {ogTitle} {ogDescription} {twitterTitle} {twitterDescription}
>
  <slot name="schema" slot="schema" />

  <a href="#main-content" class="skip-link">Skip to main content</a>

  <Header currentPage={currentPage} />

  <PageBanner
    kanji1={bannerKanji1}
    kanji2={bannerKanji2}
    title={bannerTitle}
    subtitle={bannerSubtitle}
  />

  <main class="page-content" id="main-content" role="main">
    <slot />
  </main>

  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/LegalLayout.astro
git commit -m "Add LegalLayout for about/privacy/terms/contact pages"
```

---

### Task 13: Create `terms.astro` and run first verification

**Files:**
- Create: `src/pages/terms.astro`

- [ ] **Step 1: Read the body content of current/terms.html**

```bash
sed -n '555,720p' current/terms.html
```
Expected: outputs the `<main>...</main>` content of the terms page.

- [ ] **Step 2: Read the JSON-LD schema block from current/terms.html lines 35–174**

```bash
sed -n '35,174p' current/terms.html
```
Expected: outputs the `<script type="application/ld+json">...</script>` block.

- [ ] **Step 3: Create `src/pages/terms.astro`**

**IMPORTANT — exact metadata values from current/terms.html (do NOT change a single character):**
- `<title>`: `Terms of Service | My Japanese Name Translator` (line 6)
- `<meta name="description">`: `Terms of Service for My Japanese Name Translator. Read our terms covering service usage, name translation accuracy disclaimer, intellectual property, and user conduct.` (line 7)
- `<link rel="canonical">`: `https://myjapanesenametranslator.com/terms` (line 8) — **NO `.html` suffix; this is intentional**
- og:title: `Terms of Service | My Japanese Name Translator` (line 18) — same as title
- og:description: `Terms of Service for My Japanese Name Translator. Read our terms covering service usage, accuracy disclaimers, and user conduct.` (line 19) — DIFFERS from description
- twitter:title: same as title (line 26)
- twitter:description: `Terms of Service for My Japanese Name Translator. Service usage terms, disclaimers, and user conduct rules.` (line 27) — DIFFERS from description

```astro
---
import LegalLayout from '../layouts/LegalLayout.astro';
---
<LegalLayout
  title="Terms of Service | My Japanese Name Translator"
  description="Terms of Service for My Japanese Name Translator. Read our terms covering service usage, name translation accuracy disclaimer, intellectual property, and user conduct."
  canonical="https://myjapanesenametranslator.com/terms"
  ogDescription="Terms of Service for My Japanese Name Translator. Read our terms covering service usage, accuracy disclaimers, and user conduct."
  twitterDescription="Terms of Service for My Japanese Name Translator. Service usage terms, disclaimers, and user conduct rules."
  bannerKanji1="規"
  bannerKanji2="約"
  bannerTitle="Terms of Service"
  bannerSubtitle="Please read these terms carefully before using our services"
  currentPage="terms"
>
  <Fragment slot="schema">
    <!-- Paste the entire <script type="application/ld+json">...</script> block from current/terms.html lines 35-174 here, byte-for-byte -->
  </Fragment>

  <article class="content-card">
    <!-- Paste the entire content of <article class="content-card"> from current/terms.html (the <main>'s child) here, byte-for-byte. Verify <title>, <meta name="description"> match the layout props above. -->
  </article>
</LegalLayout>
```

**Important:** The exact `title` and `description` values above must match what's in `current/terms.html` `<title>` and `<meta name="description">`. Verify by reading lines 6–7 of current/terms.html before writing them in.

- [ ] **Step 4: Build and verify**

```bash
npm run build
node scripts/verify.mjs
```
Expected output:
```
✗ index.html      missing built file dist/index.html      (still expected — pages not built yet)
✗ about.html      missing built file dist/about.html
✗ privacy.html    missing built file dist/privacy.html
✔ terms.html      0 unexpected diffs
✗ contact.html    missing built file dist/contact.html
```

If `terms.html` shows ANY unexpected diff, fix it before continuing. Common fixes:
- Missing whitespace in JSON-LD → re-paste from `current/terms.html`
- Wrong content in `<article>` → re-paste body content
- Missing meta tag in BaseLayout → fix BaseLayout

- [ ] **Step 5: Commit (only when terms.html verifies clean)**

```bash
git add src/pages/terms.astro
git commit -m "Add terms.astro page; verify HTML diff passes"
```

---

## Phase 3 — Replicate for the other 3 legal pages

### Task 14: Create `privacy.astro`

**Files:**
- Create: `src/pages/privacy.astro`

- [ ] **Step 1: Read body content + JSON-LD from current/privacy.html**

```bash
sed -n '35,174p' current/privacy.html   # JSON-LD schema
sed -n '584,825p' current/privacy.html   # body content (article.content-card)
sed -n '6,7p' current/privacy.html       # title and description
```

- [ ] **Step 2: Create `src/pages/privacy.astro`** with these exact metadata values from current/privacy.html:

- `<title>`: `Privacy Policy | My Japanese Name Translator` (line 6)
- `<meta name="description">`: `Privacy Policy for My Japanese Name Translator. Learn how we handle your data, our cookie policy, GDPR compliance, and your rights as a user.` (line 7)
- `<link rel="canonical">`: `https://myjapanesenametranslator.com/privacy` (line 8) — **NO `.html` suffix**
- og:description: `Privacy Policy for My Japanese Name Translator. Learn how we handle your data, our cookie policy, and GDPR compliance.` (line 19)
- twitter:description: `Privacy Policy for My Japanese Name Translator. Learn how we handle your data and your privacy rights.` (line 27)
- bannerKanji1: `秘`, bannerKanji2: `密`
- bannerTitle: `Privacy Policy`
- bannerSubtitle: `How we collect, use, and protect your information` (from current/privacy.html line 580)
- currentPage: `privacy`

```astro
---
import LegalLayout from '../layouts/LegalLayout.astro';
---
<LegalLayout
  title="Privacy Policy | My Japanese Name Translator"
  description="Privacy Policy for My Japanese Name Translator. Learn how we handle your data, our cookie policy, GDPR compliance, and your rights as a user."
  canonical="https://myjapanesenametranslator.com/privacy"
  ogDescription="Privacy Policy for My Japanese Name Translator. Learn how we handle your data, our cookie policy, and GDPR compliance."
  twitterDescription="Privacy Policy for My Japanese Name Translator. Learn how we handle your data and your privacy rights."
  bannerKanji1="秘"
  bannerKanji2="密"
  bannerTitle="Privacy Policy"
  bannerSubtitle="How we collect, use, and protect your information"
  currentPage="privacy"
>
  <Fragment slot="schema">
    <!-- Paste JSON-LD from current/privacy.html lines 35-174 byte-for-byte -->
  </Fragment>

  <article class="content-card">
    <!-- Paste content from current/privacy.html (everything inside <article class="content-card">), byte-for-byte -->
  </article>
</LegalLayout>
```

- [ ] **Step 3: Build and verify**

```bash
npm run build && node scripts/verify.mjs
```
Expected: `✔ privacy.html  0 unexpected diffs` AND `✔ terms.html  0 unexpected diffs`. Other 3 pages still report missing.

- [ ] **Step 4: Commit**

```bash
git add src/pages/privacy.astro
git commit -m "Add privacy.astro page; verify HTML diff passes"
```

---

### Task 15: Create `about.astro`

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Read body content + JSON-LD from current/about.html**

```bash
sed -n '35,174p' current/about.html      # JSON-LD schema
sed -n '608,684p' current/about.html      # body content (article.content-card)
sed -n '6,7p' current/about.html          # title and description
```

- [ ] **Step 2: Create `src/pages/about.astro`** with these exact metadata values from current/about.html:

**Note:** about.html has a DIFFERENT `<title>` from its og:title and twitter:title — the title appends "- Daniel Sato" while og/twitter omit it. **Preserve this difference exactly.**

- `<title>`: `About Us | My Japanese Name Translator - Daniel Sato` (line 6)
- `<meta name="description">`: `Learn about My Japanese Name Translator, founded by Daniel Sato, a Japanese linguistics expert specializing in accurate English-to-Japanese name conversion using kanji, romaji, and cultural context.` (line 7)
- `<link rel="canonical">`: `https://myjapanesenametranslator.com/about` (line 8) — **NO `.html` suffix**
- og:title: `About Us | My Japanese Name Translator` (line 18) — DIFFERS from title (no "- Daniel Sato")
- og:description: `Founded by Daniel Sato, a Japanese linguistics expert specializing in accurate English-to-Japanese name conversion using kanji, romaji, and cultural context.` (line 19)
- twitter:title: `About Us | My Japanese Name Translator` (line 26) — DIFFERS from title
- twitter:description: `Founded by Daniel Sato, a Japanese linguistics expert specializing in accurate English-to-Japanese name conversion.` (line 27)
- bannerKanji1: `私`, bannerKanji2: `達`
- bannerTitle: `About Us`
- bannerSubtitle: `Dedicated to accurate and culturally respectful Japanese name translation`
- currentPage: `about`

```astro
---
import LegalLayout from '../layouts/LegalLayout.astro';
---
<LegalLayout
  title="About Us | My Japanese Name Translator - Daniel Sato"
  description="Learn about My Japanese Name Translator, founded by Daniel Sato, a Japanese linguistics expert specializing in accurate English-to-Japanese name conversion using kanji, romaji, and cultural context."
  canonical="https://myjapanesenametranslator.com/about"
  ogTitle="About Us | My Japanese Name Translator"
  ogDescription="Founded by Daniel Sato, a Japanese linguistics expert specializing in accurate English-to-Japanese name conversion using kanji, romaji, and cultural context."
  twitterTitle="About Us | My Japanese Name Translator"
  twitterDescription="Founded by Daniel Sato, a Japanese linguistics expert specializing in accurate English-to-Japanese name conversion."
  bannerKanji1="私"
  bannerKanji2="達"
  bannerTitle="About Us"
  bannerSubtitle="Dedicated to accurate and culturally respectful Japanese name translation"
  currentPage="about"
>
  <Fragment slot="schema">
    <!-- Paste JSON-LD from current/about.html lines 35-174 byte-for-byte -->
  </Fragment>

  <article class="content-card">
    <!-- Paste content from current/about.html (everything inside <article class="content-card">), byte-for-byte -->
  </article>
</LegalLayout>
```

- [ ] **Step 3: Build and verify**

```bash
npm run build && node scripts/verify.mjs
```
Expected: `✔ about.html  0 unexpected diffs` plus terms and privacy still verifying.

- [ ] **Step 4: Commit**

```bash
git add src/pages/about.astro
git commit -m "Add about.astro page; verify HTML diff passes"
```

---

### Task 16: Extract `contact.js` (contact form handler)

**Files:**
- Create: `src/scripts/contact.js`

- [ ] **Step 1: Read the contact-form portion of current/contact.html (lines 869–927) — skip the duplicate toggleMobileNav at lines 862–867**

```bash
sed -n '869,927p' current/contact.html
```

- [ ] **Step 2: Create `src/scripts/contact.js`** — paste lines 869–927 verbatim:

```js
// Contact form handling
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    const messageEl = document.getElementById('formMessage');
    const submitBtn = document.getElementById('submitBtn');

    // Reset message
    messageEl.className = 'form-message';
    messageEl.style.display = 'none';

    // Honeypot spam check
    if (document.getElementById('website').value) {
        messageEl.textContent = 'Thank you for your message!';
        messageEl.className = 'form-message success';
        messageEl.style.display = 'block';
        return;
    }

    // Validation
    if (!name || !email || !message) {
        messageEl.textContent = 'Please fill in all required fields.';
        messageEl.className = 'form-message error';
        messageEl.style.display = 'block';
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        messageEl.textContent = 'Please enter a valid email address.';
        messageEl.className = 'form-message error';
        messageEl.style.display = 'block';
        return;
    }

    // Simulate submission
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Sending...';

    // Construct mailto link as fallback
    const subject = encodeURIComponent('Contact from ' + name + ' via My Japanese Name Translator');
    const body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + message);

    setTimeout(function() {
        // Open mailto as the form action
        window.location.href = 'mailto:contact@myjapanesenametranslator.com?subject=' + subject + '&body=' + body;

        messageEl.textContent = 'Thank you for your message! Your email client should open shortly. If it doesn\'t, please email us directly at contact@myjapanesenametranslator.com';
        messageEl.className = 'form-message success';
        messageEl.style.display = 'block';

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg> Send Message';
    }, 800);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/scripts/contact.js
git commit -m "Extract contact.js with form submit handler"
```

---

### Task 17: Create `contact.astro`

**Files:**
- Create: `src/pages/contact.astro`

- [ ] **Step 1: Read body content + JSON-LD from current/contact.html**

```bash
sed -n '35,174p' current/contact.html      # JSON-LD schema
sed -n '744,855p' current/contact.html      # body content (the contact section)
sed -n '6,7p' current/contact.html          # title and description
```

- [ ] **Step 2: Create `src/pages/contact.astro`** with these exact metadata values from current/contact.html:

- `<title>`: `Contact Us | My Japanese Name Translator` (line 6)
- `<meta name="description">`: `Contact My Japanese Name Translator. Reach out to Daniel Sato for questions about Japanese name translations, kanji meanings, or any inquiries. Response within 24-48 hours.` (line 7)
- `<link rel="canonical">`: `https://myjapanesenametranslator.com/contact` (line 8) — **NO `.html` suffix**
- og:description: `Contact My Japanese Name Translator. Reach out for questions about Japanese name translations, kanji meanings, or any inquiries.` (line 19)
- twitter:description: `Contact My Japanese Name Translator for questions about Japanese name translations and kanji meanings.` (line 27)
- bannerKanji1: `連`, bannerKanji2: `絡`
- bannerTitle: `Contact Us`
- bannerSubtitle: `Have a question about your Japanese name? We'd love to hear from you`
- currentPage: `contact`

```astro
---
import LegalLayout from '../layouts/LegalLayout.astro';
import '../scripts/contact.js';
---
<LegalLayout
  title="Contact Us | My Japanese Name Translator"
  description="Contact My Japanese Name Translator. Reach out to Daniel Sato for questions about Japanese name translations, kanji meanings, or any inquiries. Response within 24-48 hours."
  canonical="https://myjapanesenametranslator.com/contact"
  ogDescription="Contact My Japanese Name Translator. Reach out for questions about Japanese name translations, kanji meanings, or any inquiries."
  twitterDescription="Contact My Japanese Name Translator for questions about Japanese name translations and kanji meanings."
  bannerKanji1="連"
  bannerKanji2="絡"
  bannerTitle="Contact Us"
  bannerSubtitle="Have a question about your Japanese name? We'd love to hear from you"
  currentPage="contact"
>
  <Fragment slot="schema">
    <!-- Paste JSON-LD schema from current/contact.html lines 35-174 byte-for-byte -->
  </Fragment>

  <!-- Paste the entire content from inside <main class="page-content"> in current/contact.html, byte-for-byte. Note: contact.html uses <div class="content-grid"> instead of <article class="content-card"> as the immediate child of main, so don't wrap in article — the LegalLayout's <slot /> is inside main directly. -->
</LegalLayout>
```

**IMPORTANT:** The contact page's main content uses `<div class="content-grid">` not `<article class="content-card">`. The `LegalLayout` puts the `<slot />` directly inside `<main class="page-content">` so this works — DO NOT add an extra `<article>` wrapper for contact.astro.

- [ ] **Step 3: Build and verify**

```bash
npm run build && node scripts/verify.mjs
```
Expected: `✔ contact.html  0 unexpected diffs` plus all 3 other legal pages verifying.

- [ ] **Step 4: Commit**

```bash
git add src/pages/contact.astro
git commit -m "Add contact.astro page with form handler; verify HTML diff passes"
```

---

## Phase 4 — Build the home page

### Task 18: Extract `home.css`

**Files:**
- Create: `src/styles/home.css`

- [ ] **Step 1: Read the inline `<style>` block from current/index.html lines 34–780**

```bash
sed -n '34,780p' current/index.html
```

- [ ] **Step 2: Create `src/styles/home.css`** containing only home-specific selectors

Copy these exact CSS rule blocks from `current/index.html`'s `<style>` block, byte-for-byte:

- `.logo-mark { ... }` (line ~108)
- `.hero { ... }`, `.hero::before { ... }`
- `.hero-kanji { ... }`, `.hero-kanji.k1`, `.hero-kanji.k2`, `.hero-kanji.k3`, `.hero-kanji.k4`
- `.hero-content { ... }`, `.hero-badge { ... }`, `.hero h1 { ... }`, `.hero h1 .jp-text { ... }`, `.hero p { ... }`
- `.converter-section { ... }`, `.converter-card { ... }`, `.converter-inner { ... }`, `.converter-label { ... }`
- `.input-row { ... }`, `.name-input { ... }`, `.name-input:focus { ... }`, `.name-input::placeholder { ... }`
- `.convert-btn { ... }`, `.convert-btn:hover { ... }`, `.convert-btn:active { ... }`
- `.faq-q:focus-visible { ... }`
- `.script-toggles { ... }`, `.script-toggle { ... }`, `.script-toggle:hover { ... }`, `.script-toggle.active { ... }`, `.script-toggle .jp { ... }`
- `.results-area { ... }`, `.results-area.visible { ... }`
- `.result-block { ... }`, `.result-block:hover { ... }`, `.result-script-label { ... }`, `.result-japanese { ... }`, `.result-romaji { ... }`, `.result-actions { ... }`
- `.action-btn { ... }`, `.action-btn:hover { ... }`, `.action-btn svg { ... }`
- `.copied-toast { ... }`, `.copied-toast.show { ... }`
- `.popular-section { ... }`, `.popular-group { ... }`, `.popular-group:last-child { ... }`, `.popular-header { ... }`, `.popular-header h2`, `.popular-header h3`, `.popular-header span`
- `.names-grid { ... }`, `.name-chip { ... }`, `.name-chip:hover { ... }`, `.name-chip .chip-jp { ... }`
- `.about-section { ... }`, `.about-card { ... }`, `.about-card h2`, `.about-card p`, `.about-card h3`
- `.writing-systems { ... }`, `.ws-card { ... }`, `.ws-char { ... }`, `.ws-name { ... }`, `.ws-jp { ... }`, `.ws-desc { ... }`
- `.faq-section { ... }`, `.faq-section h2`, `.faq-item { ... }`, `.faq-item:first-child`, `.faq-q { ... }`, `.faq-q::after`, `.faq-item.open .faq-q::after`, `.faq-a { ... }`, `.faq-item.open .faq-a`
- `.delay-3 { ... }`, `.delay-4 { ... }`
- The home-only mobile media query rules: `@media (max-width: 640px) { .converter-inner, .input-row, .convert-btn, .writing-systems, .names-grid, .about-card, .hero { ... } }`

Skip selectors already in `site.css`: `:root`, `*`, `body`, `body::before`, `.skip-link*`, `.site-header`, `.logo`, `.logo-img`, `.header-nav*`, `.mobile-menu-btn*`, `.site-footer`, `.footer-*`, `@keyframes fadeUp`, `.animate-in`, `.delay-1`, `.delay-2`, and the shared mobile rules for header.

- [ ] **Step 3: Commit**

```bash
git add src/styles/home.css
git commit -m "Extract home.css for index page only"
```

---

### Task 19: Extract `home.js`

**Files:**
- Create: `src/scripts/home.js`

- [ ] **Step 1: Read the inline `<script>` block from current/index.html lines 1510–1898**

```bash
sed -n '1510,1898p' current/index.html
```

- [ ] **Step 2: Create `src/scripts/home.js`** — paste lines 1510–1898 verbatim, BUT skip the toggleMobileNav function at lines 1868–1874 (provided by site.js).

Concretely:
- Copy lines 1510–1867 (everything before toggleMobileNav)
- Skip lines 1868–1874 (the toggleMobileNav function itself plus its blank line and comment)
- Copy lines 1875–1898 (the popular name population code)

- [ ] **Step 3: Commit**

```bash
git add src/scripts/home.js
git commit -m "Extract home.js with converter algorithm (excludes deduped toggleMobileNav)"
```

---

### Task 20: Create the HomeLayout

**Files:**
- Create: `src/layouts/HomeLayout.astro`

- [ ] **Step 1: Create `src/layouts/HomeLayout.astro`**

```astro
---
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import '../styles/site.css';
import '../styles/home.css';
import '../scripts/home.js';

interface Props {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}
const props = Astro.props;
---
<BaseLayout {...props}>
  <slot name="schema" slot="schema" />

  <a href="#main-content" class="skip-link">Skip to main content</a>
  <Header currentPage="home" />

  <slot />

  <Footer />
</BaseLayout>
```

**Note:** `index.html` includes its own `<main id="main-content">` wrapper inside the body content. Unlike `LegalLayout`, `HomeLayout` does NOT wrap the slot in `<main>` — the index page provides that itself.

- [ ] **Step 2: Verify by reading current/index.html structure**

```bash
grep -n 'main-content\|<main\|</main' current/index.html
```
Expected: confirms index.html has its own `<main id="main-content">` inside its body content.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/HomeLayout.astro
git commit -m "Add HomeLayout for index page"
```

---

### Task 21: Create `index.astro` and run full verification

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Read the full body content of current/index.html (from after the </head> closing tag through the </body> tag, excluding the inline script)**

```bash
grep -n '</head>\|</body>\|<script>' current/index.html
```
Identify: the `<body>` opens after `</head>` (at the line right after schema closes — around line 1277). The body content runs until the inline `<script>` at line 1509. The body content is everything between `<body>` and `<script>`.

```bash
sed -n '1278,1508p' current/index.html
```

- [ ] **Step 2: Read JSON-LD schema blocks from current/index.html**

The home page has TWO JSON-LD blocks:
- Block 1: lines 781–1218 (Person + Organization + WebSite graph)
- Block 2: lines 1219–1276 (FAQPage)

```bash
sed -n '781,1276p' current/index.html
```

- [ ] **Step 3: Create `src/pages/index.astro`** with these exact metadata values from current/index.html:

- `<title>`: `Japanese Name Translator | Convert Your Name to Katakana, Hiragana & Kanji` (line 6)
- `<meta name="description">`: `Free Japanese name converter tool. Instantly convert your English name to authentic Katakana (カタカナ), Hiragana (ひらがな), and Kanji (漢字) with pronunciation guides and cultural meanings.` (line 7) — contains kanji unicode chars
- `<link rel="canonical">`: `https://myjapanesenametranslator.com/` (line 8)
- og:description: `Free Japanese name converter tool. Instantly convert your English name to authentic Katakana, Hiragana, and Kanji with pronunciation guides and cultural meanings.` (line 19) — DIFFERS (no kanji unicode chars)
- twitter:description: `Free Japanese name converter tool. Instantly convert your English name to authentic Katakana, Hiragana, and Kanji.` (line 27) — DIFFERS (shorter)

```astro
---
import HomeLayout from '../layouts/HomeLayout.astro';
---
<HomeLayout
  title="Japanese Name Translator | Convert Your Name to Katakana, Hiragana & Kanji"
  description="Free Japanese name converter tool. Instantly convert your English name to authentic Katakana (カタカナ), Hiragana (ひらがな), and Kanji (漢字) with pronunciation guides and cultural meanings."
  canonical="https://myjapanesenametranslator.com/"
  ogDescription="Free Japanese name converter tool. Instantly convert your English name to authentic Katakana, Hiragana, and Kanji with pronunciation guides and cultural meanings."
  twitterDescription="Free Japanese name converter tool. Instantly convert your English name to authentic Katakana, Hiragana, and Kanji."
>
  <Fragment slot="schema">
    <!-- Paste BOTH <script type="application/ld+json"> blocks from current/index.html lines 781-1276, byte-for-byte -->
  </Fragment>

  <!-- Paste the body content from current/index.html (everything between <body> and the inline <script> at line 1509), byte-for-byte. This includes:
    - The skip-link <a href="#main-content"> — but wait, HomeLayout already provides this. SKIP this line in the paste.
    - The <header class="site-header"> — but HomeLayout already renders this via <Header>. SKIP these lines in the paste.
    - The <main id="main-content">...</main> with .hero, .converter-section, .popular-section, .about-section, .faq-section
    - The <footer class="site-footer"> — but HomeLayout already renders this. SKIP these lines in the paste.
  -->
</HomeLayout>
```

**Important:** When pasting the body content, exclude the skip-link, `<header>`, and `<footer>` blocks because `HomeLayout` provides those. The pasted content should start at `<main id="main-content">` and end at `</main>`.

Verify the original twitter:title matches the og:title (which it does in current/index.html — line 18 og:title and line 26 twitter:title are identical to the `<title>`). The `BaseLayout` defaults handle this; no extra props needed for the home page.

- [ ] **Step 4: Build and verify**

```bash
npm run build && node scripts/verify.mjs
```
Expected:
```
✔ index.html      0 unexpected diffs
✔ about.html      0 unexpected diffs
✔ privacy.html    0 unexpected diffs
✔ terms.html      0 unexpected diffs
✔ contact.html    0 unexpected diffs
All pages verified — no unexpected differences.
```

If `index.html` shows diffs, the most likely issues:
- Twitter title/description don't match the home page's specific values (they use truncated description in the original)
- Schema blocks pasted incorrectly (whitespace or character escapes)
- Wrong section of body content pasted

Fix any diffs and re-run until clean.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "Add index.astro homepage; full verification passes"
```

---

## Phase 5 — Final cleanup and prep for deploy

### Task 22: Manual smoke test via preview server

**Files:** none modified

- [ ] **Step 1: Run the preview server**

```bash
npm run preview
```
Expected: Astro reports a local URL (e.g., http://localhost:4321).

- [ ] **Step 2: Open each page in browser and verify**

For each of `/`, `/about.html`, `/privacy.html`, `/terms.html`, `/contact.html`:
- Page loads without console errors (open DevTools → Console)
- Header logo + nav render correctly
- `aria-current="page"` is on the right nav item
- Footer renders correctly
- Mobile menu opens/closes (resize window to <640px or use DevTools device emulator)

- [ ] **Step 3: Test homepage converter**

On `/`:
- Type "John" in the name input → hit Convert → result shows ジョン (Katakana), じょん (Hiragana), some Kanji (ateji), Jon (Romaji)
- Click the copy button on each result → toast shows "Copied!"
- Click any popular name chip → input populates and converter runs
- Click each FAQ question → answer expands/collapses

- [ ] **Step 4: Test contact form**

On `/contact.html`:
- Submit empty form → red error "Please fill in all required fields"
- Submit invalid email → red error "Please enter a valid email address"
- Submit valid form → loading spinner, then mailto: opens (cancel the email client prompt)

- [ ] **Step 5: Stop the preview server**

`Ctrl+C` in the terminal where preview is running.

- [ ] **Step 6: No commit needed** (no files changed). If anything failed, fix and re-run verification.

---

### Task 23: Delete the legacy root-level HTML files

**Files:**
- Delete: `index.html`, `about.html`, `privacy.html`, `terms.html`, `contact.html` (root level only — `current/<page>.html` and `dist/<page>.html` remain)

- [ ] **Step 1: Confirm `current/` snapshot still exists**

```bash
ls current/
```
Expected: 5 files. (If missing, re-run Task 1.)

- [ ] **Step 2: Delete the root-level HTML files**

```bash
rm index.html about.html privacy.html terms.html contact.html
```

- [ ] **Step 3: Verify Astro still builds and verifies clean**

```bash
npm run build && node scripts/verify.mjs
```
Expected: all 5 pages verify clean. (Astro reads from `src/pages/`, not from root, so the deletion has no effect on the build.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Remove legacy root-level HTML files (now generated by Astro)"
```

---

### Task 24: Update README with new dev/build/deploy instructions

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read the current README**

```bash
sed -n '1,30p' README.md
```

- [ ] **Step 2: Add a new "Local development" section near the top of README.md** (after the title and tagline, before "What We Do")

Append this section:

```markdown
## 🛠️ Local Development & Deployment

This site is built with [Astro](https://astro.build/) as a static site.

### Prerequisites
- Node.js 18 or newer
- npm

### Develop locally
```bash
npm install
npm run dev          # http://localhost:4321
```

### Build & verify before deploy
```bash
npm run build        # outputs dist/
npm run verify       # HTML-diff against current/ snapshots
npm run preview      # serves dist/ at http://localhost:4321 (final check)
```

### Deploy to Hostinger
1. Backup current `public_html/` via Hostinger File Manager (download as zip).
2. Run `npm run build && npm run verify` locally — must pass.
3. Upload the contents of `dist/` to `public_html/` via File Manager or FTP.
4. Spot-check the live site in an incognito window.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Update README with Astro dev/build/deploy instructions"
```

---

### Task 25: Run final full verification

**Files:** none

- [ ] **Step 1: Clean build**

```bash
rm -rf dist/
npm run build
```
Expected: build succeeds with no errors.

- [ ] **Step 2: Full verification**

```bash
node scripts/verify.mjs
```
Expected:
```
✔ index.html      0 unexpected diffs
✔ about.html      0 unexpected diffs
✔ privacy.html    0 unexpected diffs
✔ terms.html      0 unexpected diffs
✔ contact.html    0 unexpected diffs
All pages verified — no unexpected differences.
```

- [ ] **Step 3: Inspect dist/ structure**

```bash
ls dist/
ls dist/_astro/
```
Expected:
- `dist/`: 5 HTML files + favicon + logo + robots.txt + sitemap.xml + `_astro/` directory
- `dist/_astro/`: hashed `.css` and `.js` files (e.g., `site.B3hF9k.css`, `home.K4mP2x.css`, `legal.J8nT5q.css`, `site.A1bC3d.js`, `home.E5fG7h.js`, `contact.M9rN0z.js`)

- [ ] **Step 4: View one built file to confirm structure**

```bash
sed -n '1,20p' dist/about.html
```
Expected: minified HTML with `<link rel="stylesheet" href="/_astro/site.[hash].css">` and `<link rel="stylesheet" href="/_astro/legal.[hash].css">` in the `<head>`, all meta tags preserved.

- [ ] **Step 5: Final commit (if any uncommitted changes from build artifacts)**

```bash
git status
# If anything to commit:
git add -A
git commit -m "Final build verified — ready for Hostinger deploy"
```

---

## Done — Ready for Hostinger deploy

The user will:
1. Backup current `public_html/` via Hostinger File Manager.
2. Upload the contents of `dist/` to `public_html/`.
3. Spot-check the live site.

Per the spec's Layer 3, after deploy run:
- Google Rich Results Test on each of 5 URLs
- PageSpeed Insights on each of 5 URLs
- View-source spot check
