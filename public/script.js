// ========================================
// JAPANESE NAME CONVERSION ENGINE
// ========================================

// Phoneme-to-Katakana mapping
const katakanaMap = {
    'a': 'ア', 'i': 'イ', 'u': 'ウ', 'e': 'エ', 'o': 'オ',
    'ka': 'カ', 'ki': 'キ', 'ku': 'ク', 'ke': 'ケ', 'ko': 'コ',
    'sa': 'サ', 'si': 'シ', 'su': 'ス', 'se': 'セ', 'so': 'ソ',
    'ta': 'タ', 'chi': 'チ', 'tsu': 'ツ', 'te': 'テ', 'to': 'ト',
    'na': 'ナ', 'ni': 'ニ', 'nu': 'ヌ', 'ne': 'ネ', 'no': 'ノ',
    'ha': 'ハ', 'hi': 'ヒ', 'fu': 'フ', 'he': 'ヘ', 'ho': 'ホ',
    'ma': 'マ', 'mi': 'ミ', 'mu': 'ム', 'me': 'メ', 'mo': 'モ',
    'ya': 'ヤ', 'yu': 'ユ', 'yo': 'ヨ',
    'ra': 'ラ', 'ri': 'リ', 'ru': 'ル', 're': 'レ', 'ro': 'ロ',
    'wa': 'ワ', 'wo': 'ヲ', 'n': 'ン',
    'ga': 'ガ', 'gi': 'ギ', 'gu': 'グ', 'ge': 'ゲ', 'go': 'ゴ',
    'za': 'ザ', 'ji': 'ジ', 'zu': 'ズ', 'ze': 'ゼ', 'zo': 'ゾ',
    'da': 'ダ', 'di': 'ディ', 'du': 'ドゥ', 'de': 'デ', 'do': 'ド',
    'ba': 'バ', 'bi': 'ビ', 'bu': 'ブ', 'be': 'ベ', 'bo': 'ボ',
    'pa': 'パ', 'pi': 'ピ', 'pu': 'プ', 'pe': 'ペ', 'po': 'ポ',
    'kya': 'キャ', 'kyu': 'キュ', 'kyo': 'キョ',
    'sha': 'シャ', 'shu': 'シュ', 'sho': 'ショ',
    'cha': 'チャ', 'chu': 'チュ', 'cho': 'チョ',
    'nya': 'ニャ', 'nyu': 'ニュ', 'nyo': 'ニョ',
    'hya': 'ヒャ', 'hyu': 'ヒュ', 'hyo': 'ヒョ',
    'mya': 'ミャ', 'myu': 'ミュ', 'myo': 'ミョ',
    'rya': 'リャ', 'ryu': 'リュ', 'ryo': 'リョ',
    'gya': 'ギャ', 'gyu': 'ギュ', 'gyo': 'ギョ',
    'ja': 'ジャ', 'ju': 'ジュ', 'jo': 'ジョ',
    'bya': 'ビャ', 'byu': 'ビュ', 'byo': 'ビョ',
    'pya': 'ピャ', 'pyu': 'ピュ', 'pyo': 'ピョ',
    // Extended katakana for foreign sounds
    'ti': 'ティ', 'fa': 'ファ', 'fi': 'フィ', 'fe': 'フェ', 'fo': 'フォ',
    'wi': 'ウィ', 'we': 'ウェ', 'va': 'ヴァ', 'vi': 'ヴィ', 'vu': 'ヴ',
    've': 'ヴェ', 'vo': 'ヴォ', 'thi': 'ティ', 'she': 'シェ',
    'je': 'ジェ', 'che': 'チェ',
};

// Common name database
const nameDatabase = {
    'alexander': { katakana: 'アレクサンダー', romaji: 'Arekusandā' },
    'emma': { katakana: 'エマ', romaji: 'Ema' },
    'james': { katakana: 'ジェームズ', romaji: 'Jēmuzu' },
    'michael': { katakana: 'マイケル', romaji: 'Maikeru' },
    'jennifer': { katakana: 'ジェニファー', romaji: 'Jenifā' },
    'david': { katakana: 'デイビッド', romaji: 'Deibiddo' },
    'sarah': { katakana: 'サラ', romaji: 'Sara' },
    'john': { katakana: 'ジョン', romaji: 'Jon' },
    'jessica': { katakana: 'ジェシカ', romaji: 'Jeshika' },
    'robert': { katakana: 'ロバート', romaji: 'Robāto' },
    'william': { katakana: 'ウィリアム', romaji: 'Wiriamu' },
    'amanda': { katakana: 'アマンダ', romaji: 'Amanda' },
    'christopher': { katakana: 'クリストファー', romaji: 'Kurisutofā' },
    'melissa': { katakana: 'メリッサ', romaji: 'Merissa' },
    'jason': { katakana: 'ジェイソン', romaji: 'Jeison' },
    'sophia': { katakana: 'ソフィア', romaji: 'Sofia' },
    'olivia': { katakana: 'オリビア', romaji: 'Oribia' },
    'daniel': { katakana: 'ダニエル', romaji: 'Danieru' },
    'matthew': { katakana: 'マシュー', romaji: 'Mashū' },
    'elizabeth': { katakana: 'エリザベス', romaji: 'Erizabesu' },
    'andrew': { katakana: 'アンドリュー', romaji: 'Andoryū' },
    'ashley': { katakana: 'アシュリー', romaji: 'Ashurī' },
    'thomas': { katakana: 'トーマス', romaji: 'Tōmasu' },
    'richard': { katakana: 'リチャード', romaji: 'Richādo' },
    'charles': { katakana: 'チャールズ', romaji: 'Chāruzu' },
    'joseph': { katakana: 'ジョセフ', romaji: 'Josefu' },
    'mark': { katakana: 'マーク', romaji: 'Māku' },
    'brian': { katakana: 'ブライアン', romaji: 'Buraian' },
    'kevin': { katakana: 'ケビン', romaji: 'Kebin' },
    'steven': { katakana: 'スティーブン', romaji: 'Sutībun' },
    'emily': { katakana: 'エミリー', romaji: 'Emirī' },
    'anna': { katakana: 'アンナ', romaji: 'Anna' },
    'maria': { katakana: 'マリア', romaji: 'Maria' },
    'lisa': { katakana: 'リサ', romaji: 'Risa' },
    'nicole': { katakana: 'ニコール', romaji: 'Nikōru' },
    'victoria': { katakana: 'ビクトリア', romaji: 'Bikutoria' },
    'benjamin': { katakana: 'ベンジャミン', romaji: 'Benjamin' },
    'samuel': { katakana: 'サミュエル', romaji: 'Samyueru' },
    'henry': { katakana: 'ヘンリー', romaji: 'Henrī' },
    'george': { katakana: 'ジョージ', romaji: 'Jōji' },
    'ryan': { katakana: 'ライアン', romaji: 'Raian' },
    'nathan': { katakana: 'ネイサン', romaji: 'Neisan' },
    'adam': { katakana: 'アダム', romaji: 'Adamu' },
    'peter': { katakana: 'ピーター', romaji: 'Pītā' },
    'jack': { katakana: 'ジャック', romaji: 'Jakku' },
    'oliver': { katakana: 'オリバー', romaji: 'Oribā' },
    'liam': { katakana: 'リアム', romaji: 'Riamu' },
    'noah': { katakana: 'ノア', romaji: 'Noa' },
    'ethan': { katakana: 'イーサン', romaji: 'Īsan' },
    'lucas': { katakana: 'ルーカス', romaji: 'Rūkasu' },
    'charlotte': { katakana: 'シャーロット', romaji: 'Shārotto' },
    'isabella': { katakana: 'イザベラ', romaji: 'Izabera' },
    'mia': { katakana: 'ミア', romaji: 'Mia' },
    'grace': { katakana: 'グレース', romaji: 'Gurēsu' },
    'chloe': { katakana: 'クロエ', romaji: 'Kuroe' },
    'luna': { katakana: 'ルナ', romaji: 'Runa' },
    'alice': { katakana: 'アリス', romaji: 'Arisu' },
    'max': { katakana: 'マックス', romaji: 'Makkusu' },
    'leo': { katakana: 'レオ', romaji: 'Reo' },
    'kalraj': { katakana: 'カルラジ', romaji: 'Karuraji' },
};

// Katakana-to-Hiragana offset
function katakanaToHiragana(katakana) {
    let result = '';
    for (let char of katakana) {
        const code = char.charCodeAt(0);
        if (code >= 0x30A1 && code <= 0x30F6) {
            result += String.fromCharCode(code - 0x60);
        } else if (char === 'ー') {
            result += 'ー';
        } else {
            result += char;
        }
    }
    return result;
}

// Simple kanji ateji mapping
const kanjiAteji = {
    'a': '亜', 'i': '伊', 'u': '宇', 'e': '恵', 'o': '央',
    'ka': '花', 'ki': '希', 'ku': '久', 'ke': '景', 'ko': '光',
    'sa': '咲', 'si': '志', 'su': '寿', 'se': '世', 'so': '想',
    'ta': '太', 'chi': '智', 'tsu': '津', 'te': '天', 'to': '翔',
    'na': '奈', 'ni': '仁', 'nu': '沼', 'ne': '音', 'no': '乃',
    'ha': '葉', 'hi': '陽', 'fu': '風', 'he': '平', 'ho': '穂',
    'ma': '真', 'mi': '美', 'mu': '夢', 'me': '芽', 'mo': '望',
    'ya': '也', 'yu': '悠', 'yo': '洋',
    'ra': '良', 'ri': '理', 'ru': '流', 're': '麗', 'ro': '路',
    'wa': '和', 'n': '音',
    'ga': '雅', 'gi': '義', 'gu': '紅', 'ge': '月', 'go': '悟',
    'za': '座', 'ji': '慈', 'zu': '瑞', 'ze': '善', 'zo': '蔵',
    'da': '大', 'de': '出', 'do': '道',
    'ba': '馬', 'bi': '美', 'bu': '武', 'be': '部', 'bo': '望',
    'pa': '波', 'pi': '比', 'pu': '富', 'pe': '辺', 'po': '歩',
    'sha': '紗', 'shi': '詩', 'shu': '秀', 'sho': '翔',
    'cha': '茶', 'chu': '宙', 'cho': '蝶',
    'ja': '蛇', 'ju': '樹', 'jo': '城',
    'kya': '京', 'kyu': '宮', 'kyo': '京',
    'rya': '龍', 'ryu': '龍', 'ryo': '涼',
    'fa': '花', 'fi': '妃', 'fe': '妃', 'fo': '鳳',
};

// English-to-romaji phonetic conversion
function englishToRomaji(name) {
    name = name.toLowerCase().trim();

    // Check database
    if (nameDatabase[name]) return nameDatabase[name].romaji.toLowerCase();

    // Substitution rules (order matters — multi-char digraphs first)
    let romaji = name;
    const rules = [
        [/tch/g, 'cch'],
        [/ph/g, 'f'], [/th/g, 's'], [/ck/g, 'kk'],
        [/wh/g, 'w'], [/wr/g, 'r'], [/kn/g, 'n'],
        [/ght/g, 'to'], [/tion/g, 'shon'], [/sion/g, 'shon'],
        [/qu/g, 'kw'], [/x/g, 'kusu'], [/c(?=[eiy])/g, 's'],
        [/c/g, 'k'], [/l/g, 'r'], [/v/g, 'b'],
        [/ee/g, 'ii'], [/oo/g, 'uu'],
        [/ey$/g, 'ei'], [/ay$/g, 'ei'], [/ly$/g, 'rii'],
        [/y$/g, 'i'], [/er$/g, 'aa'], [/ar$/g, 'aa'],
        [/or$/g, 'oo'], [/le$/g, 'ru'], [/ce$/g, 'su'],
        [/se$/g, 'su'], [/ge$/g, 'ji'], [/ne$/g, 'n'],
        [/te$/g, 'to'], [/ie$/g, 'ii'],
        [/ll/g, 'rr'],
    ];

    for (const [pattern, replacement] of rules) {
        romaji = romaji.replace(pattern, replacement);
    }

    return romaji;
}

// Romaji to katakana
function romajiToKatakana(romaji) {
    let result = '';
    let i = 0;
    romaji = romaji.toLowerCase();

    while (i < romaji.length) {
        // Double consonant = ッ (sokuon)
        if (i + 1 < romaji.length && romaji[i] === romaji[i + 1] && !'aiueon'.includes(romaji[i])) {
            result += 'ッ';
            i++;
            continue;
        }

        let matched = false;
        // Try 3-char, 2-char, 1-char matches
        for (let len = 3; len >= 1; len--) {
            const chunk = romaji.substring(i, i + len);
            if (katakanaMap[chunk]) {
                result += katakanaMap[chunk];
                i += len;
                matched = true;
                break;
            }
        }

        if (!matched) {
            // Skip unrecognized characters
            i++;
        }
    }
    return result;
}

// Romaji to Kanji (ateji)
function romajiToKanji(romaji) {
    let result = '';
    let i = 0;
    // Strip macrons (long-vowel marks) since kanjiAteji keys use base vowels.
    // Without this, DB romaji like "Jēmuzu" loses the macron-bearing mora.
    romaji = romaji.toLowerCase()
        .replace(/ā/g, 'a').replace(/ē/g, 'e').replace(/ī/g, 'i')
        .replace(/ō/g, 'o').replace(/ū/g, 'u');

    while (i < romaji.length) {
        let matched = false;
        for (let len = 3; len >= 1; len--) {
            const chunk = romaji.substring(i, i + len);
            if (kanjiAteji[chunk]) {
                result += kanjiAteji[chunk];
                i += len;
                matched = true;
                break;
            }
        }
        if (!matched) i++;
    }
    return result;
}

// Main conversion function
function convertName() {
    const input = document.getElementById('nameInput').value.trim();
    if (!input) return;

    // Never write #?q= hashes to the URL — they surface in GSC/GA as fake
    // page variants of the homepage. If the visitor arrived via a legacy
    // #?q= share link, clear the stale hash without adding a history entry.
    if (window.location.hash.startsWith('#?q=')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    // Track conversions as a custom event, not a page_view (page_views here
    // inflated homepage counts and split them across hash pseudo-pages).
    gtag('event', 'name_converted', { name_input: input });

    const nameLower = input.toLowerCase();
    let katakana, romaji, hiragana, kanji;

    if (nameDatabase[nameLower]) {
        katakana = nameDatabase[nameLower].katakana;
        romaji = nameDatabase[nameLower].romaji;
    } else {
        const romajiRaw = englishToRomaji(input);
        katakana = romajiToKatakana(romajiRaw);
        romaji = romajiRaw.charAt(0).toUpperCase() + romajiRaw.slice(1);
    }

    hiragana = katakanaToHiragana(katakana);
    kanji = romajiToKanji(englishToRomaji(input));

    // Display results
    document.getElementById('katakanaOutput').textContent = katakana;
    document.getElementById('katakanaRomaji').textContent = romaji;
    document.getElementById('hiraganaOutput').textContent = hiragana;
    document.getElementById('hiraganaRomaji').textContent = romaji;
    document.getElementById('kanjiOutput').textContent = kanji || '—';
    document.getElementById('kanjiRomaji').textContent = kanji ? romaji + ' (ateji)' : '';
    document.getElementById('romajiOutput').textContent = romaji;

    const resultsArea = document.getElementById('resultsArea');
    resultsArea.classList.remove('is-placeholder');
    resultsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Update visibility based on toggles
    updateResultVisibility();
}

// Voice cache — populated on load and updated asynchronously (fixes iOS delay)
let cachedVoices = [];
if ('speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => {
        cachedVoices = window.speechSynthesis.getVoices();
    });
}

function speakResult(elementId, lang, btnId) {
    if (!('speechSynthesis' in window)) {
        const toast = document.getElementById('ttsToast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
        return;
    }

    const text = document.getElementById(elementId).textContent.trim();
    if (!text) return;

    window.speechSynthesis.cancel();

    const btn = document.getElementById(btnId);

    function doSpeak(voices) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        if (lang === 'ja-JP') {
            const voice =
                voices.find(v => v.lang === 'ja-JP' && v.name.includes('Google')) ||
                voices.find(v => v.lang === 'ja-JP' && (v.name.includes('Kyoko') || v.name.includes('Otoya'))) ||
                voices.find(v => v.lang === 'ja-JP' && !v.localService) ||
                voices.find(v => v.lang.startsWith('ja'));
            if (voice) utterance.voice = voice;
        }

        if (btn) btn.classList.add('speaking');
        utterance.onend = () => { if (btn) btn.classList.remove('speaking'); };
        utterance.onerror = () => { if (btn) btn.classList.remove('speaking'); };

        window.speechSynthesis.speak(utterance);
    }

    if (cachedVoices.length > 0) {
        doSpeak(cachedVoices);
    } else {
        setTimeout(() => {
            cachedVoices = window.speechSynthesis.getVoices();
            doSpeak(cachedVoices);
        }, 250);
    }
}

// Copy to clipboard
function copyResult(elementId) {
    const text = document.getElementById(elementId).textContent;
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
    function showCopiedToast() {
        const toast = document.getElementById('copiedToast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1500);
    }
}

// Script toggle handling (exclude Clear button)
document.querySelectorAll('.script-toggle:not(.clear-toggle)').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        btn.setAttribute('aria-pressed', btn.classList.contains('active'));
        updateResultVisibility();
    });
});

function updateResultVisibility() {
    const toggles = document.querySelectorAll('.script-toggle');
    const scriptMap = {
        'katakana': 'resultKatakana',
        'hiragana': 'resultHiragana',
        'kanji': 'resultKanji',
        'romaji': 'resultRomaji'
    };
    toggles.forEach(t => {
        const script = t.dataset.script;
        const el = document.getElementById(scriptMap[script]);
        if (el) el.style.display = t.classList.contains('active') ? 'flex' : 'none';
    });
}

// Enter key support
document.getElementById('nameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') convertName();
});

// Clear name input and results
function clearName() {
    document.getElementById('nameInput').value = '';
    document.getElementById('katakanaOutput').textContent = 'エマ';
    document.getElementById('katakanaRomaji').textContent = 'Ema';
    document.getElementById('hiraganaOutput').textContent = 'えま';
    document.getElementById('hiraganaRomaji').textContent = 'Ema';
    document.getElementById('kanjiOutput').textContent = '恵真';
    document.getElementById('kanjiRomaji').textContent = 'Ema (ateji)';
    document.getElementById('romajiOutput').textContent = 'Ema';
    document.getElementById('resultsArea').classList.add('is-placeholder');
    // Reset any legacy URL hash without adding a history entry
    history.replaceState(null, '', window.location.pathname + window.location.search);
}

// FAQ toggle
function toggleFaq(el) {
    const item = el.parentElement;
    const isOpen = item.classList.toggle('open');
    el.setAttribute('aria-expanded', isOpen);
    const answer = el.nextElementSibling;
    if (answer) answer.setAttribute('aria-hidden', !isOpen);
}

// Populate popular names - Female
const popularFemaleNames = [
    { en: 'Emma', jp: 'エマ' },
    { en: 'Sophia', jp: 'ソフィア' },
    { en: 'Charlotte', jp: 'シャーロット' },
    { en: 'Isabella', jp: 'イザベラ' },
    { en: 'Mia', jp: 'ミア' },
    { en: 'Emily', jp: 'エミリー' },
    { en: 'Grace', jp: 'グレース' },
    { en: 'Luna', jp: 'ルナ' },
];

// Populate popular names - Male
const popularMaleNames = [
    { en: 'Liam', jp: 'リアム' },
    { en: 'Oliver', jp: 'オリバー' },
    { en: 'James', jp: 'ジェームズ' },
    { en: 'Alexander', jp: 'アレクサンダー' },
    { en: 'William', jp: 'ウィリアム' },
    { en: 'Noah', jp: 'ノア' },
    { en: 'Daniel', jp: 'ダニエル' },
    { en: 'Benjamin', jp: 'ベンジャミン' },
];

// Mobile navigation toggle
function toggleMobileNav() {
    const nav = document.querySelector('.header-nav');
    const btn = document.querySelector('.mobile-menu-btn');
    const isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
}

// Close mobile menu when clicking a nav link
document.querySelectorAll('.header-nav a').forEach(link => {
    link.addEventListener('click', () => {
        const nav = document.querySelector('.header-nav');
        const btn = document.querySelector('.mobile-menu-btn');
        if (nav.classList.contains('open')) {
            nav.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
});

// Populate popular name chips
function createNameChip(name, grid) {
    const chip = document.createElement('button');
    chip.className = 'name-chip';
    chip.setAttribute('aria-label', name.en + ' — ' + name.jp);
    chip.textContent = name.en;
    const jpSpan = document.createElement('span');
    jpSpan.className = 'chip-jp';
    jpSpan.textContent = name.jp;
    chip.appendChild(jpSpan);
    chip.addEventListener('click', () => {
        document.getElementById('nameInput').value = name.en;
        convertName();
        document.getElementById('converter').scrollIntoView({ behavior: 'smooth' });
    });
    grid.appendChild(chip);
}

const femaleNamesGrid = document.getElementById('popularFemaleNames');
popularFemaleNames.forEach(n => createNameChip(n, femaleNamesGrid));

const maleNamesGrid = document.getElementById('popularMaleNames');
popularMaleNames.forEach(n => createNameChip(n, maleNamesGrid));

// Auto-convert if URL has #?q=Name on page load
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    if (hash.startsWith('#?q=')) {
        const name = decodeURIComponent(hash.replace('#?q=', ''));
        document.getElementById('nameInput').value = name;
        convertName();
    }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    const hash = window.location.hash;
    if (hash.startsWith('#?q=')) {
        const name = decodeURIComponent(hash.replace('#?q=', ''));
        document.getElementById('nameInput').value = name;
        convertName();
    }
});
