// Content Security Policy values for the site.
//
// connect-src includes the full set of Google Analytics 4 endpoints
// needed for gtag.js to successfully send collection data:
//   - https://www.google-analytics.com        (default)
//   - https://*.google-analytics.com          (regional collection, e.g. region1.)
//   - https://*.analytics.google.com          (alternative collection endpoint)
//   - https://www.google.com                  (GA4's /g/collect endpoint)
//
// Without all four, GA4 collection requests are silently blocked and
// no analytics data is recorded for that page (CSP violations show in DevTools
// but the user-facing page still works).
//
// For new pages, import STANDARD_CSP. For tool pages that need external
// CDN libraries (e.g. the kanji tool's Kuroshiro/Kuromoji), import TOOL_CSP.

export const STANDARD_CSP = "upgrade-insecure-requests; default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://myjapanesenametranslator.com data:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.google.com;";

export const TOOL_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://myjapanesenametranslator.com data:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.google.com https://cdn.jsdelivr.net; worker-src 'self' blob:; child-src 'self' blob:;";
