import type { AppLanguage } from '../types';

import { en, type TranslationKey } from './en';
import { si } from './si';
import { ta } from './ta';

export type { TranslationKey };
export { en };

/**
 * English is complete by construction (it defines the key set). The other two
 * are partial and fall back to English per key, so a half-translated dictionary
 * still renders a usable screen.
 */
export const translations: {
  en: Record<TranslationKey, string>;
  si: Partial<Record<TranslationKey, string>>;
  ta: Partial<Record<TranslationKey, string>>;
} = { en, si, ta };

/** How many keys each language has, for the coverage check in the doc. */
export function translationCoverage(language: AppLanguage): { done: number; total: number } {
  const total = Object.keys(en).length;
  const done = language === 'en' ? total : Object.keys(translations[language]).length;
  return { done, total };
}
