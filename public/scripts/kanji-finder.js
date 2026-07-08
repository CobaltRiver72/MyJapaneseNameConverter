// ========================================
// KANJI FINDER — draw / radicals / search
// Recognition: KanjiCanvas (MIT, self-hosted, lazy-loaded).
// Data: KANJIDIC2 + RADKFILE (EDRDG CC BY-SA), KanjiVG stroke order (CC BY-SA).
// Everything runs client-side; drawn strokes never leave the browser.
// ========================================

var KF = {
    dict: null,          // char -> [strokes, grade, jlpt, freq, [on], [kun], [meanings], romajiBlob]
    radk: null,          // { radicals: [[rad, strokes]], kanji: { rad: "..." } }
    kanjiToRads: null,   // reverse index, built from radk
    jmdict: null,        // lazy: example words
    jmdictKeys: null,
    engineState: 'idle', // idle | loading | ready | error
    selectedRads: new Set(),
    strokeFilter: 0,
    history: []
};

function esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

// ---------- data loading ----------
function kfLoadDict() {
    if (KF.dict) return Promise.resolve();
    return Promise.all([
        fetch('/data/kanji-finder-dict.json').then(function (r) { return r.json(); }),
        fetch('/data/kanji-finder-radicals.json').then(function (r) { return r.json(); })
    ]).then(function (res) {
        KF.dict = res[0];
        KF.radk = res[1];
        KF.kanjiToRads = {};
        KF.radk.radicals.forEach(function (pair) {
            var rad = pair[0];
            var chars = KF.radk.kanji[rad] || '';
            for (var i = 0; i < chars.length; i++) {
                var c = chars[i];
                (KF.kanjiToRads[c] = KF.kanjiToRads[c] || []).push(rad);
            }
        });
    });
}

function kfLoadJmdict() {
    if (KF.jmdict) return Promise.resolve();
    return fetch('/data/jmdict-top10k.json').then(function (r) { return r.json(); }).then(function (d) {
        KF.jmdict = d;
        KF.jmdictKeys = Object.keys(d);
    });
}

// ---------- recognition engine (lazy) ----------
function kfScript(src) {
    return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = src; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
    });
}

function kfLoadEngine() {
    if (KF.engineState === 'ready' || KF.engineState === 'loading') return;
    KF.engineState = 'loading';
    kfStatus('loading', 'Loading recognizer…');
    Promise.all([
        kfScript('/scripts/vendor/kanji-canvas.js?v=20260707')
            .then(function () { return kfScript('/scripts/vendor/kanji-canvas-patterns.js?v=20260707'); }),
        kfLoadDict()
    ]).then(function () {
        KanjiCanvas.init('kfCanvas');
        // live recognition: after the engine's own stroke handlers run,
        // ours fires and refreshes the candidate row.
        var cv = document.getElementById('kfCanvas');
        ['mouseup', 'touchend', 'pointerup'].forEach(function (ev) {
            cv.addEventListener(ev, function () { setTimeout(kfRecognizeNow, 30); });
        });
        KF.engineState = 'ready';
        kfStatus('ready', 'Ready — draw in the box');
        cv.classList.add('kf-ready');
    }).catch(function (err) {
        console.error('Kanji Finder engine failed:', err);
        KF.engineState = 'error';
        kfStatus('error', 'Engine failed to load — reload the page');
    });
}

function kfStatus(cls, text) {
    var dot = document.getElementById('kfStatusDot');
    var txt = document.getElementById('kfStatusText');
    if (dot) dot.className = 'status-dot ' + cls;
    if (txt) txt.textContent = text;
}

function kfStrokeCount() {
    var p = KanjiCanvas['recordedPattern_kfCanvas'];
    return p ? p.length : 0;
}

function kfRecognizeNow() {
    if (KF.engineState !== 'ready') return;
    var n = kfStrokeCount();
    document.getElementById('kfStrokeCount').textContent = n;
    var out = document.getElementById('kfCandidates');
    if (!n) { out.innerHTML = '<span class="kf-hint">Candidates appear here after your first stroke.</span>'; return; }
    var str = KanjiCanvas.recognize('kfCanvas') || '';
    var chars = str.split(/\s+/).filter(function (c) { return c && KF.dict && KF.dict[c]; }).slice(0, 12);
    if (!chars.length) { out.innerHTML = '<span class="kf-hint">No match yet — keep drawing or try Undo.</span>'; return; }
    out.innerHTML = chars.map(function (c) {
        return '<button type="button" class="kf-cand" data-char="' + esc(c) + '" title="' + esc((KF.dict[c][6] || []).slice(0, 2).join(', ')) + '">' + esc(c) + '</button>';
    }).join('');
}

function kfUndo() { if (KF.engineState === 'ready') { KanjiCanvas.deleteLast('kfCanvas'); kfRecognizeNow(); } }
function kfClearCanvas() {
    if (KF.engineState === 'ready') {
        KanjiCanvas.erase('kfCanvas');
        document.getElementById('kfStrokeCount').textContent = '0';
        document.getElementById('kfCandidates').innerHTML = '<span class="kf-hint">Candidates appear here after your first stroke.</span>';
    }
}

// ---------- tabs ----------
function kfTab(name) {
    document.querySelectorAll('.kf-tab').forEach(function (b) {
        var on = b.dataset.tab === name;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
    });
    document.querySelectorAll('.kf-panel').forEach(function (p) {
        p.hidden = p.dataset.panel !== name;
    });
    if (name === 'radicals') kfLoadDict().then(kfRenderRadicals);
    if (name === 'search') { kfLoadDict(); document.getElementById('kfSearchInput').focus(); }
}

// ---------- radical picker ----------
function kfRenderRadicals() {
    var grid = document.getElementById('kfRadGrid');
    if (!grid.dataset.built) {
        var html = '';
        var lastStrokes = 0;
        KF.radk.radicals.forEach(function (pair) {
            if (pair[1] !== lastStrokes) {
                lastStrokes = pair[1];
                html += '<span class="kf-rad-group">' + lastStrokes + '</span>';
            }
            html += '<button type="button" class="kf-rad" data-rad="' + esc(pair[0]) + '">' + esc(pair[0]) + '</button>';
        });
        grid.innerHTML = html;
        grid.dataset.built = '1';
    }
    kfApplyRadicals();
}

function kfToggleRad(rad) {
    if (KF.selectedRads.has(rad)) KF.selectedRads.delete(rad); else KF.selectedRads.add(rad);
    kfApplyRadicals();
}

function kfApplyRadicals() {
    var out = document.getElementById('kfRadResults');
    var chars = null;
    KF.selectedRads.forEach(function (rad) {
        var set = new Set((KF.radk.kanji[rad] || '').split(''));
        if (chars === null) { chars = set; }
        else { chars = new Set([...chars].filter(function (c) { return set.has(c); })); }
    });
    var list = chars === null ? [] : [...chars];
    if (KF.strokeFilter) list = list.filter(function (c) { return KF.dict[c] && KF.dict[c][0] === KF.strokeFilter; });
    list.sort(function (a, b) {
        var fa = KF.dict[a][3] || 9999, fb = KF.dict[b][3] || 9999;
        return fa - fb || KF.dict[a][0] - KF.dict[b][0];
    });

    // grey out radicals that can no longer co-occur
    var possible = null;
    if (chars !== null && KF.selectedRads.size) {
        possible = new Set();
        list.forEach(function (c) { (KF.kanjiToRads[c] || []).forEach(function (r) { possible.add(r); }); });
    }
    document.querySelectorAll('.kf-rad').forEach(function (b) {
        b.classList.toggle('active', KF.selectedRads.has(b.dataset.rad));
        b.disabled = possible !== null && !possible.has(b.dataset.rad) && !KF.selectedRads.has(b.dataset.rad);
    });

    if (chars === null) { out.innerHTML = '<span class="kf-hint">Select one or more radicals above — matching kanji appear here.</span>'; return; }
    if (!list.length) { out.innerHTML = '<span class="kf-hint">No kanji match this combination.</span>'; return; }
    var shown = list.slice(0, 120);
    out.innerHTML = shown.map(function (c) {
        return '<button type="button" class="kf-cand" data-char="' + esc(c) + '" title="' + esc((KF.dict[c][6] || []).slice(0, 2).join(', ')) + '">' + esc(c) + '</button>';
    }).join('') + (list.length > shown.length ? '<span class="kf-hint">+' + (list.length - shown.length) + ' more — add radicals or a stroke filter</span>' : '');
}

function kfResetRads() { KF.selectedRads.clear(); document.getElementById('kfStrokeSel').value = '0'; KF.strokeFilter = 0; kfApplyRadicals(); }

// ---------- search ----------
var kfSearchTimer = null;
function kfSearch(q) {
    clearTimeout(kfSearchTimer);
    kfSearchTimer = setTimeout(function () {
        kfLoadDict().then(function () { kfDoSearch(q.trim()); });
    }, 120);
}

function kfDoSearch(q) {
    var out = document.getElementById('kfSearchResults');
    if (!q) { out.innerHTML = '<span class="kf-hint">Type an English meaning ("water"), a romaji reading ("mizu"), or kana ("みず").</span>'; return; }
    var ql = q.toLowerCase();
    var kata = ql; // if user typed kana, normalize katakana -> hiragana for kun/on match
    var hira = q.replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); });
    var scored = [];
    for (var c in KF.dict) {
        var e = KF.dict[c];
        // direct kanji paste
        if (q.indexOf(c) !== -1) { scored.push([c, -1]); continue; }
        var score = null;
        var meanings = e[6];
        for (var i = 0; i < meanings.length; i++) {
            var m = meanings[i].toLowerCase();
            if (m === ql) { score = 0; break; }
            if (m.indexOf(ql) === 0) { score = Math.min(score == null ? 99 : score, 2); }
            else if (ql.length > 2 && m.indexOf(ql) !== -1) { score = Math.min(score == null ? 99 : score, 6); }
        }
        if (/^[a-z' -]+$/.test(ql)) {
            var blob = ' ' + e[7] + ' ';
            if (blob.indexOf(' ' + ql + ' ') !== -1) score = Math.min(score == null ? 99 : score, 1);
            else if (blob.indexOf(' ' + ql) !== -1) score = Math.min(score == null ? 99 : score, 4);
        }
        if (hira !== q || /^[ぁ-ゖー]+$/.test(q)) {
            var kunon = e[5].concat(e[4].map(function (k) { return k.replace(/[ァ-ヶ]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 0x60); }); }));
            for (var j = 0; j < kunon.length; j++) {
                var r = kunon[j].replace(/[.-]/g, '');
                if (r === hira) { score = Math.min(score == null ? 99 : score, 0); }
                else if (r.indexOf(hira) === 0) { score = Math.min(score == null ? 99 : score, 3); }
            }
        }
        if (score != null && score < 99) scored.push([c, score]);
    }
    scored.sort(function (a, b) { return a[1] - b[1] || (KF.dict[a[0]][3] || 9999) - (KF.dict[b[0]][3] || 9999); });
    var top = scored.slice(0, 60);
    if (!top.length) { out.innerHTML = '<span class="kf-hint">No kanji found for “' + esc(q) + '”. Try a simpler word or a reading.</span>'; return; }
    out.innerHTML = top.map(function (p) {
        var c = p[0];
        return '<button type="button" class="kf-cand" data-char="' + esc(c) + '" title="' + esc((KF.dict[c][6] || []).slice(0, 2).join(', ')) + '">' + esc(c) + '</button>';
    }).join('');
}

// ---------- output tray ----------
function kfAppendOutput(c) {
    var box = document.getElementById('kfOutput');
    box.value += c;
    document.getElementById('kfOutputBar').classList.add('has-content');
}
function kfCopyOutput() {
    var v = document.getElementById('kfOutput').value;
    if (v) kfCopyText(v);
}
function kfClearOutput() {
    document.getElementById('kfOutput').value = '';
    document.getElementById('kfOutputBar').classList.remove('has-content');
}
function kfCopyText(text) {
    function done() { var t = document.getElementById('copiedToast'); t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, 1500); }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done).catch(function () { kfFallbackCopy(text); done(); }); }
    else { kfFallbackCopy(text); done(); }
}
function kfFallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
}

// ---------- detail card ----------
function kfOpenDetail(c) {
    kfAppendOutput(c);
    kfPushHistory(c);
    var e = KF.dict[c];
    if (!e) return;
    var card = document.getElementById('kfDetail');
    var badges = '';
    if (e[0]) badges += '<span class="kf-badge">' + e[0] + ' strokes</span>';
    if (e[2]) badges += '<span class="kf-badge">JLPT N' + e[2] + '</span>';
    if (e[1]) badges += '<span class="kf-badge">Grade ' + e[1] + '</span>';
    if (e[3]) badges += '<span class="kf-badge">#' + e[3] + ' most used</span>';
    var rads = (KF.kanjiToRads[c] || []).map(function (r) { return '<button type="button" class="kf-rad kf-rad-mini" data-jumprad="' + esc(r) + '">' + esc(r) + '</button>'; }).join('');
    card.innerHTML =
        '<div class="kf-detail-head">' +
            '<div class="kf-detail-char" id="kfStroke"><span class="kf-glyph">' + esc(c) + '</span></div>' +
            '<div class="kf-detail-main">' +
                '<div class="kf-detail-meanings">' + esc(e[6].join(', ')) + '</div>' +
                (e[4].length ? '<div class="kf-readrow"><span class="kf-readlbl">On’yomi</span>' + e[4].map(function (r) { return '<span class="kf-read on">' + esc(r) + '</span>'; }).join('') + '</div>' : '') +
                (e[5].length ? '<div class="kf-readrow"><span class="kf-readlbl">Kun’yomi</span>' + e[5].map(function (r) { return '<span class="kf-read kun">' + esc(r) + '</span>'; }).join('') + '</div>' : '') +
                '<div class="kf-badges">' + badges + '</div>' +
                (rads ? '<div class="kf-readrow"><span class="kf-readlbl">Radicals</span>' + rads + '</div>' : '') +
            '</div>' +
        '</div>' +
        '<div class="kf-detail-actions">' +
            '<button type="button" class="kf-btn" data-copychar="' + esc(c) + '">Copy ' + esc(c) + '</button>' +
            '<button type="button" class="kf-btn" id="kfAnimBtn" data-anim="' + esc(c) + '">▶ Stroke order</button>' +
            '<a class="kf-btn" href="/kanji-to-hiragana-converter.html">Kanji → Hiragana</a>' +
            '<a class="kf-btn" href="/converter/kanji-to-katakana">Kanji → Katakana</a>' +
        '</div>' +
        '<div class="kf-examples" id="kfExamples"><span class="kf-hint">Loading example words…</span></div>';
    card.hidden = false;
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    kfRenderExamples(c);
}

function kfRenderExamples(c) {
    kfLoadJmdict().then(function () {
        var box = document.getElementById('kfExamples');
        if (!box) return;
        var hits = [];
        for (var i = 0; i < KF.jmdictKeys.length; i++) {
            var w = KF.jmdictKeys[i];
            if (w.indexOf(c) !== -1) {
                var entry = KF.jmdict[w];
                hits.push([w, entry]);
                if (hits.length > 200) break;
            }
        }
        hits.sort(function (a, b) { return (a[1].f || 99999) - (b[1].f || 99999); });
        var top = hits.slice(0, 6);
        if (!top.length) { box.innerHTML = ''; return; }
        box.innerHTML = '<div class="kf-ex-title">Example words with ' + esc(c) + '</div>' + top.map(function (h) {
            return '<div class="kf-ex"><span class="kf-ex-word">' + esc(h[0]) + '</span><span class="kf-ex-read">' + esc(h[1].r || '') + '</span><span class="kf-ex-gloss">' + esc((h[1].g || []).slice(0, 2).join('; ')) + '</span></div>';
        }).join('');
    });
}

// ---------- stroke order animation (KanjiVG via jsDelivr, on demand) ----------
function kfAnimate(c) {
    var host = document.getElementById('kfStroke');
    var code = c.codePointAt(0).toString(16).padStart(5, '0');
    fetch('https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/' + code + '.svg')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (svg) {
            var doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
            var el = doc.documentElement;
            var numbers = el.querySelector('[id*="StrokeNumbers"]');
            if (numbers) numbers.remove();
            var paths = el.querySelectorAll('path');
            var delay = 0;
            paths.forEach(function (p) {
                var len = 100;
                try { len = p.getTotalLength ? 100 : 100; } catch (e) {}
                p.style.stroke = '#d1443c';
                p.style.strokeWidth = '4';
                p.style.fill = 'none';
                p.style.strokeDasharray = '400';
                p.style.strokeDashoffset = '400';
                p.style.animation = 'kfDraw 0.6s ease forwards';
                p.style.animationDelay = delay + 's';
                delay += 0.45;
            });
            el.setAttribute('class', 'kf-vg');
            host.innerHTML = '';
            host.appendChild(document.importNode(el, true));
        })
        .catch(function () {
            host.innerHTML = '<span class="kf-glyph">' + esc(c) + '</span>';
        });
}

// ---------- history ----------
function kfPushHistory(c) {
    try {
        KF.history = JSON.parse(localStorage.getItem('kf-history') || '[]');
    } catch (e) { KF.history = []; }
    KF.history = KF.history.filter(function (x) { return x !== c; });
    KF.history.unshift(c);
    KF.history = KF.history.slice(0, 24);
    try { localStorage.setItem('kf-history', JSON.stringify(KF.history)); } catch (e) {}
    kfRenderHistory();
}
function kfRenderHistory() {
    var box = document.getElementById('kfHistory');
    if (!box) return;
    try { KF.history = JSON.parse(localStorage.getItem('kf-history') || '[]'); } catch (e) { KF.history = []; }
    if (!KF.history.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = '<span class="kf-readlbl">Recent</span>' + KF.history.map(function (c) {
        return '<button type="button" class="kf-cand kf-cand-mini" data-char="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
}

// ---------- boot ----------
document.addEventListener('DOMContentLoaded', function () {
    // tabs
    document.querySelectorAll('.kf-tab').forEach(function (b) {
        b.addEventListener('click', function () { kfTab(b.dataset.tab); });
    });
    // canvas controls
    document.getElementById('kfUndoBtn').addEventListener('click', kfUndo);
    document.getElementById('kfClearBtn').addEventListener('click', kfClearCanvas);
    // engine loads immediately (deferred script) so first stroke is instant
    kfLoadEngine();
    document.getElementById('kfCanvas').addEventListener('pointerdown', kfLoadEngine, { once: false });
    // radical stroke filter
    document.getElementById('kfStrokeSel').addEventListener('change', function () {
        KF.strokeFilter = Number(this.value); kfApplyRadicals();
    });
    document.getElementById('kfRadReset').addEventListener('click', kfResetRads);
    // search
    document.getElementById('kfSearchInput').addEventListener('input', function () { kfSearch(this.value); });
    // output tray
    document.getElementById('kfCopyOut').addEventListener('click', kfCopyOutput);
    document.getElementById('kfClearOut').addEventListener('click', kfClearOutput);
    // delegated clicks: candidates, radicals, detail actions
    document.addEventListener('click', function (ev) {
        var t = ev.target.closest && ev.target.closest('[data-char], .kf-rad[data-rad], [data-copychar], [data-anim], [data-jumprad]');
        if (!t) return;
        if (t.dataset.char) { kfLoadDict().then(function () { kfOpenDetail(t.dataset.char); }); }
        else if (t.dataset.rad) { kfToggleRad(t.dataset.rad); }
        else if (t.dataset.copychar) { kfCopyText(t.dataset.copychar); }
        else if (t.dataset.anim) { kfAnimate(t.dataset.anim); }
        else if (t.dataset.jumprad) { kfTab('radicals'); KF.selectedRads = new Set([t.dataset.jumprad]); kfLoadDict().then(kfRenderRadicals); }
    });
    kfRenderHistory();
});

// FAQ toggle (shared behavior with other tool pages)
function toggleFaq(el) {
    var item = el.parentElement;
    var isOpen = item.classList.toggle('open');
    el.setAttribute('aria-expanded', isOpen);
    var answer = el.nextElementSibling;
    if (answer) answer.setAttribute('aria-hidden', !isOpen);
}

// Mobile navigation toggle
function toggleMobileNav() {
    var nav = document.querySelector('.header-nav');
    var btn = document.querySelector('.mobile-menu-btn');
    var isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
}
