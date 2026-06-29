# My Japanese Name Translator — agent instructions

Static Astro site (`output: 'static'`, `build.format: 'file'`) deployed to
Hostinger `public_html/` by uploading `dist/`. See `README.md` for dev/deploy.

## ⚠️ URL POLICY — read `docs/URL-POLICY.md` before touching URLs

**Short version (the full doc is authoritative):**
- **Legacy pages keep `.html` URLs forever** — `/about.html`, `/contact.html`,
  `/privacy.html`, `/terms.html`, `/kanji-to-hiragana-converter.html` are indexed
  and ranking in Google. Never redirect them, never change their `.html`
  self-canonicals, links, JSON-LD URLs, or sitemap entries.
- **All NEW pages are extensionless**, organized into lowercase **silos** — a hub
  plus spokes (e.g. hub `/converter`, spoke `/converter/hiragana-to-katakana`).
  No `.html` in their canonical, links, JSON-LD, or sitemap — the clean URL is
  served from the `.html` build artifact via an internal rewrite in
  `public/.htaccess` (no redirect).
- This mixed scheme is **intentional** (owner decisions: hybrid `.html`/clean
  2026-06-09, nested silos 2026-06-10). Do not "make it consistent" in either
  direction, and do not move indexed legacy pages into the silo.

## Workflow

- `npm run check` = tests + build + verify. **Must pass before any deploy.**
- `scripts/verify.mjs` enforces the URL policy and byte-parity against
  `current/` snapshots — if it fails, fix your change, not the verifier.
- When adding a page, follow the checklist in `docs/URL-POLICY.md`.
