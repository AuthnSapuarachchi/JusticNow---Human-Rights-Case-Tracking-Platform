/**
 * Type scale (EP-09).
 *
 * Two rules from our user research are encoded here and must not be relaxed:
 *   - Body copy is never smaller than 16px.
 *   - Nothing in the UI goes below 14px at all (FONT_SIZE_FLOOR).
 * Both exist because low-literacy and older participants struggled with the
 * smaller sizes in testing.
 *
 * `Fonts` is re-exported from `constants/theme.ts` rather than redefined — that
 * file already carries the per-platform logic and the web `global.css` wiring.
 */

import type { TextStyle } from 'react-native';

export { Fonts } from '@/constants/theme';

/** Nothing in the UI may set a fontSize below this. */
export const FONT_SIZE_FLOOR = 14;

/** Body copy floor. Stricter than FONT_SIZE_FLOOR and applies to reading text. */
export const BODY_SIZE_FLOOR = 16;

export const Typography = {
  /** Screen titles — "Know Your Rights", "Find Legal Help". */
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.3 },
  /** Section titles within a screen. */
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.2 },
  /** Card titles, organisation names, category names. */
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  /** Default reading text. */
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  /** Buttons, field labels, tab labels. */
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  /** Metadata — distance, languages, timestamps. */
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  /** All-caps eyebrow above a title. */
  eyebrow: { fontSize: 14, lineHeight: 18, fontWeight: '700', letterSpacing: 1.2 },
} as const satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof Typography;
