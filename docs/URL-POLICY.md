# URL POLICY — READ BEFORE TOUCHING ANY URL, CANONICAL, LINK, SITEMAP, OR .htaccess

> **Status: LOCKED.** Decided by the site owner on 2026-06-09. Do NOT "clean up",
> "modernize", or "make consistent" the URLs on this site. The mixed scheme below
> is **intentional** and protects Google rankings. Changing it without the owner's
> explicit instruction can deindex ranking pages and lose traffic.

## The two URL classes

### 1. LEGACY pages — keep `.html` forever (indexed & ranking in Google)

| Page | The ONE canonical URL |
|---|---|
| Home | `https://myjapanesenametranslator.com/` |
| About | `https://myjapanesenametranslator.com/about.html` |
| Contact | `https://myjapanesenametranslator.com/contact.html` |
| Privacy | `https://myjapanesenametranslator.com/privacy.html` |
| Terms | `https://myjapanesenametranslator.com/terms.html` |
| Kanji Converter | `https://myjapanesenametranslator.com/kanji-to-hiragana-converter.html` |

Rules for legacy pages — Google must never see a change:
- Serve **200** at the `.html` URL. **Never 301/302-redirect them.**
- Self-canonical **with** `.html` (e.g. `contact.html` → canonical `https://myjapanesenametranslator.com/contact.html`).
- `og:url`, every JSON-LD `url` / `@id` / breadcrumb `item`, internal links
  (header, footer, in-content, related cards, 404 page), and the sitemap entry
  all use the `.html` URL.
- **Never** add these pages to the `.html → extensionless` redirect in `.htaccess`.
  They are listed in the exemption `RewriteCond` there — keep them in it.

### 2. NEW pages (everything created after 2026-06-09) — extensionless, no `.html` anywhere

Current new pages (all extensionless):
- `https://myjapanesenametranslator.com/converter` — silo hub ("Japanese Converter Tools")
- `https://myjapanesenametranslator.com/converter/kanji-to-katakana` — silo spoke
- `https://myjapanesenametranslator.com/converter/hiragana-to-katakana` — silo spoke

Rules for new pages:
- Canonical, `og:url`, JSON-LD URLs, internal links, and the sitemap entry are
  all **extensionless** — the string `.html` must never appear in any URL for them.
- The build still produces `<slug>.html` in `dist/` (Astro `build.format: 'file'`).
  That artifact is served invisibly by an internal rewrite in `public/.htaccess`
  — the browser URL stays clean, **no redirect happens**.
- If anyone requests `/<new-page>.html` directly, `.htaccess` 301s it to the
  clean URL (safe: those `.html` variants were never indexed).

### 3. SILO structure — `/converter/*` (and future `/chart/*`, etc.)

New tool pages are organized into **nested silos** (owner decision, 2026-06-10):

| URL | Astro source file | Builds to |
|---|---|---|
| `/converter` (hub) | `src/pages/converter.astro` | `dist/converter.html` |
| `/converter/hiragana-to-katakana` (spoke) | `src/pages/converter/hiragana-to-katakana.astro` | `dist/converter/hiragana-to-katakana.html` |

Silo rules:
- **All lowercase, hyphenated.** The host is case-sensitive (`/About.html` → 404).
  Never use capitals in a URL (`/Converter/...` would 404 on every lowercase link).
- **Hub is extensionless, no trailing slash:** `/converter` (not `/converter/`).
  `.htaccess` 301s `/converter/` → `/converter`.
- **The hub file and the spoke folder share a name** (`converter.html` + `converter/`).
  This collision is handled in `.htaccess` by `DirectorySlash Off` + an explicit
  `^converter$ → /converter.html` rewrite. Do **not** remove those lines.
- The indexed legacy `/kanji-to-hiragana-converter.html` stays **flat** (class 1
  above) — it is **not** moved into the silo, but it **is** linked from the
  `/converter` hub so the silo's internal linking still includes it.
- Hub links to every tool (incl. legacy ones); each spoke links up to the hub
  and across to sibling spokes. That interlinking — not the folder depth — is
  what makes the silo work for SEO.

## How to add a future page (checklist)

**Flat page** (rare now — most new pages are silo spokes):

1. Create `src/pages/<slug>.astro` (flat file — do NOT create `<slug>/index.astro`).
2. Canonical + `og:url` + all JSON-LD URLs: `https://myjapanesenametranslator.com/<slug>` (no `.html`).
3. Link to it everywhere as `/<slug>` (no `.html`).
4. Add `<loc>https://myjapanesenametranslator.com/<slug></loc>` to `public/sitemap.xml`.
5. Add the page to `PAGES`, `CANONICALS`, `EXTENSIONLESS_ROUTES`, and `NAV_SCRIPT`
   in `scripts/verify.mjs`, and snapshot the built page into `current/`.
6. Do **NOT** touch `astro.config.mjs` (`build.format: 'file'` stays) and do **NOT**
   add anything to the legacy exemption list in `.htaccess` — new pages are
   handled automatically by the generic rewrite rules.
7. Run `npm run check` — it enforces this entire policy and fails on violations.

**Silo spoke** (e.g. a new `/converter/<x>-to-<y>`):

1. Create `src/pages/converter/<x>-to-<y>.astro`. Imports go up **two** levels
   (`../../layouts/…`, `../../components/…`, `../../lib/…`, `../../styles/…`).
2. Canonical + `og:url` + all JSON-LD URLs:
   `https://myjapanesenametranslator.com/converter/<x>-to-<y>` (no `.html`).
3. Breadcrumb (visible + JSON-LD): Home → Japanese Converter Tools (`/converter`)
   → this page.
4. Add a card for it on the `/converter` hub (`src/pages/converter.astro`) — both
   the visible `.related-card` grid **and** the hub's `ItemList` JSON-LD — and add
   a sibling link from at least one related spoke.
5. Add `<loc>…/converter/<x>-to-<y></loc>` to `public/sitemap.xml`.
6. In `scripts/verify.mjs` add `'converter/<x>-to-<y>.html'` to `PAGES`,
   `CANONICALS`, and `NAV_SCRIPT`, and the route to `EXTENSIONLESS_ROUTES` and
   `PUBLIC_URLS`. Snapshot the built page into `current/converter/`.
7. **A brand-new hub** (e.g. `/chart`) also needs its `.htaccess` collision rules:
   extend `DirectorySlash Off` block with `^chart$ → /chart.html` +
   `^chart/$ → /chart [R=301,L]`. A new spoke under an existing hub needs nothing
   in `.htaccess` (the generic rewrite already serves it).
8. Run `npm run check`.

## How it works (mechanics)

- `astro.config.mjs` uses `output: 'static'`, `build.format: 'file'`,
  `trailingSlash: 'never'` → every page builds to `dist/<slug>.html`.
- `public/.htaccess` (copied into `dist/` at build, uploaded to Hostinger):
  1. `www.` host → 301 → non-www, same path (canonical host is **non-www**;
     the site is indexed under non-www — never change this direction).
  2. `/index.html` → 301 → `/` (homepage normalization).
  3. `.html` requests **except the legacy exemption list** → 301 → extensionless.
  4. Silo hubs (`DirectorySlash Off`): `/converter/` → 301 → `/converter`, then
     `^converter$` → internal rewrite → `/converter.html`. Needed because the hub
     file (`converter.html`) and the spoke folder (`converter/`) share a name.
  5. Extensionless requests with a matching `.html` file → **internal rewrite**
     (no redirect) → serves the file, URL stays clean. This also serves silo
     spokes (`/converter/hiragana-to-katakana` → `converter/hiragana-to-katakana.html`).
  6. `ErrorDocument 404 /404.html` → branded 404 page with a genuine 404 status.
  7. Caching (`mod_expires`) + security headers (`mod_headers`) — HTML always
     revalidates; static assets cached.
- Hosting: Hostinger shared hosting (`public_html/`), Apache/LiteSpeed honors `.htaccess`.
- Verified locally with real Apache 2.4 (macOS httpd 2.4.66, 2026-06-28):
  legacy `.html` URLs all 200 with no redirect; `/converter` hub 200 and
  `/converter/` 301 → `/converter`; silo spokes 200 clean with their `.html`
  variants 301 → clean; `/index.html` 301 → `/`; `www.` → non-www 301; unknown
  URLs genuine 404; security headers present. The old pre-move flat path
  `/hiragana-to-katakana-converter(.html)` 404s (never indexed) — add a 301 to
  `/converter/hiragana-to-katakana` only if a stray link to it ever surfaces.

## Why this policy exists (context for future agents)

The legacy `.html` URLs were indexed and ranking in Google as of June 2026,
earning all the site's clicks. The owner explicitly decided **not** to migrate
them to clean URLs — no 301s, no canonical swaps — because the redirect/recrawl
cycle risks rankings for zero user benefit. Clean URLs apply only to pages
Google has never seen with `.html`. An earlier draft of the Astro migration
301-redirected every `.html` URL to extensionless; that was **reverted** on
2026-06-09 — do not reintroduce it.

## Enforcement

`npm run verify` (part of `npm run check`) asserts every rule above against the
built `dist/`: exact canonicals per page, sitemap contents, `.htaccess` rules
(including that legacy pages are exempt from redirects), and that no page links
to the wrong URL form. If your change makes `verify` fail, fix the change — not
the verifier — unless the owner has explicitly changed the URL policy.
