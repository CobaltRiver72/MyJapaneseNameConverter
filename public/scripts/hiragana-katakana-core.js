const HIRAGANA_START = 0x3041;
const HIRAGANA_END = 0x3096;
const HIRAGANA_ITERATION_START = 0x309D;
const HIRAGANA_ITERATION_END = 0x309E;
const KATAKANA_START = 0x30A1;
const KATAKANA_END = 0x30F6;
const KATAKANA_ITERATION_START = 0x30FD;
const KATAKANA_ITERATION_END = 0x30FE;
const KANA_OFFSET = 0x60;

export function isHiragana(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (code >= HIRAGANA_START && code <= HIRAGANA_END) ||
    (code >= HIRAGANA_ITERATION_START && code <= HIRAGANA_ITERATION_END);
}

export function isKatakana(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (code >= KATAKANA_START && code <= KATAKANA_END) ||
    (code >= KATAKANA_ITERATION_START && code <= KATAKANA_ITERATION_END);
}

export function toKatakana(input) {
  return Array.from(input || '').map(function(char) {
    if (!isHiragana(char)) return char;
    return String.fromCharCode(char.charCodeAt(0) + KANA_OFFSET);
  }).join('');
}

export function toHiragana(input) {
  return Array.from(input || '').map(function(char) {
    if (!isKatakana(char)) return char;
    return String.fromCharCode(char.charCodeAt(0) - KANA_OFFSET);
  }).join('');
}

export function convertKana(input, mode) {
  switch (mode) {
    case 'hiragana':
      return toHiragana(input);
    case 'spaced':
      return Array.from(toKatakana(input || '')).join(' ');
    case 'original':
      return input || '';
    case 'katakana':
    default:
      return toKatakana(input);
  }
}

export function getCharacterRows(input) {
  return Array.from(input || '').map(function(char) {
    const hiragana = toHiragana(char);
    const katakana = toKatakana(char);
    let type = 'Other';
    if (isHiragana(char)) type = 'Hiragana';
    else if (isKatakana(char)) type = 'Katakana';

    return {
      original: char,
      hiragana,
      katakana,
      type,
    };
  });
}

export function getKanaCounts(input) {
  return getCharacterRows(input).reduce(function(counts, row) {
    counts.total += 1;
    if (row.type === 'Hiragana') counts.hiragana += 1;
    else if (row.type === 'Katakana') counts.katakana += 1;
    else counts.other += 1;
    return counts;
  }, {
    total: 0,
    hiragana: 0,
    katakana: 0,
    other: 0,
  });
}
