import { useContext } from 'react';

import { I18nContext, type I18nContextValue } from './I18nProvider';

/**
 * Access to `t()`, the active language, and the setter.
 *
 * Throws when used outside `I18nProvider` rather than silently returning
 * English — a missing provider is a wiring bug, and failing loudly in
 * development is cheaper than shipping a screen stuck in one language.
 */
export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used inside an <I18nProvider>. Add it in src/app/_layout.tsx.');
  }

  return context;
}
