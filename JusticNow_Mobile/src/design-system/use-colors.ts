import { Colors, type ColorTokens } from './colors';

/**
 * Resolves the semantic colour set for the JusticeNow screens.
 *
 * The approved product design currently ships in light mode. Keep the dark
 * tokens available for a future user-controlled theme without allowing the
 * device preference to unexpectedly change the product surface.
 */
export function useColors(): ColorTokens {
  return Colors.light;
}
