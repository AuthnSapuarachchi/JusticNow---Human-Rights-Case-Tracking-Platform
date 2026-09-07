import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '../spacing';
import { useColors } from '../use-colors';
import { Text } from './Text';

export type BadgeTone = 'verified' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type BadgeProps = {
  /**
   * Required. Our research rule: never use colour alone to convey meaning, so a
   * badge always carries a readable label alongside its tone.
   */
  label: string;
  tone?: BadgeTone;
  /** Optional leading icon. Supplements the label, never replaces it. */
  icon?: ComponentProps<typeof Ionicons>['name'];
};

export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const colors = useColors();

  const toneStyles: Record<BadgeTone, { background: string; foreground: string }> = {
    verified: { background: colors.primarySoft, foreground: colors.primarySoftText },
    success: { background: colors.successSoft, foreground: colors.success },
    warning: { background: colors.warningSoft, foreground: colors.warning },
    danger: { background: colors.dangerSoft, foreground: colors.danger },
    info: { background: colors.primarySoft, foreground: colors.primarySoftText },
    neutral: { background: colors.tagBackground, foreground: colors.tagText },
  };

  const { background, foreground } = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      {icon ? <Ionicons color={foreground} name={icon} size={13} /> : null}
      <Text style={{ color: foreground }} variant="caption">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
});
