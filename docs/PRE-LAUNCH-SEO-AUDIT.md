# Pre-Launch SEO + Technical Audit

**Verdict: GO_WITH_FIXES** — 174 pass / 10 warn / 1 fail across 192 checks. 7 real issues confirmed (all low-impact).

## Executive Summary

Your migration is safe to launch and your rankings are not at risk. Every signal Google actually reads on your six existing money pages — titles, meta descriptions, canonicals, Open Graph/Twitter cards, JSON-LD structured data, headings, full visible body text, internal/external links, image alt text, robots directives, sitemap, and CSP — is byte-identical to the live site or measurably improved (smaller, faster, externalized CSS/JS with cross-page cache reuse). An independent visible-text and JSON-LD diff (run separately from the build's own verify gate) confirms zero content loss, and the build's verify.mjs reports 0 unexpected diffs across all six pages. The approved deviations (external CSS/JS, entity escaping, comment/noscript stripping, widened analytics CSP, new branded 404) were each checked and are correctly implemented with no SEO downside. There are NO confirmed critical or high-impact issues that could tank your traffic. The only real findings are housekeeping items on the net-new 404 page (it currently allows indexing and there is no server ErrorDocument wiring) and missing automated guardrails in the build script — none of these touch your existing ranked URLs, and the 404 page is an orphan that is not in your sitemap and not linked anywhere, so Google has no normal path to it. Fix the 404 robots tag and add an .htaccess as cheap best-practice hygiene, then ship with confidence.

## Critical Blockers

_None._

## Prioritized Fixes

1. Make the 404 page non-indexable (highest-value real fix, still low impact): in src/pages/404.astro set robots to 'noindex, follow'. This requires threading an optional robots prop through the layers — BaseLayout.astro (add robots?: string to Props, default 'index, follow', change line 43 to <meta name="robots" content={robots}>) and LegalLayout.astro (add robots?: string, forward robots={robots} to BaseLayout). Rebuild and confirm dist/404.html line 9 becomes 'noindex, follow' while the other 6 pages still emit 'index, follow' (regression-check the shared layout edit). Removes the only indexable thin-error surface.
2. Add public/.htaccess with `ErrorDocument 404 /404.html` (and optionally `ErrorDocument 403 /404.html`) so missing URLs serve the branded page WITH a genuine HTTP 404 status. A real 404 status overrides the robots meta anyway, so this is the primary defense paired with fix #1. Post-deploy verify: `curl -sI https://myjapanesenametranslator.com/does-not-exist` must show HTTP 404.
3. Add crawl-index assertions to scripts/verify.mjs (regression insurance, no current defect): assert each public page canonical equals its own URL; sitemap loc set == the 6 public URLs and excludes 404; robots.txt has the correct Sitemap line and no active Disallow; dist/404.html contains noindex (after fix #1). Exit non-zero on any miss.
4. Add mobile-regression assertions to scripts/verify.mjs (regression insurance): assert each of the 7 pages contains the exact viewport meta; the JS file each page loads defines `function toggleMobileNav`; and each CSS bundle matches /@media\(max-width:640px\)/ with `.header-nav.open{...display:flex}` and `.mobile-menu-btn{...display:block}`. Use whitespace-tolerant regex (lightningcss minifies).
5. (Optional, post-launch only — do NOT change before launch since goal is byte-parity) After deploy, bump sitemap.xml lastmod to the deploy date to signal freshness; on future edits to unhashed root assets (/styles.css, /script.js, /scripts/*) set a short/validated Cache-Control or add a ?v= query so returning visitors don't get stale copies; and confirm Hostinger gzip/brotli for application/json so the 4MB jmdict transfers as ~807KB on the kanji convert action (UX only, zero SEO impact).

## Head Metadata & Titles
- ✅ Title text byte-identical CUR vs DST on all 6 migrated pages (index/about/privacy/terms/contact/kanji verbatim match)
- ✅ Meta description byte-identical CUR vs DST on all 6 pages; no truncation/entity/whitespace drift
- ✅ Canonical URLs byte-identical to live; legal/content pages correctly keep .html suffix (no extensionless split)
- ✅ Canonical is self-referencing and exactly equals og:url on all 7 pages (no http/https or trailing-slash split)
- ✅ Meta robots = "index, follow" on all 6 migrated pages, identical to live, exactly one per page
- ❌ 404 page robots = "index, follow" (LOW) — should be noindex; BaseLayout:43 hardcodes it, no per-page override prop
- ✅ meta author absent on all pages (CUR=0, DST=0) — consistent with live, none accidentally introduced
- ✅ referrer/charset/viewport/html-lang byte-identical CUR vs DST on every page
- ✅ charset meta at byte offset 44 on all 7 pages — well within first-1024-byte UTF-8 detection window
- ✅ Full meta name/property set and ORDER match CUR vs DST (only added external stylesheet link, approved)
- ✅ No duplicate title/desc/canonical/robots/charset/viewport on any page (all counts = 1)
- ✅ CSP meta present once per page incl 404; index CSP byte-identical to live (widened connect-src already in live)
- ✅ Favicon/apple-touch-icon/font preconnect/Google Fonts link preserved byte-identical CUR vs DST
- ⚠️ HTTPS-redirect head script rewritten to type=module (LOW) — defers to after parse; client-only belt-and-suspenders, no crawled-metadata impact
- ✅ 404 page not advertised in sitemap (correctly absent) — limits indexing exposure

## Open Graph & Twitter Cards
- ✅ All 11 OG+Twitter tags byte-identical CUR vs DST on all 6 pages (only an inter-block blank-line whitespace delta on index, zero crawler content)
- ✅ Tag inventory: same 11 distinct names both sides, none dropped, none added (no og:image:width/alt introduced)
- ✅ Each OG/Twitter tag appears exactly once per page on all 7 pages (no duplicates)
- ✅ og:image/twitter:image point to existing valid PNG (40641 bytes, 396x74 RGBA), basename matches file exactly
- ✅ og:image == twitter:image on every page; all absolute https (no protocol-relative/relative)
- ✅ og:url == canonical on every page (no conflicting URL signal)
- ✅ Index (HomeLayout code path) emits OG/Twitter identical to live
- ✅ about og:title vs title "- Daniel Sato" suffix difference is the pre-existing live deviation, faithfully reproduced
- ✅ about twitter:title/twitter:description distinct values reproduced byte-identical to live
- ✅ Astro source robust against rebuild drift (about explicitly overrides twitterTitle; LegalLayout forwards it)
- ✅ og:title == twitter:title on all 5 non-about pages (consistent social labeling)
- ✅ Constant tags (og:type=website, site_name, locale=en_US, twitter:card=summary_large_image) emitted correctly site-wide
- ✅ Net-new 404 OG/Twitter block well-formed, on-brand, all 11 present once, og:title==twitter:title==title
- ℹ️ og:image is small 396x74 logo with no og:image:width/height/alt (LOW) — byte-identical to live, NOT a regression; future polish only

## Structured Data (JSON-LD)
- ✅ Every JSON-LD block on all 6 content pages parses cleanly (index 15837B, kanji 11640B); 404 correctly has none
- ✅ JSON-LD byte-identical AND semantically deep-equal CUR vs DST on all 6 pages (zero schema drift)
- ✅ No &amp;/&#39;/&quot;/&copy; leaked into any JSON-LD value (set:html raw template bypasses escaping)
- ✅ FAQ inner quotes correctly JSON-escaped (\"real\"), not entity-mangled, in both CUR and DST
- ✅ All FAQ Q/A text (4 index, 7 kanji) intact, Japanese parentheticals + ampersands preserved
- ✅ Every @id-only reference resolves to a node defined in the same page graph (no dangling refs)
- ✅ BreadcrumbList item URLs absolute on all 5 breadcrumb pages, positions sequential
- ✅ Expected @type set per page present and unchanged from live (FAQPage, SoftwareApplication, Organization, etc.)
- ✅ @graph wrapper + @context="https://schema.org" preserved; correct node counts (index 10, kanji 7)
- ✅ No duplicate defining @id collisions within any page graph
- ✅ Literal & inside JSON-LD strings rendered raw (not &amp;) and still valid JSON
- ✅ JSON-LD WebPage/WebApplication url matches page canonical (no conflicting URL signal)
- ✅ WebSite SearchAction urlTemplate intact (sitelinks searchbox eligibility preserved)
- ✅ No fake aggregateRating on SoftwareApplication/WebApplication (avoids review manual-action risk); matches live
- ✅ No BOM, no inner </script>, no unclosed script tag in any JSON-LD block
- ℹ️ 404 page correctly carries no JSON-LD (error pages should not assert schema)

## Headings & Visible Content
- ✅ Exactly one h1 per page on all 7 pages (incl 404)
- ✅ h1 text byte-identical CUR vs DST on all 6 migrated pages (class attrs preserved too)
- ✅ Full ordered h1-h6 sequence identical CUR vs DST (kanji's only diff = 2 JS-injected h2s, verified)
- ✅ Per-level heading counts match CUR vs DST on all pages
- ✅ 2 JS-injected kanji h2s moved into kanji.js byte-for-byte (runtime DOM still has 7 h2s) — approved deviation
- ✅ Runtime-injected kanji breakdown labels (Part of Speech, Romaji/Kana, etc.) present in external JS
- ✅ Full visible body text identical in content AND order on all 6 pages (independent token-stream diff)
- ✅ Visible word counts match CUR vs DST exactly (index 861, privacy 1321, terms 1311, kanji 969, etc.)
- ✅ index +1 char delta is © glyph (U+00A9) vs &copy; entity — identical render, approved escaping
- ✅ FAQ question/answer visible text identical CUR vs DST (high-value SEO content tied to schema)
- ✅ Headings with & render correctly (&amp;); no double-escaping (&amp;amp;/&#38;) anywhere in dist
- ✅ Em-dash and special chars preserved across HTML and externalized JS (counts balance exactly)
- ✅ No heading-level skips introduced; hierarchy increments by 1 (WCAG/SEO clean)
- ✅ No heading text truncated by nested-child extraction (verified complete capture)
- ✅ 404 heading hierarchy valid (single h1 then h2, no skip) — net-new, no baseline needed
- ℹ️ contact <li> apparent diff is false positive (<link>/<line> SVG matched); SVG-stripped diff identical

## Links & Navigation
- ✅ Every internal href resolves to a real dist file across all 7 pages (zero missing)
- ✅ No anchor points to removed/renamed page (no /kanji.html, /home.html, bare /index.html, /404.html)
- ✅ Header nav set (hrefs + text + order) matches live exactly per page
- ✅ Footer 8-link set identical across all 7 pages and matches live order
- ✅ "Name Translator" link uses #converter on home, / on subpages — matches live exactly (no cross-link)
- ✅ contact.html anchors multiset-equal to live (inline mailto string shifts source order only, no rendered change)
- ✅ All 404 internal links resolve to real dist files
- ✅ In-page fragment targets (#converter, #main-content) have matching id targets (count=1 each)
- ✅ No localhost/127.0.0.1/:4321/:3000 link or src anywhere (only the benign hostname-guard regex)
- ✅ External social/schema links (linkedin/github/pinterest/bsky/wikipedia/trustpilot) match live URL-for-URL
- ✅ External rel/target attributes match live exactly (no security/SEO rel regression)
- ✅ No insecure http:// or protocol-relative // links anywhere; all external links https
- ✅ All script/css/image asset references resolve in dist
- ✅ sitemap loc URLs all map to canonical real pages; 404 excluded
- ⚠️ 404 reachable at literal /404.html with index,follow + self-canonical (LOW) — orphan, not in sitemap, not linked
- ✅ mailto + skip-link (#main-content) + logo link present and correct on every page

## Images & Media
- ✅ Single logo <img> byte-identical CUR vs DST on all pages (alt + width=132 height=44 + absolute prod src)
- ✅ Logo src resolves to existing valid PNG (396x74, 40641B), same-origin, not hotlinked
- ✅ Favicon/apple-touch-icon resolves to existing valid PNG (202x206, 28175B)
- ✅ apple-touch-icon AND rel=icon present on all 7 pages (count=2 each)
- ✅ og:image + twitter:image present on all 7 pages and resolve to existing file
- ✅ Logo carries explicit width+height (CLS layout reservation); no img missing alt or alt=""
- ⚠️ Logo attr ratio 3.0 vs intrinsic 5.35 (LOW) — CSS height:44px;width:auto forces correct render; PRE-EXISTING, identical to live
- ✅ loading= attribute parity with live (logo correctly NOT lazy — above-fold/LCP)
- ✅ Shipped image bytes match public/ source (cmp identical, no re-encoding)
- ✅ No hotlinked/data-URI/broken image refs; only first-party logo across all pages
- ✅ Inline decorative SVG counts match CUR vs DST per page (no media dropped/added)
- ✅ Logo alt text non-empty, brand-descriptive, identical to live on all 7 pages
- ✅ Favicon near-square (202x206, ratio 0.98) — acceptable, byte-identical to live
- ✅ 404 uses same valid logo/favicon/og assets (no orphan/broken net-new image refs)
- ℹ️ og:image:width/height/alt absent in BOTH dist and live (LOW) — parity, not a silent degradation

## Crawl & Index Controls
- ✅ robots.txt byte-identical to live and public/ source (245B)
- ✅ robots.txt has no active Disallow (pages, /data JSON, /scripts, CSS all crawlable)
- ✅ robots.txt Sitemap: line points to correct absolute https URL that exists in dist
- ✅ sitemap.xml byte-identical to live (6 url entries, none added/dropped/reordered)
- ✅ All 6 public pages present in sitemap; every loc maps to an existing dist file
- ✅ Kanji converter in sitemap, URL not truncated/malformed (priority 0.9)
- ✅ /404.html correctly excluded from sitemap (verified: 6 locs, zero 404 refs)
- ✅ No orphan indexable page beyond intentionally-excluded 404
- ✅ Sitemap URL form (.html, bare / root) matches each canonical exactly (no dilution)
- ✅ Every page has self-referential absolute https canonical (matches live)
- ✅ No noindex on any of the 6 public pages (grep noindex = 0)
- ⚠️ 404 page indexable: index,follow + self-canonical, served 200 at literal URL (LOW) — index-hygiene only, money pages unaffected
- ⚠️ No .htaccess/ErrorDocument anywhere (MEDIUM raw → real impact LOW) — default Apache returns true 404 for missing paths; only concrete issue is the single indexable /404.html
- ⚠️ verify.mjs has zero crawl-index assertions (MEDIUM raw → regression-insurance) — robots/sitemap/canonical currently correct; gap hides the indexable-404 bug
- ℹ️ sitemap lastmod dates carried from live (2026-02 to 04) (LOW) — intentional parity; migration changed HTML but lastmod is a weak hint
- ✅ Internal nav/footer link form matches canonicals/sitemap (no non-canonical variant splitting signals)

## Asset Availability
- ✅ All core local assets exist in dist with non-zero size (styles.css 17471B, script.js 20260B, kanji.js 24759B, jmdict 4MB, both _astro bundles, favicon, logo, 404)
- ✅ index.html /styles.css + /script.js refs resolve to existing dist files
- ✅ kanji page _astro CSS + kanji-xhr-patch.js + kanji.js all resolve (the prior referenced-but-undeployed bug is fixed)
- ✅ about/privacy/terms/contact/404 share /_astro/about.Bb07kLD3.css + /scripts/site.js, both exist
- ✅ Hashed _astro CSS filenames in HTML byte-match files on disk (no stale-hash 404)
- ✅ kanji.js fetch('/data/jmdict-top10k.json') resolves to deployed 4MB file; path identical to live
- ✅ Kuromoji dictPath CDN reachable (base.dat.gz/cc.dat.gz = 200); byte-identical to live
- ✅ Kuroshiro + analyzer CDN script URLs reachable (200), unchanged from live
- ✅ TOOL_CSP permits jsdelivr in script-src AND connect-src (lib + dict XHR not blocked)
- ✅ Favicon/logo absolute prod URLs resolve to dist root (200 in production)
- ✅ Every body <img> has resolvable source (only the logo, 7 occurrences)
- ✅ All CSS url() are inline data: URIs (no hidden external font/image network pulls)
- ✅ No dynamically-injected asset path references an undeployed local path
- ✅ Every sitemap loc maps to an existing dist HTML file
- ✅ Google Fonts stylesheet + gstatic origin consistent with preconnect and allowed by CSP
- ✅ XHR protocol-fix patch loaded BEFORE kanji.js (guards kuromoji CDN dict shard URLs)

## Performance & Core Web Vitals
- ✅ Every dist page net smaller than live raw+gzipped (kanji -66422B raw, -13689 gz; all deltas negative)
- ✅ index only -74B gz because home already used external /styles.css + /script.js on live (expected, not missed externalization)
- ✅ 3.8MB jmdict JSON loads on-demand only (referenced only in kanji.js, no preload, fetched after convert click)
- ✅ Logo width/height present (zero logo-induced CLS); only one img/page
- ✅ Google Fonts loaded with display=swap (no FOIT); identical to live
- ✅ Font preconnect to googleapis + gstatic(crossorigin) on every page
- ✅ CSS is render-blocking <link> in <head> (correct), not mid-body
- ✅ Page JS at end-of-body or async (gtag async); no new render-blocking script
- ✅ HTTPS-redirect head script now type=module (marginally better — no longer parser-blocking)
- ✅ GA4 gtag.js loaded async; inline config non-blocking; matches live
- ✅ Legal/about/contact/404 share one hashed CSS bundle (cross-page cache reuse — net improvement)
- ✅ No new render-blocking resource or new third-party origin vs live
- ⚠️ Unhashed root assets (/styles.css, /script.js, /scripts/*) cached by fixed path (LOW) — no SEO impact; set short cache/ETag or ?v= on future edits
- ⚠️ No preconnect to cdn.jsdelivr.net on kanji page (LOW/INFO) — parity with live, end-of-body scripts, no first-paint impact
- ℹ️ compressHTML:false leaves whitespace (LOW) — only ~0.4KB gz/page after gzip, below any CWV threshold
- ℹ️ jmdict JSON 4MB raw / 807KB gz — verify Hostinger gzip/brotli for application/json (UX only, zero SEO impact)

## Security & CSP
- ✅ CSP meta byte-matches live on all 6 migrated pages (no silent tightening/loosening)
- ✅ CSP present via meta on all 7 pages incl 404 (only enforcement vector on shared hosting)
- ✅ CSP meta appears in head BEFORE any script/stylesheet/font load
- ✅ STANDARD_CSP script-src covers /script.js, gtag, inline module + gtag config (unsafe-inline)
- ✅ TOOL_CSP covers kanji CDN scripts + unsafe-eval + blob: worker for kuromoji
- ✅ connect-src on kanji covers kuromoji dict XHR (jsdelivr) + jmdict fetch (self)
- ✅ connect-src includes all 4 GA4 endpoints so page_view/event beacons not blocked (approved #7/#9)
- ✅ style-src/font-src cover external CSS + Google Fonts + inline styles; no self-hosted @font-face
- ✅ img-src covers data: SVG noise + absolute logo/favicon/og:image
- ✅ No page ships a CSP strict enough to block its own resources (every resource mapped to a directive)
- ✅ upgrade-insecure-requests parity (present on 6, absent on kanji — matches live, JS HTTPS enforce compensates)
- ✅ Force-HTTPS inline script on all 7 pages; regex correctly exempts localhost/127.0.0.1
- ✅ No mixed-content http:// resource (only XML-namespace URIs and a normalization regex literal)
- ✅ No localhost/dev-URL leaked into dist (only the force-HTTPS exemption regex)
- ✅ CSP is enforcing (not Report-Only); no dead report-uri/report-to endpoint
- ✅ Contact form has no hidden fetch/XHR POST to a connect-src-missing endpoint (mailto only)
- ✅ Referrer-Policy meta preserved (strict-origin-when-cross-origin)

## Mobile & Responsive
- ✅ Viewport meta present/correct on all 7 pages; no maximum-scale/user-scalable anti-pattern
- ✅ Viewport string matches live exactly; 404 uses same correct string
- ✅ Home @media(max-width:640px) responsive block intact in styles.css (mobile nav + grid collapse)
- ✅ Legal/contact/404 CSS bundle contains full mobile-nav @media rule
- ✅ Kanji @media(max-width:640px) intact rule-for-rule (only noscript dropped, approved)
- ✅ toggleMobileNav() defined at global scope and reachable on every page type (prior SSR-import bug gone)
- ✅ Nav scripts are classic <script src> (NOT type=module) so global onclick resolves
- ✅ Nav scripts at end-of-body so DOM handlers bind against live DOM
- ✅ contact inline toggleMobileNav identical to site.js copy (redundant but harmless)
- ✅ body overflow-x:hidden on every page type (no horizontal scroll)
- ✅ Wide tables wrapped in overflow-x:auto (breakdown-table, examples-table)
- ✅ No hard width:NNNpx layout containers (all 3-digit px are max-width)
- ✅ Hamburger button present with aria-label + aria-expanded on every page; toggle updates aria-expanded
- ⚠️ Hamburger tap target ~40px vs Google's ~48px guideline (LOW) — UNCHANGED from live, not a regression
- ✅ noscript mobile-nav fallback removal (approved) has no mobile/SEO downside (Googlebot renders with JS)
- ⚠️ verify.mjs has no viewport/@media/toggleMobileNav guard (LOW) — build is correct today, regression-insurance only
- ✅ Responsive stylesheets in <head> (correct first-paint layout, no mobile FOUC/CLS)

## Build Integrity & Parity
- ✅ astro.config: output:static, build.format:file, trailingSlash:never, site set — URLs stay /about.html
- ✅ dist filenames flat .html (no /about/index.html dir form); all 6 live URLs preserved 1:1
- ✅ npm run build + verify.mjs reports 0 unexpected diffs on all 6 pages
- ✅ INDEPENDENT visible-text strip diff identical on all 6 pages (proves verify isn't masking regression)
- ✅ INDEPENDENT JSON-LD whitespace-only diff identical on all 6 pages
- ✅ All 11 head SEO tags identical CUR vs DST (independent extractor)
- ✅ No Astro dev artifacts (data-astro-cid/astro-island/sourcemaps/@vite/HMR/dev-toolbar) in dist
- ✅ All dist HTML is UTF-8, no BOM, kana/kanji render with zero mojibake (0 U+FFFD)
- ✅ verify.mjs noscript-strip is safe (live noscript blocks contain only CSS, zero indexable text)
- ⚠️ verify.mjs entity normalization is symmetric (LOW) — masks nothing today; independent unescaped diff also passes
- ✅ sitemap/robots use live URL structure (.html, bare /, no trailing-slash dirs)
- ✅ All internal <a href> use flat .html URLs (no /dir/ or /index.html)
- ✅ No orphan/dev files in dist (no .DS_Store/.map/.ts/README); both _astro bundles referenced
- ✅ Per-page byte deltas fully explained by approved CSS/JS extraction + entity escaping (not content loss)
- ⚠️ Net-new /404.html index,follow + self-canonical + no .htaccess ErrorDocument (MEDIUM raw → LOW real) — net-new, undiscoverable, money pages unaffected
- ✅ Clean reproducible build produces exactly 7 expected pages, no warnings/errors