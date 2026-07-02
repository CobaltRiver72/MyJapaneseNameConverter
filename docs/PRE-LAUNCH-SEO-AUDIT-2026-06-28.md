# Pre-Launch SEO Audit — 2026-06-28 (Astro → Hostinger)

**Verdict: SAFE TO LAUNCH — no blockers.** Your ranked pages are protected.
Every real finding is a *new-page optimization* item, not a migration risk.

> Supersedes `docs/PRE-LAUNCH-SEO-AUDIT.md`, which was stale — it covered only
> 7 pages and predates the two `/converter` silo pages **and** `public/.htaccess`,
> both of which now exist and are audited below. Scope here = all **9** built pages.

Pages audited (dist/): `index`, `about.html`, `contact.html`, `privacy.html`,
`terms.html`, `kanji-to-hiragana-converter.html`, `converter` (hub),
`converter/hiragana-to-katakana` (spoke), `404.html`.

---

## 1. Migration safety — the "will this tank my rankings?" checks (ALL GREEN)

| Check | Result |
|---|---|
| **Legacy money pages byte-identical to live** (`current/` snapshots) | ✅ 6/6 IDENTICAL (index, about, contact, privacy, terms, kanji) — Google sees zero change |
| Build/test gate (`npm test`, `verify.mjs`) | ✅ tests 5/5; verifier "no unexpected differences" on all 9 pages |
| Canonicals correct form | ✅ legacy = `.html`, new = extensionless, all self-referencing = og:url |
| Robots directives | ✅ 6 money pages `index, follow`; **404 = `noindex, follow`** (prior FAIL is fixed) |
| JSON-LD validity | ✅ all 9 blocks parse; @id refs resolve; breadcrumbs correct (legacy `.html`, new extensionless) |
| Internal links resolve | ✅ every href maps to a real dist file; no `.html`/extensionless cross-contamination |
| Sitemap | ✅ 8 valid URLs, each in correct form; 404 correctly excluded |
| `.htaccess` (www→non-www, legacy 200 no-redirect, clean-URL rewrites, `/converter` collision, 404) | ✅ logic sound; URL-POLICY.md records a real Apache 2.4 test on 2026-06-28 |
| Redirect chains/loops | ✅ none (legacy exempt from `.html`→clean redirect; hub handled by `DirectorySlash Off`) |
| Performance (new pages) | ✅ hub loads 242 B JS, spoke ~10 KB; 4 MB jmdict loads **only** on the kanji page, on-demand |
| Stray old-path / protocol leaks | ✅ no `/hiragana-to-katakana-converter`, no `http://`, no `www.` in new pages |

**Nothing in this push threatens your existing ~400 clicks/day.**

---

## 2. Real issues to fix (none block launch — ranked by SEO value)

### 🟠 M1 — The `/converter` hub is orphaned (fix before scaling)
The global header **and** footer link "Kana Converter" straight to the **spoke**
(`/converter/hiragana-to-katakana`). **No money page links to the hub `/converter`.**
Inbound internal links: hub = **1** (only the spoke's breadcrumb); spoke = **18**.

That's an inverted silo. The hub is meant to be the authority node that collects
equity and feeds spokes — here it gets almost none, so it can't rank for
"japanese converter tools" and has nothing to pass to future spokes. This matters
precisely because you're about to launch many more tool pages under it.
**Fix:** point the nav/footer "Converter Tools" item to `/converter` (let the hub
route users to spokes), or at minimum add a homepage-body link to the hub.

### 🟠 M2 — Spoke anchor text repeats the kanji "anchor starvation" mistake
The spoke targets **"hiragana to katakana converter"**, but its dominant inbound
anchor is **"Kana Converter" (18×)**; the exact-match phrase appears as anchor only
**1×**. This is the same head-term anchor dilution your CLAUDE.md blames for the
kanji page dropping #1→#6. You're shipping a brand-new page with the bug baked in.
**Fix:** vary at least some internal anchors to "Hiragana to Katakana Converter"
(e.g. the homepage-body and hub-card links), keep "Kana Converter" for the nav.

### 🟡 M3 — Kanji page anchor starvation still unshipped (not a regression)
Nav/footer still say "Kanji Converter" (17×); "Kanji to Hiragana Converter" appears
as anchor only 1× (the hub card). Identical to live, so launch doesn't worsen it —
but your Tier-0 recovery fix for "kanji to hiragana" is **not** in this build.

### 🟡 L1 — Hub content is thin (303 words)
Fine as a directory page, weak for topical authority. Add 150–250 words defining
Japanese script conversion and how kanji/hiragana/katakana/romaji relate — make the
hub the richest semantic node of the silo, not the thinnest.

### 🟡 L2 — `/converter` meta description is 163 chars
Slight SERP truncation risk. Trim to ≤155.

### 🟡 L3 — Sitemap `lastmod` is stale for the new pages
Hub `2026-06-10`, spoke `2026-06-09`. Bump both to the deploy date to nudge first
crawl. Leave the 6 legacy `lastmod` values frozen (intentional byte-parity).

### 🔵 Watch — "japanese converter" cannibalization
Homepage = "Japanese Name Converter" (your #3 page); hub = "Japanese Converter
Tools". Differentiated enough, but monitor GSC so the hub doesn't siphon the
homepage's generic "japanese converter" impressions.

### 🔵 Minor / cosmetic
- `og:image` is the 396×74 logo site-wide → poor social cards (not a ranking factor; matches live).
- Hub visible breadcrumb says "Converters" while H1 + schema say "Japanese Converter Tools" — align the label.
- Unhashed root assets (`/styles.css`, `/script.js`) are cached 1 week → on *future* edits, version them (`?v=`) so returning visitors don't get stale files. No impact on first deploy.

---

## 3. One thing to confirm (not a defect)
Byte-parity is measured against the `current/` snapshots, which `current/README.md`
states are the live site. Those snapshots **already contain** the `/converter`
links — so either the legacy-page link edits are already live, or `current/` was
re-baselined. Either way the deploy is safe; just confirm you're comfortable that
`current/` truly equals what Google has indexed today.

---

## 4. Before the "many pages" scaled launch
1. Fix the hub inbound links (M1) **first** — a silo with an orphaned hub doesn't compound.
2. Define an anchor-text plan per page (M2/M3) so each new spoke gets ≥1 exact-match internal anchor; don't let nav labels be the only anchors.
3. Add each new spoke to: hub `ItemList` + visible card, ≥1 sibling cross-link, sitemap, and `verify.mjs` (the checklist in `docs/URL-POLICY.md` already enforces this).
4. Re-run this audit on a sample of the generated pages before pushing at scale — programmatic templates multiply any single mistake.
