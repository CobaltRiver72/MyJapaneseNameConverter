import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  convertKana,
  getCharacterRows,
  getKanaCounts,
  toHiragana,
  toKatakana,
} from '../public/scripts/hiragana-katakana-core.js';

describe('hiragana and katakana conversion', () => {
  it('converts hiragana text to katakana while preserving non-kana characters', () => {
    assert.equal(toKatakana('こんにちは、ひらがなと漢字 ABC'), 'コンニチハ、ヒラガナト漢字 ABC');
  });

  it('converts katakana text to hiragana while preserving long marks and punctuation', () => {
    assert.equal(toHiragana('スーパー・カタカナ！'), 'すーぱー・かたかな！');
  });

  it('handles voiced kana, small kana, and kana iteration marks', () => {
    assert.equal(toKatakana('がっこう ゔ ゝゞ'), 'ガッコウ ヴ ヽヾ');
    assert.equal(toHiragana('ガッコウ ヴ ヽヾ'), 'がっこう ゔ ゝゞ');
  });

  it('provides mode-specific output for the browser UI', () => {
    assert.equal(convertKana('あいう', 'katakana'), 'アイウ');
    assert.equal(convertKana('アイウ', 'hiragana'), 'あいう');
    assert.equal(convertKana('あいう', 'spaced'), 'ア イ ウ');
    assert.equal(convertKana('あいう', 'original'), 'あいう');
  });

  it('builds character rows and script counts for the breakdown table', () => {
    const rows = getCharacterRows('あア字');

    assert.deepEqual(rows, [
      { original: 'あ', hiragana: 'あ', katakana: 'ア', type: 'Hiragana' },
      { original: 'ア', hiragana: 'あ', katakana: 'ア', type: 'Katakana' },
      { original: '字', hiragana: '字', katakana: '字', type: 'Other' },
    ]);

    assert.deepEqual(getKanaCounts('あア字'), {
      total: 3,
      hiragana: 1,
      katakana: 1,
      other: 1,
    });
  });
});
