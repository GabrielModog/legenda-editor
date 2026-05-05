import { useCallback, useEffect, useState } from 'react';
import { currentLocale, setLocale as setLocaleCore, subscribe, t } from './core';
import type { Locale } from './core';

export function useTranslation() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    return subscribe(() => forceUpdate((n) => n + 1));
  }, []);

  const changeLocale = useCallback((locale: Locale) => {
    setLocaleCore(locale);
  }, []);

  return { t, locale: currentLocale, setLocale: changeLocale };
}

export { t, getStoredLocale, subscribe, setLocale as setLocaleCore, currentLocale } from './core';
export type { Locale } from './core';