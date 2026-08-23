/**
 * Language types (EP-09 supporting work).
 *
 * This module owns `AppLanguage`. `design-system/components/LanguageToggle`
 * imports it from here rather than declaring its own.
 */

/** The three languages JusticeNow ships in. */
export type AppLanguage = 'en' | 'si' | 'ta';

export const LANGUAGES: AppLanguage[] = ['en', 'si', 'ta'];

/** Short form shown in the header toggle, each written in its own script. */
export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'EN',
  si: 'සිං',
  ta: 'தமிழ்',
};

/**
 * Full names, used as the accessibility label on each toggle option — screen
 * readers cannot reliably pronounce the short forms.
 */
export const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  en: 'English',
  si: 'සිංහල',
  ta: 'தமிழ்',
};

/** Values interpolated into a string, e.g. t('directory.distance', { km: 2.4 }). */
export type TranslationParams = Record<string, string | number>;
