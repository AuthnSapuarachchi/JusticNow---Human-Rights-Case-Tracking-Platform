import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Layout, Radius, Spacing } from '../spacing';
import { useColors } from '../use-colors';
import { Text } from './Text';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ButtonProps = {
  /**
   * Required — never optional. Our research found icon-only controls unusable
   * for low-literacy participants, so every button carries a text label.
   */
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Optional icon, always shown alongside the label rather than replacing it. */
  icon?: IoniconName;
  iconPosition?: 'leading' | 'trailing';
  disabled?: boolean;
  loading?: boolean;
  /** Stretches to the container width. Primary CTAs in the designs are full width. */
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'trailing',
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.surface : 'transparent';
  const foreground = variant === 'primary' ? colors.textOnPrimary : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background },
        variant === 'secondary' && { borderColor: colors.borderStrong, borderWidth: 1 },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'leading' ? <Ionicons color={foreground} name={icon} size={18} /> : null}
          <Text style={{ color: foreground }} variant="label">
            {label}
          </Text>
          {icon && iconPosition === 'trailing' ? <Ionicons color={foreground} name={icon} size={18} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: Radius.md,
    justifyContent: 'center',
    minHeight: Layout.minTapTarget,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.45,
  },
});
