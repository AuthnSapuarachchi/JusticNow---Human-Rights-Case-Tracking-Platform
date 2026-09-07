import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '../spacing';
import { useColors } from '../use-colors';
import { Text } from './Text';

export type TagProps = {
  label: string;
};

/**
 * Non-interactive category label — "Legal Aid", "Human Rights", "Workplace Rights".
 * For a tappable filter use `FilterChip` instead.
 */
export function Tag({ label }: TagProps) {
  const colors = useColors();

  return (
    <View style={[styles.tag, { backgroundColor: colors.tagBackground }]}>
      <Text color="tagText" variant="caption">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
});
