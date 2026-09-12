import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Layout, Spacing } from '../spacing';
import { useColors } from '../use-colors';
import { Text } from './Text';

export type SectionHeadingProps = {
  title: string;
  /** Optional trailing action, e.g. "View All". Needs both label and handler. */
  actionLabel?: string;
  onActionPress?: () => void;
};

/** Section title with an optional trailing link — "Categories", "Featured Guides". */
export function SectionHeading({ title, actionLabel, onActionPress }: SectionHeadingProps) {
  const colors = useColors();
  const showAction = Boolean(actionLabel && onActionPress);

  return (
    <View style={styles.row}>
      <Text variant="heading">{title}</Text>
      {showAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text color="link" variant="label">
            {actionLabel}
          </Text>
          <Ionicons color={colors.link} name="arrow-forward" size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: Layout.minTapTarget,
  },
  action: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingLeft: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
