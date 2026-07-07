// ========================================
// KANJI TO KATAKANA CONVERTER ENGINE
// Derived from kanji.js — readings are kept in katakana
// (kuromoji emits katakana readings natively).
// ========================================

let kuroshiroInstance = null;
let engineReady = false;
let currentMode = 'main';
let lastConvertedText = '';

// === WORD-BREAKDOWN TABLE HELPERS ===
// Closed-class words (particles / auxiliaries / conjunctions) are homophones
// with content words in JMDict (は → tooth, ね → root). Hardcode these and
// skip JMDict lookup for 助詞 / 助動詞 / 接続詞 POS tags.
const PARTICLE_GLOSS = {
    // Case particles
    'は': 'topic marker; as for',
    'が': 'subject marker; but',
    'を': 'direct object marker',
    'に': 'to; at; in; by',
    'で': 'at; in; by means of',
    'へ': 'to; towards',
    'と': 'with; and; quotation marker',
    'から': 'from; because',
    'まで': 'until; up to',
    'より': 'than; from',
    'の': 'possessive; of',
    // Binding / focus
    'も': 'also; too; even',
    'こそ': 'emphasis marker',
    'さえ': 'even; only',
    'しか': 'only (with negative)',
    'だけ': 'only; just',
    'ばかり': 'only; just; about',
    'ほど': 'about; as much as',
    'くらい': 'about; approximately',
    'ぐらい': 'about; approximately',
    'など': 'etc.; such as',
    'なんか': 'things like; such as (informal)',
    // Sentence-final
    'か': 'question marker',
    'ね': "right?; isn't it?; you know",
    'よ': 'emphasis; you know (informal)',
    'な': 'emphasis; prohibition (after verb)',
    'わ': 'emphasis (feminine)',
    'ぞ': 'emphasis (masculine)',
    'ぜ': 'emphasis (masculine, casual)',
    'のに': 'although; even though',
    'けど': 'but; however',
    'けれど': 'but; however',
    'けれども': 'but; however',
    // Conjunctive
    'て': 'connective; and then',
    'し': 'and; and also',
    'ば': 'if; when',
    'たら': 'if; when; after',
    'なら': 'if; in the case of',
    // Auxiliaries (common)
    'です': 'be (polite copula)',
    'だ': 'be (plain copula)',
    'である': 'be (formal copula)',
    'ます': 'polite verb ending',
    'ました': 'polite past',
    'ません': 'polite negative',
    'ない': 'not; negative',
    'た': 'past tense marker',
    'たい': 'want to (verb ending)',
    'れる': 'passive / potential',
    'られる': 'passive / potential',
    'せる': 'causative',
    'させる': 'causative',
    'そう': 'seems; looks like',
    'よう': 'seems; like',
    'らしい': 'seems; apparently',
    'べき': 'should',
    'はず': 'should; supposed to',
    'こと': 'nominalizer (thing; matter)',
    'もの': 'nominalizer (thing)',
    'ところ': 'place; about to'
};

const POS_MAP = {
    '名詞':     { label: 'N',   cls: 'pos-n'   },
    '動詞':     { label: 'V',   cls: 'pos-v'   },
    '形容詞':   { label: 'Adj', cls: 'pos-adj' },
    '形容動詞': { label: 'Na',  cls: 'pos-na'  },
    '助詞':     { label: 'Prt', cls: 'pos-prt' },
    '感動詞':   { label: 'On',  cls: 'pos-on'  },
    '副詞':     { label: 'Adv', cls: 'pos-adv' },
    '助動詞':   { label: 'Aux', cls: 'pos-aux' },
    '記号':     { label: '—',   cls: 'pos-sym' }
};

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function(c) {
        return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
}

function kataToHira(s) {
    if (!s) return '';
    var r = '';
    for (var i = 0; i < s.length; i++) {
        var code = s.charCodeAt(i);
        if (code >= 0x30A1 && code <= 0x30F6) r += String.fromCharCode(code - 0x60);
        else r += s.charAt(i);
    }
    return r;
}

// Fallback for tokens the tokenizer has no reading for: promote any plain
// hiragana in the surface form to katakana so the output line stays katakana.
function hiraToKata(s) {
    if (!s) return '';
    var r = '';
    for (var i = 0; i < s.length; i++) {
        var code = s.charCodeAt(i);
        if (code >= 0x3041 && code <= 0x3096) r += String.fromCharCode(code + 0x60);
        else r += s.charAt(i);
    }
    return r;
}

function readingToRomaji(reading) {
    if (!reading) return '';
    try {
        var util = (typeof Kuroshiro !== 'undefined' && Kuroshiro.Util)
            ? Kuroshiro.Util
            : (typeof Kuroshiro !== 'undefined' && Kuroshiro.default && Kuroshiro.default.Util)
                ? Kuroshiro.default.Util : null;
        if (util && typeof util.kanaToRomaji === 'function') {
            return util.kanaToRomaji(reading, 'hepburn');
        }
    } catch (e) { /* fall through */ }
    return '';
}

function lookupGloss(token) {
    var surface = token.surface_form || token.surface || '';
    var basic = (token.basic_form && token.basic_form !== '*') ? token.basic_form : surface;
    var posJa = token.pos || '';

    // Step 1: closed-class words — use hardcoded dict, skip JMDict to avoid
    // homophone collisions (は → "tooth", ね → "root", etc.).
    if (posJa === '助詞' || posJa === '助動詞' || posJa === '接続詞') {
        if (PARTICLE_GLOSS[surface]) return PARTICLE_GLOSS[surface];
        if (PARTICLE_GLOSS[basic]) return PARTICLE_GLOSS[basic];
        return '—';
    }

    // Step 2: content words — JMDict lookup.
    var dict = window._jmdict;
    if (!dict) return '—';
    var entry = dict[basic] || dict[surface];
    if (!entry) return '—';
    var glosses = entry.g || entry.glosses || (Array.isArray(entry) ? entry : null);
    if (!glosses || !glosses.length) return '—';
    return glosses.slice(0, 2).join('; ');
}

function escapeAttr(s) { return escapeHtml(s); }

// Central tokenizer — enriches once, caches per input.
var _tokensCache = { input: null, tokens: null };
async function tokenizeOnce(input) {
    await ensureJmdictLoaded();
    if (_tokensCache.input === input && _tokensCache.tokens) return _tokensCache.tokens;
    var raw = await Promise.resolve(getKuromojiTokens(input));
    var out = [];
    for (var i = 0; i < (raw || []).length; i++) {
        var t = raw[i];
        var posEntry = POS_MAP[t.pos] || { label: '—', cls: 'pos-sym' };
        var kana = t.reading || '';
        var romaji = readingToRomaji(t.reading);
        out.push({
            surface: t.surface_form || '',
            basicForm: t.basic_form || t.surface_form || '',
            kana: kana || hiraToKata(t.surface_form || ''),
            romaji: romaji,
            pos: t.pos || '',
            posCode: posEntry.cls.replace('pos-', ''),
            posLabel: posEntry.label,
            gloss: lookupGloss(t)
        });
    }
    _tokensCache = { input: input, tokens: out };
    return out;
}

// Each panel renders to an HTML string that includes its own data-raw
// payload (used by the generic Copy + Raw delegation handlers).
function flatRomajiText(tokens) {
    return tokens.map(function(t) { return t.romaji || t.surface; }).join(' ').trim();
}
function flatKanaText(tokens) {
    return tokens.map(function(t) { return t.kana || t.surface; }).join(' ').trim();
}
function mainRawText(tokens) {
    return tokens.map(function(t) {
        return (t.romaji || '') + '\n' + (t.kana || t.surface) + '\n' + (t.gloss || '—');
    }).join('\n\n');
}
function tableTsvText(tokens) {
    var lines = ['Word\tPOS\tReading\tRomaji\tGloss'];
    for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        lines.push([t.surface, t.posLabel, t.kana, t.romaji, t.gloss]
            .map(function(v) { return String(v == null ? '' : v).replace(/[\t\n\r]+/g, ' '); })
            .join('\t'));
    }
    return lines.join('\n');
}

function renderFlatRomaji(tokens) {
    var joined = flatRomajiText(tokens);
    return '<div class="panel" data-panel="romaji" data-raw="' + escapeAttr(joined) + '">' +
        '<div class="panel-tools">' +
          '<button type="button" class="copy-btn">Copy</button>' +
          '<button type="button" class="raw-btn" aria-pressed="false">Raw</button>' +
        '</div>' +
        '<div class="flat-line romaji">' + escapeHtml(joined) + '</div>' +
        '<pre class="raw-view">' + escapeHtml(joined) + '</pre>' +
    '</div>';
}

function renderFlatKana(tokens) {
    var joined = flatKanaText(tokens);
    return '<div class="panel" data-panel="kana" data-raw="' + escapeAttr(joined) + '">' +
        '<div class="panel-tools">' +
          '<button type="button" class="copy-btn">Copy</button>' +
          '<button type="button" class="raw-btn" aria-pressed="false">Raw</button>' +
        '</div>' +
        '<div class="flat-line kana">' + escapeHtml(joined) + '</div>' +
        '<pre class="raw-view">' + escapeHtml(joined) + '</pre>' +
    '</div>';
}

function renderMain(tokens) {
    var raw = mainRawText(tokens);
    var html = '<div class="panel" data-panel="main" data-raw="' + escapeAttr(raw) + '">';
    html += '<h2 class="panel-heading">Japanese Sentence Breakdown — Romaji, Katakana &amp; English Meaning</h2>';
    html += '<div class="panel-tools">' +
          '<button type="button" class="copy-btn">Copy</button>' +
          '<button type="button" class="raw-btn" aria-pressed="false">Raw</button>' +
        '</div>';
    html += '<div class="main-tokens">';
    for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        html += '<span class="tok" data-pos="' + escapeAttr(t.posCode) + '"' +
            ' data-r="' + escapeAttr(t.romaji) + '"' +
            ' data-k="' + escapeAttr(t.kana || t.surface) + '"' +
            ' data-g="' + escapeAttr(t.gloss) + '"' +
            ' title="' + escapeAttr((t.romaji || '') + ' · ' + (t.kana || t.surface) + ' · ' + (t.gloss || '—')) + '">' +
            '<span class="tok-r">' + escapeHtml(t.romaji) + '</span>' +
            '<span class="tok-k">' + escapeHtml(t.surface) + '</span>' +
            '<span class="tok-g">' + escapeHtml(t.gloss) + '</span>' +
        '</span>';
    }
    html += '</div>';
    html += '<pre class="raw-view">' + escapeHtml(raw) + '</pre>';
    html += '</div>';
    return html;
}

function renderBreakdownTable(tokens) {
    var tsv = tableTsvText(tokens);
    var html = '<div class="panel" data-panel="table" data-raw="' + escapeAttr(tsv) + '">';
    html += '<h2 class="table-heading">Japanese Word Breakdown — Part of Speech, Katakana Reading &amp; Meaning</h2>';
    html += '<div class="panel-tools">' +
          '<button type="button" class="copy-btn">Copy</button>' +
          '<button type="button" class="raw-btn" aria-pressed="false">Raw</button>' +
        '</div>';
    html += '<div class="breakdown-wrap"><table class="breakdown-table">';
    html += '<thead><tr><th>Word</th><th>POS</th><th>Reading</th><th>Romaji</th><th>Gloss</th></tr></thead>';
    html += '<tbody>';
    for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        html += '<tr data-pos="' + escapeAttr(t.posCode) + '">';
        html += '<td class="word">' + escapeHtml(t.surface) + '</td>';
        html += '<td><span class="pos-badge pos-' + escapeAttr(t.posCode) + '">' + escapeHtml(t.posLabel) + '</span></td>';
        html += '<td class="reading">' + escapeHtml(t.kana) + '</td>';
        html += '<td class="romaji">' + escapeHtml(t.romaji) + '</td>';
        html += '<td class="gloss">' + escapeHtml(t.gloss) + '</td>';
        html += '</tr>';
    }
    html += '</tbody></table></div>';
    html += '<pre class="raw-view">' + escapeHtml(tsv) + '</pre>';
    html += '</div>';
    return html;
}

// Generic clipboard fallback (used by panel Copy + the toolbar Copy).
function plainTextCopyFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showCopiedToast(); } catch(e) {}
    document.body.removeChild(ta);
}
function copyPlainText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopiedToast).catch(function() { plainTextCopyFallback(text); });
    } else {
        plainTextCopyFallback(text);
    }
}

async function ensureJmdictLoaded() {
    if (window._jmdict) return;
    try {
        var res = await fetch('/data/jmdict-top10k.json');
        window._jmdict = res.ok ? await res.json() : {};
    } catch (e) {
        window._jmdict = {};
    }
}

function getKuromojiTokens(input) {
    var analyzer = kuroshiroInstance && kuroshiroInstance._analyzer;
    if (!analyzer) return [];
    var tokenizer = analyzer._tokenizer || analyzer._analyzer || analyzer.tokenizer;
    if (tokenizer && typeof tokenizer.tokenize === 'function') {
        return tokenizer.tokenize(input);
    }
    if (typeof analyzer.parse === 'function') {
        return analyzer.parse(input);
    }
    return [];
}

// Initialize Kuroshiro engine
async function initEngine() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const convertBtn = document.getElementById('convertBtn');

    try {
        statusDot.className = 'status-dot loading';
        statusText.textContent = 'Loading dictionary...';

        // Verify libraries loaded from CDN
        var KuroshiroClass = typeof Kuroshiro === 'function' ? Kuroshiro
            : (typeof Kuroshiro === 'object' && Kuroshiro && typeof Kuroshiro.default === 'function') ? Kuroshiro.default : null;
        var AnalyzerClass = typeof KuromojiAnalyzer === 'function' ? KuromojiAnalyzer
            : (typeof KuromojiAnalyzer === 'object' && KuromojiAnalyzer && typeof KuromojiAnalyzer.default === 'function') ? KuromojiAnalyzer.default : null;

        if (!KuroshiroClass) throw new Error('Kuroshiro library failed to load');
        if (!AnalyzerClass) throw new Error('KuromojiAnalyzer library failed to load');

        kuroshiroInstance = new KuroshiroClass();
        await kuroshiroInstance.init(new AnalyzerClass({
            dictPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict'
        }));

        engineReady = true;
        statusDot.className = 'status-dot ready';
        statusText.textContent = 'Ready';
        convertBtn.disabled = false;

        // Show speak button if speech synthesis is available
        if ('speechSynthesis' in window) {
            document.getElementById('speakBtn').style.display = 'flex';
        }

    } catch (err) {
        console.error('Kuroshiro init failed:', err);
        statusDot.className = 'status-dot error';
        statusText.textContent = 'Engine error — reload page';
        convertBtn.disabled = true;
    }
}

// Start loading engine
initEngine();

// Character count
document.getElementById('kanjiInput').addEventListener('input', function() {
    document.getElementById('charCount').textContent = this.value.length;
});

// Mode toggle handling
document.querySelectorAll('.mode-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-toggle').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        currentMode = btn.dataset.mode;

        // Re-convert if there's existing text
        if (lastConvertedText) {
            convertText();
        }
    });
});

// === GLOBAL READING / GLOSS TOGGLES ===
(function wireOutputToggles() {
    var resultText = document.getElementById('resultText');
    document.querySelectorAll('#outputControls .toggle-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var col = btn.dataset.col; // 'reading' | 'gloss'
            var pressed = btn.getAttribute('aria-pressed') === 'true';
            var next = !pressed;
            btn.setAttribute('aria-pressed', String(next));
            btn.classList.toggle('active', next);
            resultText.classList.toggle('hide-' + col, !next);
        });
    });
})();

// === GLOBAL POS FILTER CHIPS ===
(function wirePosFilters() {
    var resultText = document.getElementById('resultText');
    document.querySelectorAll('#outputControls .pos-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
            var pos = chip.dataset.pos;
            var pressed = chip.getAttribute('aria-pressed') === 'true';
            var next = !pressed;
            chip.setAttribute('aria-pressed', String(next));
            chip.classList.toggle('active', next);
            resultText.classList.toggle('hide-pos-' + pos, !next);
        });
    });
})();

// === PANEL COPY / RAW — event delegation on output container ===
(function wirePanelDelegation() {
    var container = document.getElementById('resultText');
    container.addEventListener('click', function(e) {
        var copyBtn = e.target.closest && e.target.closest('.copy-btn');
        if (copyBtn) {
            var panel = copyBtn.closest('.panel');
            if (panel) copyPlainText(panel.dataset.raw || '');
            return;
        }
        var rawBtn = e.target.closest && e.target.closest('.raw-btn');
        if (rawBtn) {
            var p = rawBtn.closest('.panel');
            if (p) {
                var on = p.classList.toggle('raw-mode');
                rawBtn.setAttribute('aria-pressed', String(on));
            }
            return;
        }
    });
})();

// === HOVER TOOLTIP for .tok (delegated) ===
(function wireTokTooltip() {
    var container = document.getElementById('resultText');
    var tip = null;
    function ensureTip() {
        if (tip) return tip;
        tip = document.createElement('div');
        tip.className = 'tok-tip';
        document.body.appendChild(tip);
        return tip;
    }
    function show(tokEl) {
        var el = ensureTip();
        var r = tokEl.dataset.r || '';
        var k = tokEl.dataset.k || '';
        var g = tokEl.dataset.g || '—';
        el.innerHTML = '<strong>' + escapeHtml(r || '—') + '</strong> · ' +
            escapeHtml(k || '—') + '<br>' + escapeHtml(g || '—');
        el.classList.add('visible');
        // Position above the token, accounting for page scroll.
        var rect = tokEl.getBoundingClientRect();
        var tipRect = el.getBoundingClientRect();
        var left = rect.left + window.scrollX + rect.width / 2 - tipRect.width / 2;
        var top = rect.top + window.scrollY - tipRect.height - 8;
        // Clamp to viewport horizontally
        var maxLeft = window.scrollX + document.documentElement.clientWidth - tipRect.width - 8;
        if (left < window.scrollX + 8) left = window.scrollX + 8;
        if (left > maxLeft) left = maxLeft;
        if (top < window.scrollY + 4) {
            top = rect.bottom + window.scrollY + 8; // flip below if no room above
        }
        el.style.left = left + 'px';
        el.style.top = top + 'px';
    }
    function hide() { if (tip) tip.classList.remove('visible'); }
    container.addEventListener('mouseover', function(e) {
        var tok = e.target.closest && e.target.closest('.tok');
        if (tok) show(tok);
    });
    container.addEventListener('mouseout', function(e) {
        var tok = e.target.closest && e.target.closest('.tok');
        if (tok) hide();
    });
    container.addEventListener('focusin', function(e) {
        var tok = e.target.closest && e.target.closest('.tok');
        if (tok) show(tok);
    });
    container.addEventListener('focusout', hide);
    window.addEventListener('scroll', hide, { passive: true });
})();

// Main conversion function
async function convertText() {
    if (!engineReady || !kuroshiroInstance) return;

    const input = document.getElementById('kanjiInput').value.trim();
    if (!input) return;

    lastConvertedText = input;

    const resultsArea = document.getElementById('resultsArea');
    const resultText = document.getElementById('resultText');
    const resultModeLabel = document.getElementById('resultModeLabel');
    const loadingOverlay = document.getElementById('resultLoading');

    resultsArea.classList.add('visible');
    loadingOverlay.classList.add('active');

    try {
        // Single tokenization per input; all 5 views reuse the same array.
        var tokens = await tokenizeOnce(input);
        resultText.className = 'result-text';

        if (!tokens || !tokens.length) {
            resultText.innerHTML = '';
            resultText.textContent = 'No tokens produced for this input.';
            document.getElementById('outputControls').hidden = true;
        } else {
            var html = '';
            var label = '';
            switch (currentMode) {
                case 'main':
                    html = renderMain(tokens);
                    label = 'Main View';
                    break;
                case 'romaji':
                    html = renderFlatRomaji(tokens) + renderMain(tokens);
                    label = 'Romaji + Main';
                    break;
                case 'kana':
                    html = renderFlatKana(tokens) + renderMain(tokens);
                    label = 'Katakana + Main';
                    break;
                case 'original':
                    html = renderFlatRomaji(tokens) + renderFlatKana(tokens) + renderMain(tokens);
                    label = 'Original (All Lines)';
                    break;
                case 'table':
                    html = renderFlatRomaji(tokens) + renderFlatKana(tokens) + renderMain(tokens) + renderBreakdownTable(tokens);
                    label = 'Full Breakdown';
                    break;
                default:
                    html = renderMain(tokens);
                    label = 'Main View';
            }
            resultText.innerHTML = html;
            resultModeLabel.textContent = label;
            document.getElementById('outputControls').hidden = false;
        }

    } catch (err) {
        console.error('Conversion error:', err);
        resultText.className = 'result-text';
        resultText.textContent = 'Conversion error. Please try again.';
    }

    loadingOverlay.classList.remove('active');
    resultsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Copy to clipboard
function copyResult() {
    const resultText = document.getElementById('resultText');
    const text = resultText.innerText || resultText.textContent;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopiedToast).catch(fallbackCopy);
    } else {
        fallbackCopy();
    }

    function fallbackCopy() {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showCopiedToast(); } catch(e) { /* silent */ }
        document.body.removeChild(ta);
    }
}

function showCopiedToast() {
    const toast = document.getElementById('copiedToast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
}

// Clear all
function clearAll() {
    document.getElementById('kanjiInput').value = '';
    document.getElementById('charCount').textContent = '0';
    document.getElementById('resultsArea').classList.remove('visible');
    document.getElementById('resultText').textContent = '';
    lastConvertedText = '';
}

// Text-to-speech
function speakText() {
    if (!('speechSynthesis' in window)) return;

    const input = document.getElementById('kanjiInput').value.trim();
    if (!input) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(input);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;

    // Try to find a Japanese voice
    const voices = window.speechSynthesis.getVoices();
    const jpVoice = voices.find(v => v.lang.startsWith('ja'));
    if (jpVoice) utterance.voice = jpVoice;

    window.speechSynthesis.speak(utterance);
}

// Try example
function tryExample(text) {
    document.getElementById('kanjiInput').value = text;
    document.getElementById('charCount').textContent = text.length;
    document.getElementById('converter').scrollIntoView({ behavior: 'smooth' });
    if (engineReady) {
        convertText();
    }
}

// Enter key support (Ctrl+Enter for textarea)
document.getElementById('kanjiInput').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        convertText();
    }
});

// FAQ toggle
function toggleFaq(el) {
    const item = el.parentElement;
    const isOpen = item.classList.toggle('open');
    el.setAttribute('aria-expanded', isOpen);
    const answer = el.nextElementSibling;
    if (answer) answer.setAttribute('aria-hidden', !isOpen);
}

// Mobile navigation toggle
function toggleMobileNav() {
    const nav = document.querySelector('.header-nav');
    const btn = document.querySelector('.mobile-menu-btn');
    const isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
}
