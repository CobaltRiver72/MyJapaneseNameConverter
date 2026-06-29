import {
  convertKana,
  getCharacterRows,
  getKanaCounts,
  toHiragana,
  toKatakana,
} from './hiragana-katakana-core.js';

let currentMode = 'katakana';
let lastConvertedText = '';

function escapeHtml(value) {
  if (value == null) return '';
  return String(value).replace(/[&<>"']/g, function(char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function plainTextCopyFallback(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try { document.execCommand('copy'); showCopiedToast(); } catch (error) {}
  document.body.removeChild(textarea);
}

function copyPlainText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(showCopiedToast).catch(function() {
      plainTextCopyFallback(text);
    });
  } else {
    plainTextCopyFallback(text);
  }
}

function tableRawText(rows) {
  const lines = ['Original\tHiragana\tKatakana\tType'];
  rows.forEach(function(row) {
    lines.push([row.original, row.hiragana, row.katakana, row.type].join('\t'));
  });
  return lines.join('\n');
}

function renderFlatPanel(name, label, text) {
  return '<div class="panel" data-panel="' + escapeAttr(name) + '" data-raw="' + escapeAttr(text) + '">' +
    '<h2 class="panel-heading">' + escapeHtml(label) + '</h2>' +
    '<div class="panel-tools">' +
      '<button type="button" class="copy-btn">Copy</button>' +
      '<button type="button" class="raw-btn" aria-pressed="false">Raw</button>' +
    '</div>' +
    '<div class="flat-line kana">' + escapeHtml(text) + '</div>' +
    '<pre class="raw-view">' + escapeHtml(text) + '</pre>' +
  '</div>';
}

function renderComparison(input) {
  const katakana = toKatakana(input);
  const hiragana = toHiragana(input);
  const raw = 'Original\n' + input + '\n\nKatakana\n' + katakana + '\n\nHiragana\n' + hiragana;

  return '<div class="panel comparison-panel" data-panel="comparison" data-raw="' + escapeAttr(raw) + '">' +
    '<h2 class="panel-heading">Script Comparison</h2>' +
    '<div class="panel-tools">' +
      '<button type="button" class="copy-btn">Copy</button>' +
      '<button type="button" class="raw-btn" aria-pressed="false">Raw</button>' +
    '</div>' +
    '<div class="kana-comparison">' +
      '<div><span>Original</span><strong>' + escapeHtml(input) + '</strong></div>' +
      '<div><span>Katakana</span><strong>' + escapeHtml(katakana) + '</strong></div>' +
      '<div><span>Hiragana</span><strong>' + escapeHtml(hiragana) + '</strong></div>' +
    '</div>' +
    '<pre class="raw-view">' + escapeHtml(raw) + '</pre>' +
  '</div>';
}

function renderTable(input) {
  const rows = getCharacterRows(input);
  const raw = tableRawText(rows);
  let html = '<div class="panel" data-panel="table" data-raw="' + escapeAttr(raw) + '">';
  html += '<h2 class="table-heading">Kana Character Breakdown</h2>';
  html += '<div class="panel-tools">' +
    '<button type="button" class="copy-btn">Copy</button>' +
    '<button type="button" class="raw-btn" aria-pressed="false">Raw</button>' +
  '</div>';
  html += '<div class="breakdown-wrap"><table class="breakdown-table kana-breakdown-table">';
  html += '<thead><tr><th>Original</th><th>Hiragana</th><th>Katakana</th><th>Type</th></tr></thead><tbody>';

  rows.forEach(function(row) {
    html += '<tr>';
    html += '<td class="word">' + escapeHtml(row.original) + '</td>';
    html += '<td class="reading">' + escapeHtml(row.hiragana) + '</td>';
    html += '<td class="word">' + escapeHtml(row.katakana) + '</td>';
    html += '<td><span class="script-badge">' + escapeHtml(row.type) + '</span></td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  html += '<pre class="raw-view">' + escapeHtml(raw) + '</pre>';
  html += '</div>';
  return html;
}

function renderSummary(input) {
  const counts = getKanaCounts(input);
  return '<div class="kana-summary" aria-label="Input script summary">' +
    '<span><strong>' + counts.total + '</strong> total</span>' +
    '<span><strong>' + counts.hiragana + '</strong> hiragana</span>' +
    '<span><strong>' + counts.katakana + '</strong> katakana</span>' +
    '<span><strong>' + counts.other + '</strong> other</span>' +
  '</div>';
}

function setReadyState() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const convertBtn = document.getElementById('convertBtn');

  statusDot.className = 'status-dot ready';
  statusText.textContent = 'Ready';
  convertBtn.disabled = false;
}

function convertKanaText() {
  const input = document.getElementById('kanaInput').value.trim();
  if (!input) return;

  lastConvertedText = input;

  const resultsArea = document.getElementById('resultsArea');
  const resultText = document.getElementById('resultText');
  const resultModeLabel = document.getElementById('resultModeLabel');
  const loadingOverlay = document.getElementById('resultLoading');

  resultsArea.classList.add('visible');
  loadingOverlay.classList.add('active');
  resultText.className = 'result-text';

  const converted = convertKana(input, currentMode);
  let html = renderSummary(input);
  let label = 'Katakana Output';

  switch (currentMode) {
    case 'hiragana':
      html += renderFlatPanel('hiragana', 'Hiragana Output', converted);
      label = 'Hiragana Output';
      break;
    case 'spaced':
      html += renderFlatPanel('spaced', 'Spaced Katakana Output', converted);
      label = 'Spaced Katakana';
      break;
    case 'comparison':
      html += renderComparison(input);
      label = 'Script Comparison';
      break;
    case 'table':
      html += renderFlatPanel('katakana', 'Katakana Output', toKatakana(input));
      html += renderTable(input);
      label = 'Character Table';
      break;
    case 'katakana':
    default:
      html += renderFlatPanel('katakana', 'Katakana Output', converted);
      label = 'Katakana Output';
  }

  resultText.innerHTML = html;
  resultModeLabel.textContent = label;
  loadingOverlay.classList.remove('active');
  resultsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearAll() {
  document.getElementById('kanaInput').value = '';
  document.getElementById('charCount').textContent = '0';
  document.getElementById('resultsArea').classList.remove('visible');
  document.getElementById('resultText').textContent = '';
  lastConvertedText = '';
}

function copyResult() {
  const resultText = document.getElementById('resultText');
  const text = resultText.innerText || resultText.textContent || '';
  copyPlainText(text);
}

function showCopiedToast() {
  const toast = document.getElementById('copiedToast');
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
  }, 1500);
}

function speakText() {
  if (!('speechSynthesis' in window)) return;

  const input = document.getElementById('kanaInput').value.trim();
  if (!input) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(input);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;

  const voices = window.speechSynthesis.getVoices();
  const jpVoice = voices.find(function(voice) {
    return voice.lang.startsWith('ja');
  });
  if (jpVoice) utterance.voice = jpVoice;

  window.speechSynthesis.speak(utterance);
}

function tryExample(text) {
  document.getElementById('kanaInput').value = text;
  document.getElementById('charCount').textContent = Array.from(text).length;
  document.getElementById('converter').scrollIntoView({ behavior: 'smooth' });
  convertKanaText();
}

function toggleFaq(el) {
  const item = el.parentElement;
  const isOpen = item.classList.toggle('open');
  el.setAttribute('aria-expanded', isOpen);
  const answer = el.nextElementSibling;
  if (answer) answer.setAttribute('aria-hidden', !isOpen);
}

function toggleMobileNav() {
  const nav = document.querySelector('.header-nav');
  const btn = document.querySelector('.mobile-menu-btn');
  const isOpen = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen);
}

document.getElementById('kanaInput').addEventListener('input', function() {
  document.getElementById('charCount').textContent = Array.from(this.value).length;
});

document.getElementById('kanaInput').addEventListener('keydown', function(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    convertKanaText();
  }
});

document.querySelectorAll('.mode-toggle').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.mode-toggle').forEach(function(otherBtn) {
      otherBtn.classList.remove('active');
      otherBtn.setAttribute('aria-pressed', 'false');
    });

    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    currentMode = btn.dataset.mode;

    if (lastConvertedText) {
      convertKanaText();
    }
  });
});

document.getElementById('resultText').addEventListener('click', function(event) {
  const copyBtn = event.target.closest && event.target.closest('.copy-btn');
  if (copyBtn) {
    const panel = copyBtn.closest('.panel');
    if (panel) copyPlainText(panel.dataset.raw || '');
    return;
  }

  const rawBtn = event.target.closest && event.target.closest('.raw-btn');
  if (rawBtn) {
    const panel = rawBtn.closest('.panel');
    if (panel) {
      const isRaw = panel.classList.toggle('raw-mode');
      rawBtn.setAttribute('aria-pressed', String(isRaw));
    }
  }
});

setReadyState();

window.convertKanaText = convertKanaText;
window.clearAll = clearAll;
window.copyResult = copyResult;
window.speakText = speakText;
window.tryExample = tryExample;
window.toggleFaq = toggleFaq;
window.toggleMobileNav = toggleMobileNav;
