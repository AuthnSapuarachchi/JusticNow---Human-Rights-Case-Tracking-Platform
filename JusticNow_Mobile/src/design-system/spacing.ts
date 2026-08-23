/**
 * Spacing, radius and layout tokens (EP-09).
 *
 * A 4pt grid. `constants/theme.ts` also exports a `Spacing` object, but it uses
 * an unnamed scale (`half`, `one`, `two`…) that does not map to the Figma, so
 * the two are deliberately kept separate — see `README.md`.
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const Layout = {
  /** Horizontal padding used by every screen. Matches the merged screens. */
  screenPadding: Spacing.xl,
  /** Bottom padding so scroll content clears the fixed BottomNavBar. */
  bottomNavInset: 105,
  /** Accessibility floor for anything tappable. From our user research. */
  minTapTarget: 44,
  /** Hairline used for card and row separators. */
  hairline: 1,
} as const;

export type SpacingToken = keyof typeof Spacing;
export type RadiusToken = keyof typeof Radius;
