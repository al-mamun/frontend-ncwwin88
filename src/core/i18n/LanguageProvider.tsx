'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { dict, type Locale } from './dict';

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<I18nCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mcw_locale');
      if (saved === 'bn' || saved === 'en') setLocaleState(saved);
    } catch { /* noop */ }
    // Purge any leftover Google-translate cookie from the old approach so it can
    // never re-translate the page (built-in dictionary is the only translator now).
    try {
      const host = window.location.hostname;
      const kill = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = kill;
      document.cookie = `${kill}; domain=${host}`;
      document.cookie = `${kill}; domain=.${host}`;
    } catch { /* noop */ }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem('mcw_locale', l); } catch { /* noop */ }
    try { document.documentElement.lang = l; } catch { /* noop */ }
  }, []);

  const t = useCallback((key: string) => dict[key]?.[locale] ?? dict[key]?.en ?? key, [locale]);

  const value = useMemo<I18nCtx>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { locale: 'en', setLocale: () => {}, t: (k: string) => dict[k]?.en ?? k };
  return ctx;
}
