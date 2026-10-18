import React, { type ComponentProps, type PropsWithChildren } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';

interface AdminSheetProps {
  visible: boolean;
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  description?: string;
  onClose: () => void;
}

/**
 * Bottom-sheet modal shell shared by the admin management forms.
 * Mirrors the officer RequestInfoModal layout.
 */
export function AdminSheet({ visible, title, icon, description, onClose, children }: PropsWithChildren<AdminSheetProps>) {
  const colors = useColors();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.canvas }]}>
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Ionicons color={colors.primary} name={icon} size={24} />
              <Text variant="heading">{title}</Text>
            </View>
            <Pressable accessibilityLabel="Close" accessibilityRole="button" hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.textSecondary} name="close" size={24} />
            </Pressable>
          </View>

          {description ? (
            <Text color="textSecondary" style={styles.description} variant="caption">
              {description}
            </Text>
          ) : null}

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.body}>{children}</View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface FormFieldProps extends TextInputProps {
  label: string;
}

export function FormField({ label, multiline, style, ...inputProps }: FormFieldProps) {
  const colors = useColors();

  return (
    <View style={styles.field}>
      <Text color="textSecondary" style={styles.fieldLabel} variant="caption">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        multiline={multiline}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          multiline && styles.textArea,
          { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
          style,
        ]}
        {...inputProps}
      />
    </View>
  );
}

interface FormSwitchProps {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function FormSwitch({ label, hint, value, onValueChange }: FormSwitchProps) {
  const colors = useColors();

  return (
    <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.switchText}>
        <Text variant="bodyStrong">{label}</Text>
        {hint ? (
          <Text color="textSecondary" variant="caption">
            {hint}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        onValueChange={onValueChange}
        thumbColor={colors.surface}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  description: {
    marginBottom: Spacing.md,
  },
  body: {
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  field: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontWeight: '700',
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  switchRow: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
});
