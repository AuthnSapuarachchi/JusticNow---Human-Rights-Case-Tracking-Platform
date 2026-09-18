import { StyleSheet, TextInput, View } from 'react-native';

import { Radius, Spacing } from '../spacing';
import { useColors } from '../use-colors';
import { Text } from './Text';

export type ContentTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
  /** Shown under the field — used for format hints like "comma separated". */
  hint?: string;
};

/** Labelled input used across both admin content forms. */
export function ContentTextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  hint,
}: ContentTextFieldProps) {
  const colors = useColors();

  return (
    <View style={styles.field}>
      <Text color="textSecondary" variant="label">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          multiline && styles.multiline,
          { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
        ]}
        value={value}
      />
      {hint ? (
        <Text color="textTertiary" variant="caption">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.xs,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: 16, // accessibility floor - never shrink this
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
