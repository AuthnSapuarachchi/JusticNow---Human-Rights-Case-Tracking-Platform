import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Text } from '@/design-system/components';
import { useColors } from '@/design-system/use-colors';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  isSubmitting: boolean;
  error: string;
  switchPrompt: string;
  switchLabel: string;
  switchRoute: '/login' | '/register';
  onSubmit: () => void;
  children: React.ReactNode;
};

export function AuthLayout({
  title,
  subtitle,
  submitLabel,
  isSubmitting,
  error,
  switchPrompt,
  switchLabel,
  switchRoute,
  onSubmit,
  children,
}: AuthLayoutProps) {
  const router = useRouter();
  const colors = useColors();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.brandMark, { backgroundColor: colors.primarySoft }]}>
          <Ionicons color={colors.primary} name="shield-checkmark" size={30} />
        </View>
        <Text color="primary" style={styles.eyebrow} variant="eyebrow">JUSTICENOW</Text>
        <Text style={styles.title} variant="display">{title}</Text>
        <Text color="textSecondary" style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.form}>{children}</View>

        {error ? (
          <View style={[styles.error, { backgroundColor: colors.dangerSoft }]}>
            <Ionicons color={colors.danger} name="alert-circle-outline" size={20} />
            <Text color="danger" style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button fullWidth label={submitLabel} loading={isSubmitting} onPress={onSubmit} />

        <View style={styles.switchRow}>
          <Text color="textSecondary">{switchPrompt}</Text>
          <Pressable onPress={() => router.replace(switchRoute)}>
            <Text color="link" style={styles.switchAction}>{switchLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.privacyRow}>
          <Ionicons color={colors.success} name="lock-closed-outline" size={17} />
          <Text color="textTertiary" style={styles.privacy}>Your information is encrypted and only used to support your case.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: ReturnType<typeof useColors>;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'sentences';
  trailing?: React.ReactNode;
};

export function Field({ label, colors, trailing, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text color="textSecondary" style={styles.fieldLabel} variant="label">{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput {...props} placeholderTextColor={colors.textTertiary} style={[styles.input, { color: colors.textPrimary }]} />
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

export function PasswordVisibilityButton({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  const colors = useColors();

  return (
    <Pressable accessibilityLabel={visible ? 'Hide password' : 'Show password'} hitSlop={8} onPress={onPress}>
      <Ionicons color={colors.textSecondary} name={visible ? 'eye-off-outline' : 'eye-outline'} size={21} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: Layout.screenPadding, paddingVertical: Spacing.huge },
  brandMark: { alignItems: 'center', borderRadius: Radius.lg, height: 64, justifyContent: 'center', marginBottom: Spacing.lg, width: 64 },
  eyebrow: { marginBottom: Spacing.sm },
  title: { marginBottom: Spacing.sm },
  subtitle: { marginBottom: Spacing.xxxl, maxWidth: 420 },
  form: { gap: Spacing.lg, marginBottom: Spacing.lg },
  field: { position: 'relative' },
  fieldLabel: { marginBottom: Spacing.sm },
  inputWrap: { borderRadius: Radius.md, borderWidth: 1, minHeight: 52, justifyContent: 'center' },
  input: { fontSize: 16, minHeight: 50, paddingHorizontal: Spacing.lg, paddingRight: 48 },
  trailing: { position: 'absolute', right: Spacing.lg, top: 37 },
  error: { alignItems: 'flex-start', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, padding: Spacing.md },
  errorText: { flex: 1 },
  switchRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginTop: Spacing.xxl },
  switchAction: { fontWeight: '700' },
  privacyRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginTop: Spacing.xxxl },
  privacy: { flex: 1, textAlign: 'center' },
});