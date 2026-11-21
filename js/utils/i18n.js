/* ═══════════════ i18n ═══════════════ */
let currentLang = 'es';
let strings = {};

export async function initI18n(lang = null) {
  const stored = localStorage.getItem('galaxia-lang');
  const browser = (navigator.language || 'es').slice(0, 2);
  currentLang = lang || stored || (['es', 'en'].includes(browser) ? browser : 'es');

  try {
    const res = await fetch(`js/i18n/${currentLang}.json`);
    if (!res.ok) throw new Error('i18n fetch failed');
    strings = await res.json();
  } catch (e) {
    strings = {};
    console.warn('i18n: usando fallback', e);
  }
  document.documentElement.lang = currentLang;
  return currentLang;
}

export function t(key, fallback = '') {
  return strings[key] ?? fallback ?? key;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (!['es', 'en'].includes(lang)) return;
  localStorage.setItem('galaxia-lang', lang);
  location.reload();
}
