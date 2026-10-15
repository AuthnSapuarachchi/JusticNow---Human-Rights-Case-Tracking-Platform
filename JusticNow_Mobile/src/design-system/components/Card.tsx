import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '../spacing';
import { useColors } from '../use-colors';

export type CardProps = ViewProps & {
  /** Adds a visible border. Use on lists where cards sit on a white surface. */
  bordered?: boolean;
  /** Renders the card as a button. Omit for static cards. */
  onPress?: () => void;
  /** Required when `onPress` is set, so screen readers announce the target. */
  accessibilityLabel?: string;
};

/** The white rounded container used by every list row and panel in the designs. */
export function Card({ bordered = true, onPress, style, children, ...rest }: CardProps) {
  const colors = useColors();

  const base = [
    styles.card,
    { backgroundColor: colors.surface },
    bordered && { borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
    style,
  ];

  if (!onPress) {
    return (
      <View style={base} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [base, pressed && styles.pressed]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    elevation: 2,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  pressed: {
    opacity: 0.75,
  },
});
