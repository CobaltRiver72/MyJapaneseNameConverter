// scripts/build-kanji-finder-data.mjs
//
// One-shot generator for the /kanji-finder data files. Reads the raw sources
// from /tmp/kf-data (see SOURCES below for how to re-download them) and emits:
//
//   public/data/kanji-finder-dict.json
//     { "字": [strokes, grade, jlpt, freq, [on… katakana], [kun…], [meanings…], "romaji blob"] }
//     Scope: every character the recognizer knows (ref-patterns) plus every
//     jōyō / JLPT / top-frequency kanji — the set a learner can realistically hit.
//
//   public/data/kanji-finder-radicals.json
//     { "radicals": [["一", 1], …],  "kanji": { "一": "亜唖…" } }
//     radkfile inverted index: pick radicals → intersect kanji lists.
//
// SOURCES (re-download if regenerating):
//   kanji-full.json   https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json (KANJIDIC2-derived)
//   kradfile/radkfile http://ftp.edrdg.org/pub/Nihongo/{kradfile,radkfile}.gz  (EUC-JP → UTF-8)
//   ref-patterns.js   https://raw.githubusercontent.com/asdfjkl/kanjicanvas/master/docs/resources/javascript/ref-patterns.js
//
// KANJIDIC2 / KRADFILE / RADKFILE are property of the EDRDG, used under the
// group's CC BY-SA 4.0 licence — the page carries the required attribution.

import { readFileSync, writeFileSync } from 'node:fs';

const SRC = '/tmp/kf-data';

// --- kana → romaji (Hepburn-ish, for search matching only) -----------------
const DIGRAPHS = {
  'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho',
  'ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo',
  'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
  'りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
  'じゃ':'ja','じゅ':'ju','じょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo',
  'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo','ぢゃ':'ja','ぢゅ':'ju','ぢょ':'jo'
};
const MONO = {
  'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
  'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
  'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
  'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo',
  'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','ゐ':'i','ゑ':'e','を':'o','ん':'n',
  'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
  'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
  'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o','ゎ':'wa'
};
function kanaToRomaji(kana) {
  // strip okurigana dots / prefixes-suffixes markers used by KANJIDIC readings
  const s = kana.replace(/[.\-ー]/g, m => (m === 'ー' ? ':' : ''));
  let out = '', i = 0;
  while (i < s.length) {
    const two = s.slice(i, i + 2);
    if (DIGRAPHS[two]) { out += DIGRAPHS[two]; i += 2; continue; }
    const c = s[i];
    if (c === 'っ') { // gemination: double next consonant
      const nxt = DIGRAPHS[s.slice(i + 1, i + 3)] || MONO[s[i + 1]] || '';
      out += nxt ? nxt[0] : ''; i += 1; continue;
    }
    if (c === ':') { i += 1; continue; } // long vowel marker — drop for search
    out += MONO[c] ?? ''; i += 1;
  }
  return out;
}
const hiraToKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));

// --- load sources -----------------------------------------------------------
const full = JSON.parse(readFileSync(`${SRC}/kanji-full.json`, 'utf8'));

const refChars = new Set();
for (const line of readFileSync(`${SRC}/ref-patterns.js`, 'utf8').split('\n')) {
  const m = line.match(/^\["(.)",/u);
  if (m) refChars.add(m[1]);
}

// --- dict -------------------------------------------------------------------
const dict = {};
let included = 0;
for (const [ch, k] of Object.entries(full)) {
  const inScope = refChars.has(ch) || k.grade != null || k.jlpt_new != null || (k.freq != null && k.freq <= 2500);
  if (!inScope) continue;
  const on = (k.readings_on || []).map(hiraToKata);
  const kun = k.readings_kun || [];
  const meanings = k.meanings || [];
  if (!meanings.length && !on.length && !kun.length) continue;
  const romaji = [...new Set([...(k.readings_on || []), ...kun].map(kanaToRomaji).filter(Boolean))].join(' ');
  dict[ch] = [k.strokes ?? 0, k.grade ?? 0, k.jlpt_new ?? 0, k.freq ?? 0, on, kun, meanings, romaji];
  included++;
}
writeFileSync('public/data/kanji-finder-dict.json', JSON.stringify(dict));
console.log(`dict: ${included} kanji, ${(JSON.stringify(dict).length / 1024).toFixed(0)} KB`);
console.log(`  ref-pattern chars covered by dict: ${[...refChars].filter(c => dict[c]).length}/${refChars.size} (rest are kana/rare)`);

// --- radicals ----------------------------------------------------------------
const radk = readFileSync(`${SRC}/radkfile.utf8`, 'utf8');
const radicals = []; const kanjiByRad = {};
let cur = null;
for (const line of radk.split('\n')) {
  if (line.startsWith('#')) continue;
  if (line.startsWith('$')) {
    const [, rad, strokes] = line.trim().split(/\s+/);
    cur = rad;
    radicals.push([rad, Number(strokes)]);
    kanjiByRad[cur] = '';
  } else if (cur && line.trim()) {
    // keep only kanji we have dictionary data for — no dead-end results
    kanjiByRad[cur] += [...line.trim()].filter(c => dict[c]).join('');
  }
}
writeFileSync('public/data/kanji-finder-radicals.json', JSON.stringify({ radicals, kanji: kanjiByRad }));
console.log(`radicals: ${radicals.length}, index ${(JSON.stringify(kanjiByRad).length / 1024).toFixed(0)} KB`);
