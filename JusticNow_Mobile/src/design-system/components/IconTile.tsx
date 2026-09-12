import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius } from '../spacing';
import { useColors } from '../use-colors';

export type IconTileProps = {
  name: ComponentProps<typeof Ionicons>['name'];
  size?: 'sm' | 'md';
  tone?: 'primary' | 'neutral' | 'success' | 'danger';
};

/**
 * The soft rounded square holding a category icon — used on every Know Your
 * Rights tile and on the organisation avatar.
 *
 * Decorative by design: it always sits next to a text label, so it is hidden
 * from screen readers rather than announced twice.
 */
export function IconTile({ name, size = 'md', tone = 'primary' }: IconTileProps) {
  const colors = useColors();

  const tones = {
    primary: { background: colors.primarySoft, foreground: colors.primary },
    neutral: { background: colors.surfaceMuted, foreground: colors.textSecondary },
    success: { background: colors.successSoft, foreground: colors.success },
    danger: { background: colors.dangerSoft, foreground: colors.danger },
  };

  const { background, foreground } = tones[tone];
  const box = size === 'sm' ? 36 : 48;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { backgroundColor: background, height: box, width: box }]}
    >
      <Ionicons color={foreground} name={name} size={size === 'sm' ? 18 : 24} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    borderRadius: Radius.md,
    justifyContent: 'center',
  },
});
