/**
 * JusticeNow design system (EP-09 / US-18).
 *
 * Screens import from here and nowhere deeper:
 *   import { Card, Button, Spacing, useColors } from '@/design-system';
 *
 * See `README.md` in this folder for the token reference and usage rules.
 */

export {
  Colors,
  darkColors,
  lightColors,
  type ColorScheme,
  type ColorToken,
  type ColorTokens,
} from './colors';
export { Layout, Radius, Spacing, type RadiusToken, type SpacingToken } from './spacing';
export {
  BODY_SIZE_FLOOR,
  FONT_SIZE_FLOOR,
  Fonts,
  Typography,
  type TypographyToken,
} from './typography';
export { useColors } from './use-colors';
export * from './components';
