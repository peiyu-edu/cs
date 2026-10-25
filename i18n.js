const languageKey = 'peiyu-cs-language';
const validLanguage = value => value === 'en' || value === 'zh';
let language = 'zh';

// Explicit shared links win; otherwise keep the learner's previous choice.
if (typeof window !== 'undefined') {
  const requested = new URL(window.location.href).searchParams.get('lang');
  try {
    const saved = window.localStorage.getItem(languageKey);
    language = validLanguage(requested) ? requested : validLanguage(saved) ? saved : 'zh';
    if (validLanguage(requested)) window.localStorage.setItem(languageKey, requested);
  } catch {
    language = validLanguage(requested) ? requested : 'zh';
  }
}

export const getLanguage = () => language;
export const t = (zh, en) => language === 'en' ? en : zh;
export const localizeContent = (zh, en) => language === 'en' ? en : zh;

export function setLanguage(next) {
  if (!validLanguage(next)) return false;
  language = next;
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(languageKey, next); } catch { /* Keep this session usable. */ }
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState(window.history.state, '', url);
  }
  syncDocumentLanguage();
  return true;
}

export function syncDocumentLanguage() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.documentElement.dataset.language = language;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = t(
    '培玉 CS：从好奇出发，用短讲解、交互实验和即时练习探索计算机科学。',
    'Peiyu CS: explore computer science through clear explanations, interactive experiments, and exercises with immediate feedback.'
  );
}

syncDocumentLanguage();
