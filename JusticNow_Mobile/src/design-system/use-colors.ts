import { useColorScheme } from '@/hooks/use-color-scheme';

import { Colors, type ColorTokens } from './colors';

/**
 * Resolves the semantic colour set for the active scheme.
 *
 * Parallel to the existing `useTheme()` in `hooks/use-theme.ts`, which serves
 * the Expo template screens. New screens use this one.
 */
export function useColors(): ColorTokens {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark : Colors.light;
}
