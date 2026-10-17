import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '../spacing';
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Optional icon, always shown alongside the label rather than replacing it. */
  icon?: IoniconName;
  iconPosition?: 'leading' | 'trailing';
  disabled?: boolean;
  loading?: boolean;
  /** Stretches to the container width. Primary CTAs in the designs are full width. */
  fullWidth?: boolean;
  /** Overrides the spoken label when the visible text needs more context. */
  accessibilityLabel?: string;
};

/** Comfortable for older users and anyone with reduced dexterity. */
const BUTTON_HEIGHT = 52;

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'trailing',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.surface
          : 'transparent';
  const foreground = variant === 'primary' || variant === 'danger' ? colors.textOnPrimary : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background },
        variant === 'secondary' && { borderColor: colors.borderStrong, borderWidth: 1 },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        disabled && !loading && styles.disabled,
      ]}
    >
      {/* The label stays mounted while loading so the button never changes size. */}
      <View style={[styles.content, loading && styles.hidden]}>
        {icon && iconPosition === 'leading' ? <Ionicons color={foreground} name={icon} size={20} /> : null}
        <Text numberOfLines={1} style={[styles.label, { color: foreground }]} variant="label">
          {label}
        </Text>
        {icon && iconPosition === 'trailing' ? <Ionicons color={foreground} name={icon} size={20} /> : null}
      </View>
      {loading ? <ActivityIndicator color={foreground} size="small" style={StyleSheet.absoluteFill} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: Radius.md,
    justifyContent: 'center',
    minHeight: BUTTON_HEIGHT,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    flexShrink: 1,
  },
  hidden: {
    opacity: 0,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
