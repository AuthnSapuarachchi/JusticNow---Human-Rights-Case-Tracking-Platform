/**
 * JusticeNow internationalisation.
 *
 * Screens import from here and nowhere deeper:
 *   const { t, language, setLanguage } = useTranslation();
 *   <Text>{t('directory.title')}</Text>
 *
 * See `README.md` in this folder for how to add a string or a language.
 */

export { I18nContext, I18nProvider, type I18nContextValue, type I18nProviderProps } from './I18nProvider';
export { translationCoverage, translations, type TranslationKey } from './translations';
export {
  LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_NAMES,
  type AppLanguage,
  type TranslationParams,
} from './types';
export { useTranslation } from './use-translation';
