import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type StepLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Sticky footer, usually the Back / Next buttons. */
  footer: ReactNode;
};

/** Shared frame for every report step: scrolling body, sticky footer, keyboard-safe. */
export function StepLayout({ title, subtitle, children, footer }: StepLayoutProps) {
  const colors = useColors();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" variant="title">{title}</Text>
          <Text color="textSecondary">{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>{footer}</View>
    </KeyboardAvoidingView>
  );
}

/** Two-button footer row: a narrow Back and a wide primary action. */
export function StepFooter({ children }: { children: ReactNode }) {
  return <View style={styles.footerRow}>{children}</View>;
}

export function FooterSlot({ children, grow = 1 }: { children: ReactNode; grow?: number }) {
  return <View style={{ flex: grow }}>{children}</View>;
}

type ChoiceCardProps = {
  title: string;
  description?: string;
  icon: IoniconName;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

/** A large, radio-style option. Big targets and a visible check suit every age group. */
export function ChoiceCard({ title, description, icon, selected, onPress, disabled }: ChoiceCardProps) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.choiceIcon, { backgroundColor: selected ? colors.surface : colors.surfaceMuted }]}>
        <Ionicons color={selected ? colors.primary : colors.textSecondary} name={icon} size={22} />
      </View>
      <View style={styles.flex}>
        <Text variant="bodyStrong">{title}</Text>
        {description ? <Text color="textSecondary" variant="caption">{description}</Text> : null}
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.borderStrong }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}
      </View>
    </Pressable>
  );
}

type FormFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  optional?: boolean;
};

/** Labelled text input with a clear focus state and 16px text (no iOS zoom-on-focus). */
export function FormField({ label, hint, optional, multiline, style, onFocus, onBlur, ...props }: FormFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text variant="label">
        {label}
        {optional ? <Text color="textTertiary" variant="label"> (optional)</Text> : null}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        multiline={multiline}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            backgroundColor: colors.surface,
            borderColor: focused ? colors.primary : colors.borderStrong,
            color: colors.textPrimary,
          },
          focused && styles.inputFocused,
          style,
        ]}
        {...props}
      />
      {hint ? <Text color="textSecondary" variant="caption">{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { gap: Spacing.lg, padding: Layout.screenPadding, paddingBottom: Spacing.xxxl },
  heading: { gap: Spacing.xs, marginBottom: Spacing.xs },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Layout.screenPadding, paddingVertical: Spacing.md },
  footerRow: { flexDirection: 'row', gap: Spacing.md },
  pressed: { opacity: 0.8 },
  choice: { alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1.5, flexDirection: 'row', gap: Spacing.md, minHeight: 72, padding: Spacing.lg },
  choiceIcon: { alignItems: 'center', borderRadius: Radius.md, height: 44, justifyContent: 'center', width: 44 },
  radio: { alignItems: 'center', borderRadius: 12, borderWidth: 2, height: 24, justifyContent: 'center', width: 24 },
  radioDot: { borderRadius: 6, height: 12, width: 12 },
  field: { gap: Spacing.sm },
  input: { borderRadius: Radius.md, borderWidth: 1, fontSize: 16, minHeight: 52, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  inputFocused: { borderWidth: 2, paddingHorizontal: Spacing.lg - 1 },
  multiline: { minHeight: 140, textAlignVertical: 'top' },
});
