import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';

type Locale = 'en' | 'pt' | 'es';

const LOCALES: Record<Locale, Record<string, string>> = { en, pt, es };

const LOCALE_STORAGE_KEY = 'legenda-editor-locale';

function detectBrowserLanguage(): Locale {
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('es')) return 'es';
  return 'en';
}

function getStoredLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && stored in LOCALES) return stored as Locale;
  return detectBrowserLanguage();
}

let currentLocale: Locale = getStoredLocale();
const listeners = new Set<() => void>();

function setLocale(newLocale: Locale) {
  currentLocale = newLocale;
  localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  listeners.forEach((fn) => fn());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function t(key: string): string {
  return LOCALES[currentLocale]?.[key] ?? LOCALES.en[key] ?? key;
}

export { getStoredLocale, setLocale, subscribe, currentLocale };
export type { Locale };