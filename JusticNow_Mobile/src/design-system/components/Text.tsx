import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';

import type { ColorToken } from '../colors';
import { Typography, type TypographyToken } from '../typography';
import { useColors } from '../use-colors';

export type TextProps = RNTextProps & {
  /** Type-scale step. Defaults to `body` (16px — our accessibility floor). */
  variant?: TypographyToken;
  /** Semantic colour token. Defaults to `textPrimary`. */
  color?: ColorToken;
};

/**
 * Every piece of user-facing text goes through this component so the type scale
 * and the 16px body floor are enforced in one place rather than per screen.
 *
 * Supersedes `components/themed-text.tsx` for new screens; that one stays for
 * the Expo template screens that still import it.
 */
export function Text({ variant = 'body', color = 'textPrimary', style, ...rest }: TextProps) {
  const colors = useColors();

  return <RNText style={[styles[variant], { color: colors[color] }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  screenTitle: Typography.screenTitle,
  pageTitle: Typography.pageTitle,
  display: Typography.display,
  title: Typography.title,
  heading: Typography.heading,
  body: Typography.body,
  bodyStrong: Typography.bodyStrong,
  label: Typography.label,
  caption: Typography.caption,
  eyebrow: Typography.eyebrow,
});
