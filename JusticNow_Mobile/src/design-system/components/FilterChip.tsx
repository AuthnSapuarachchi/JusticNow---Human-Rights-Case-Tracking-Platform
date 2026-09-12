import { Pressable, StyleSheet } from 'react-native';

import { Layout, Radius, Spacing } from '../spacing';
import { useColors } from '../use-colors';
import { Text } from './Text';

export type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Tappable filter pill — the "All Services / Free Services / Legal Aid" row on
 * the directory screen.
 *
 * Selection is carried by `accessibilityState.selected` as well as by colour, so
 * the state is announced rather than only seen.
 */
export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.surfaceInverse : colors.surface,
          borderColor: selected ? colors.surfaceInverse : colors.borderStrong,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={{ color: selected ? colors.textInverse : colors.textSecondary }}
        variant="label"
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: Layout.minTapTarget,
    paddingHorizontal: Spacing.xl,
  },
  pressed: {
    opacity: 0.75,
  },
});
