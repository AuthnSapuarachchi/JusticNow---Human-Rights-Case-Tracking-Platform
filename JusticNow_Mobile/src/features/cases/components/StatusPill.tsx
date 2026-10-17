import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';

type StatusPillProps = {
  label: string;
  color: string;
  background: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

/** Case status label. Always text + colour, never colour alone. */
export function StatusPill({ label, color, background, icon }: StatusPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      {icon ? <Ionicons color={color} name={icon} size={14} /> : null}
      <Text numberOfLines={1} style={[styles.label, { color }]} variant="caption">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  label: {
    fontWeight: '600',
  },
});
