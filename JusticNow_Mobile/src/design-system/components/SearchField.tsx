import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { Layout, Radius, Spacing } from '../spacing';
import { Typography } from '../typography';
import { useColors } from '../use-colors';

export type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  /** Visible placeholder. Must come from an i18n key, never a literal. */
  placeholder: string;
  /**
   * Announced to screen readers. Required because the magnifier icon alone does
   * not tell a non-sighted user what the field searches.
   */
  accessibilityLabel: string;
};

export function SearchField({ value, onChangeText, placeholder, accessibilityLabel }: SearchFieldProps) {
  const colors = useColors();

  return (
    <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
      <Ionicons color={colors.textTertiary} name="search" size={20} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        returnKeyType="search"
        style={[styles.input, { color: colors.textPrimary }]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    minHeight: Layout.minTapTarget + 8,
    paddingHorizontal: Spacing.xl,
  },
  input: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    paddingVertical: Spacing.md,
  },
});
