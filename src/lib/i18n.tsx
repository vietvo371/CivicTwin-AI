'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import vi from '@/locales/vi.json';
import en from '@/locales/en.json';
import th from '@/locales/th.json';
import id from '@/locales/id.json';
import ms from '@/locales/ms.json';
import tl from '@/locales/tl.json';
import km from '@/locales/km.json';
import lo from '@/locales/lo.json';
import my from '@/locales/my.json';

export type Locale = 'vi' | 'en' | 'th' | 'id' | 'ms' | 'tl' | 'km' | 'lo' | 'my';

const translations: Record<Locale, Record<string, any>> = { vi, en, th, id, ms, tl, km, lo, my };

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    if (!localStorage.getItem('civictwin-i18n-v2')) {
      localStorage.setItem('civictwin-locale', 'en');
      localStorage.setItem('civictwin-i18n-v2', 'true');
      setLocaleState('en');
      document.documentElement.lang = 'en';
      return;
    }

    const saved = localStorage.getItem('civictwin-locale') as Locale;
    if (saved && translations[saved]) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('civictwin-locale', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(translations[locale], key);
    if (typeof value !== 'string') return key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }
    return value;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be inside I18nProvider');
  return ctx;
}

/**
 * Standalone translation function — usable outside React components (e.g. api.ts).
 * Reads locale from localStorage at call time.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const locale = (localStorage?.getItem('civictwin-locale') as Locale) || 'en';
  let value = getNestedValue(translations[locale] ?? translations['en'], key);
  if (typeof value !== 'string') return key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(`{${k}}`, String(v));
    });
  }
  return value;
}
