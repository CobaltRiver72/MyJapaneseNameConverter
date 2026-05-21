# `current/` — pre-migration reference HTML

These 6 files are **byte-identical snapshots** of the live `myjapanesenametranslator.com` site at the time the Astro migration began. They are the SEO source-of-truth that `scripts/verify.mjs` compares the built `dist/` HTML against.

**Do not edit these files manually.** They represent a fixed reference. If the live site is updated in the future and you want to re-establish a new baseline, re-snapshot from production and commit the update as a discrete change.

`npm run verify` will fail if any of these files are missing.
