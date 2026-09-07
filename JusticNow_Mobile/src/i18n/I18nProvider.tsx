import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

import { translations, type TranslationKey } from './translations';
import type { AppLanguage, TranslationParams } from './types';

export type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

/** Replaces {{name}} placeholders with the values supplied by the caller. */
function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export type I18nProviderProps = {
  children: ReactNode;
  /** Starting language. Defaults to English. */
  initialLanguage?: AppLanguage;
};

/**
 * Wraps the app so every screen can reach `t()` and the active language.
 *
 * The choice is held in memory only — neither AsyncStorage nor expo-secure-store
 * is installed, and adding one is a dependency decision for the team rather than
 * something to slip in here. Persisting the selection across launches is a
 * follow-up ticket; see `README.md`.
 */
export function I18nProvider({ children, initialLanguage = 'en' }: I18nProviderProps) {
  const [language, setLanguage] = useState<AppLanguage>(initialLanguage);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      // Fall back to English per key, so a partial dictionary still renders.
      const template = translations[language][key] ?? translations.en[key];
      return interpolate(template, params);
    },
    [language],
  );

  const value = useMemo<I18nContextValue>(() => ({ language, setLanguage, t }), [language, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
