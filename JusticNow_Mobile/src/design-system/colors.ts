/**
 * JusticeNow colour tokens (EP-09).
 *
 * Source of truth: the approved Figma exports in `docs/design/mine/`.
 * Where Figma and the already-merged screens disagreed, Figma won — see
 * `src/design-system/README.md` for that decision and the migration note.
 *
 * Never import `palette` from a screen. Screens use the semantic tokens via
 * `useColors()` so light and dark both resolve correctly.
 */

/**
 * Raw values. Only the semantic maps below may reference these.
 *
 * Deliberately not `as const`: literal types here propagate into the semantic
 * maps and make every dark-scheme value a type error against the light one.
 */
const palette = {
  // Brand blue — primary actions, links, active states, verified badge.
  blue700: '#0F45B0',
  blue600: '#1355D6',
  blue500: '#3B77E3',
  blue100: '#DCE7FB',
  blue50: '#EEF4FE',

  // Navy — headings, active dark chips, the featured-guide card.
  navy900: '#0D1B2A',
  navy800: '#11243A',
  navy600: '#33475C',

  // Neutrals, biased slightly cool to sit with the blue rather than fight it.
  grey700: '#5A6672',
  grey500: '#8994A1',
  grey300: '#D3DAE2',
  grey200: '#E3E7EC',
  grey100: '#EEF1F4',
  grey50: '#F7F8FA',
  white: '#FFFFFF',

  // Semantic accents.
  green600: '#2E7D5B',
  green100: '#DFF0E8',
  amber600: '#B4671F',
  amber100: '#FBEEDC',
  red600: '#B3261E',
  red100: '#FBE4E2',

  // Dark-theme grounds.
  ink900: '#0A1420',
  ink800: '#111E2C',
  ink700: '#1A2938',
  ink600: '#243547',
};

/**
 * Semantic tokens. Screens and components reference these names, never hex.
 * Adding a value here is cheap; adding a hex to a screen is how palettes drift.
 */
export const lightColors = {
  // Surfaces
  canvas: palette.grey50,
  surface: palette.white,
  surfaceMuted: palette.grey100,
  surfaceInverse: palette.navy900,
  border: palette.grey200,
  borderStrong: palette.grey300,

  // Text
  textPrimary: palette.navy900,
  textSecondary: palette.grey700,
  textTertiary: palette.grey500,
  textInverse: palette.white,
  textOnPrimary: palette.white,

  // Brand / interactive
  primary: palette.blue600,
  primaryPressed: palette.blue700,
  primarySoft: palette.blue100,
  primarySoftText: palette.blue700,
  link: palette.blue600,
  focusRing: palette.blue500,

  // Status. Always paired with a text label in the UI — never colour alone.
  verified: palette.blue600,
  success: palette.green600,
  successSoft: palette.green100,
  warning: palette.amber600,
  warningSoft: palette.amber100,
  danger: palette.red600,
  dangerSoft: palette.red100,

  // Tags and chips
  tagBackground: palette.grey100,
  tagText: palette.navy600,
};

/**
 * The shape both schemes share. `lightColors` is deliberately NOT `as const` —
 * that would fix each value to its own literal type and make any dark value a
 * type error against it.
 */
export type ColorTokens = typeof lightColors;

export const darkColors: ColorTokens = {
  canvas: palette.ink900,
  surface: palette.ink800,
  surfaceMuted: palette.ink700,
  surfaceInverse: palette.white,
  border: palette.ink600,
  borderStrong: '#2F4358',

  textPrimary: '#E8EDF3',
  textSecondary: '#A9B6C4',
  textTertiary: '#7C8B9B',
  textInverse: palette.navy900,
  textOnPrimary: palette.white,

  primary: '#5B94F0',
  primaryPressed: '#7CACF5',
  primarySoft: '#15304F',
  primarySoftText: '#AFC9F7',
  link: '#5B94F0',
  focusRing: '#7CACF5',

  verified: '#5B94F0',
  success: '#4FA383',
  successSoft: '#14312A',
  warning: '#D89250',
  warningSoft: '#38270F',
  danger: '#E0776D',
  dangerSoft: '#3A1B18',

  tagBackground: palette.ink700,
  tagText: '#B7C4D2',
};

export const Colors = { light: lightColors, dark: darkColors } as const;

export type ColorToken = keyof typeof lightColors;
export type ColorScheme = keyof typeof Colors;
