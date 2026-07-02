# My Japanese Name Translator

> **Free online tool to instantly convert your English name to authentic Katakana, Hiragana, Kanji & Romaji with pronunciation guides and cultural meanings**

🌐 **Website**: [myjapanesenametranslator.com](https://myjapanesenametranslator.com)

---

## 🛠️ Local Development & Deployment

This site is built with [Astro](https://astro.build/) as a fully static site. All pages are pre-rendered to HTML at build time and served as static files.

### Prerequisites
- Node.js 18 or newer
- npm

### Develop locally

```bash
npm install
npm run dev          # http://localhost:4321
```

The dev server hot-reloads CSS/JS/HTML changes instantly.

**URL policy (important — see `docs/URL-POLICY.md`):** legacy pages keep their indexed `.html` URLs (`/about.html`, `/contact.html`, `/privacy.html`, `/terms.html`, `/kanji-to-hiragana-converter.html`) and must never be redirected; all pages created after 2026-06-09 use extensionless URLs (e.g., `/hiragana-to-katakana-converter`), served from their `.html` build artifacts by an internal rewrite in `public/.htaccess`.

### Build & verify before deploy

```bash
npm run build        # outputs dist/
npm run verify       # HTML-diff against current/ snapshots (Layer 1 SEO gate)
npm run preview      # serves dist/ at http://localhost:4321 (final check)
```

**`npm run verify`** is the critical SEO safety gate. It compares each built page against the pre-migration snapshot in `current/` (gitignored) and confirms zero unexpected differences in `<title>`, meta, OG, Twitter, canonical, JSON-LD schema, headings, body content, links, alt text, or ARIA attributes. The migration was designed to be byte-identical to the original HTML output (modulo CSS/JS externalization and Astro's HTML entity normalization).

### Manual smoke test (before deploy)

Run `npm run preview` and open each page in a browser. Check:
- Header logo and nav render correctly, with `aria-current="page"` on the active link
- Mobile menu opens/closes (resize window below 640px)
- Footer renders with brand, links, contact email, copyright
- **Homepage `/`:** converter accepts input ("John" → ジョン/じょん/Jon), copy buttons work, popular-name chips populate and trigger conversion, FAQ accordions expand
- **`/contact`:** form validation shows error messages; valid submit opens mailto
- **All pages:** no console errors in DevTools

### Deploy to Hostinger

1. **Backup current `public_html/`** via Hostinger File Manager (download as a zip). This is your one-click rollback path.
2. Run locally: `npm run stage` — runs the full check gate (tests + build + verify) and refreshes the `deploy/` staging folder.
3. Upload the **contents** of `deploy/` to `public_html/` via FileZilla (enable Server → "Force showing hidden files" so `.htaccess` uploads) or File Manager drag-and-drop.
4. Spot-check the live site in an incognito window. View source on each page to confirm `<title>`, canonical, OG tags, and JSON-LD schema are intact.

**Never** upload the repo source (`src/`, `docs/`, `.git`, …) to the server, and don't connect Hostinger's Git deploy — it clones raw source into `public_html/` and serves a 403.

### Project structure

```
src/
├── pages/             # One .astro file per URL
├── layouts/           # BaseLayout, HomeLayout, LegalLayout
├── components/        # Header, Footer, PageBanner
├── styles/            # site.css (everywhere), home.css (index), legal.css (legal pages)
└── scripts/           # site.js (mobile nav), home.js (converter), contact.js (form)
public/                # Static assets served as-is (favicon, logo, robots.txt, sitemap.xml)
current/               # Pre-migration HTML snapshots (gitignored, used by verify.mjs)
scripts/verify.mjs     # Layer 1 SEO verification script
dist/                  # Build output (gitignored) — never upload this directly
deploy/                # Verified staging copy of dist/ (gitignored). Upload its
                       # CONTENTS to Hostinger public_html/ (refresh: npm run stage)
```

---

## 🎌 What We Do

My Japanese Name Translator is a free online tool for instantly converting English names into Japanese using four writing systems — **Katakana (カタカナ)**, **Hiragana (ひらがな)**, **Kanji (漢字)**, and **Romaji**. We use phonetic transliteration based on standard Hepburn romanization rules to produce natural-sounding, culturally appropriate Japanese name equivalents.

- **Katakana Conversion** - The standard Japanese script for foreign names, used on official documents and passports
- **Hiragana Rendering** - Soft, flowing script representation for a traditional Japanese feel
- **Kanji (Ateji) Translation** - Characters selected for their phonetic readings, visually striking and meaningful
- **Romaji Output** - Accurate romanized spelling using Hepburn romanization

## 🔧 Core Features

### English to Japanese Name Conversion
Convert English names into all four Japanese writing systems with:
- Instant, real-time conversion in your browser
- Curated database of common English name translations
- Phonetic mapping algorithm for uncommon names
- Copy-to-clipboard functionality for each result
- Script toggle buttons to show/hide individual writing systems

### How the Converter Works
Our tool uses phonetic transliteration to map each English syllable to its closest Japanese phonetic equivalent:
1. **Name Input** — Enter your English name
2. **Database Lookup** — Check against our curated common name database
3. **Phonetic Mapping** — Apply Hepburn romanization rules to convert pronunciation
4. **Script Generation** — Produce Katakana, Hiragana, Kanji (ateji), and Romaji output
5. **Display Results** — Show all four writing systems with copy buttons

### Popular Name Conversions
The tool includes a curated database of pre-verified translations for popular English names (both male and female), ensuring the highest accuracy for common names. Users can click any popular name to instantly see its Japanese conversion.

### Educational Content
The site includes detailed explanations of:
- Japanese writing systems (Katakana, Hiragana, Kanji) and their uses
- Japanese phonetics and mora-based syllable structure
- How foreign names are adapted to Japanese sounds (e.g., "L" → "R", "V" → "B")
- Common uses for Japanese names (tattoos, hanko seals, business cards, gaming)
- Japanese honorific suffixes (-san, -chan, -kun, -sama)

## 🔍 Key Japanese Name Elements

### Katakana (カタカナ)
Angular script used for foreign names, loanwords, and emphasis. This is the **standard and officially recognized** way to write non-Japanese names in Japan — used on passports, official documents, and business cards.

### Hiragana (ひらがな)
Curved, flowing script for native Japanese words, grammar particles, and furigana pronunciation guides. Provides a softer, more traditional feel for name representations.

### Kanji (漢字)
Logographic characters from Chinese, each carrying meaning. Our tool uses **ateji** — kanji characters selected for their phonetic readings rather than semantic meaning — to create visually striking name representations.

### Romaji (ローマ字)
Romanization of Japanese using the Latin alphabet. We use the **Hepburn system**, the most widely recognized romanization standard used in Japan.

## 🚀 Technical Approach

Our name conversion runs entirely **client-side in your browser** — no names are sent to any server. The technical methodology includes:

- **Hepburn romanization** — The internationally recognized standard for Japanese transliteration
- **Phoneme-to-Katakana mapping** — Comprehensive mapping table covering standard and extended katakana
- **Common name database** — Pre-verified translations for 50+ popular English names
- **Katakana-to-Hiragana conversion** — Unicode-based character offset conversion
- **Ateji kanji mapping** — Phonetic kanji character selection for name rendering
- **English phonetic rules** — Substitution rules for sounds not native to Japanese (th → s, ph → f, l → r, v → b, etc.)

## 🌟 Why Accurate Japanese Name Translation Matters

Japanese names carry deep cultural and linguistic significance. An inaccurate or inappropriate translation can cause misunderstanding or unintended offense. Our tool ensures translations are:
- **Phonetically precise** — Following standard Hepburn romanization
- **Culturally appropriate** — Respecting Japanese naming conventions
- **Clearly explained** — Providing romaji pronunciation for every result
- **Safely recommended** — Noting that Katakana is always the safest choice for foreign names

## 🎯 Who Uses Our Tool

- **Travelers to Japan** — Need proper Japanese name for hotel registrations and restaurant reservations
- **Tattoo enthusiasts** — Want authentic Japanese calligraphy for name tattoos
- **Japanese language learners** — Want to understand name conversion and writing systems
- **Gamers & social media users** — Creating Japanese usernames and profiles
- **Business professionals** — Designing Japanese business cards (名刺, meishi)
- **Hanko/Inkan makers** — Creating personal Japanese name seals
- **Content creators** — Developing characters with authentic Japanese names
- **Students** — Learning about cross-cultural linguistics

## 📄 Site Pages

- **[Home](https://myjapanesenametranslator.com)** — Name converter tool, popular names, how it works, FAQ
- **[About Us](https://myjapanesenametranslator.com/about.html)** — Our mission, founder info, expertise
- **[Privacy Policy](https://myjapanesenametranslator.com/privacy.html)** — GDPR & CCPA compliant, cookie policy, data practices
- **[Terms of Service](https://myjapanesenametranslator.com/terms.html)** — Usage terms, accuracy disclaimers, governing law
- **[Contact Us](https://myjapanesenametranslator.com/contact.html)** — Contact form, email, location info

## 🎓 About

**Founded by Daniel Sato** — Japanese linguistics expert and name translation specialist, based in **Stockton, California, USA**.

Daniel brings deep expertise in Japanese phonology, kanji semantics, and cross-cultural naming conventions to ensure every translation meets the highest standards of linguistic precision and cultural respect.

## 📞 Contact & Support

- 🌐 **Website**: [myjapanesenametranslator.com](https://myjapanesenametranslator.com)
- 📧 **Email**: [contact@myjapanesenametranslator.com](mailto:contact@myjapanesenametranslator.com)
- 💬 **Contact Page**: [myjapanesenametranslator.com/contact](https://myjapanesenametranslator.com/contact.html)
- 📍 **Location**: Stockton, California, USA
- ⏱️ **Response Time**: 24–48 hours

---

**Built with linguistic precision and cultural respect for accurate Japanese name translation.**

© 2026 My Japanese Name Translator. All rights reserved.

---

*My Japanese Name Translator — Connecting cultures through meaningful name conversion*
