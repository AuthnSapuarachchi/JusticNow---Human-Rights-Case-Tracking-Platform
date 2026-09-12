import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Text } from '@/design-system/components';
import { useAuth, type UserRole } from '@/context/AuthContext';
import { useColors } from '@/design-system/use-colors';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

type AuthMode = 'login' | 'register';

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const colors = useColors();
  const { login, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CITIZEN');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isRegister = mode === 'register';

  const submit = async () => {
    setError('');
    if (isRegister && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) await register({ name, email, password, role });
      else await login({ email, password });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.brandMark, { backgroundColor: colors.primarySoft }]}>
          <Ionicons color={colors.primary} name="shield-checkmark" size={30} />
        </View>
        <Text color="primary" style={styles.eyebrow} variant="eyebrow">JUSTICENOW</Text>
        <Text style={styles.title} variant="display">{isRegister ? 'Create a safe space.' : 'Welcome back.'}</Text>
        <Text color="textSecondary" style={styles.subtitle}>
          {isRegister ? 'Keep track of your reports and reach trusted legal support securely.' : 'Sign in to manage your reports and continue where you left off.'}
        </Text>

        <View style={styles.form}>
          {isRegister ? <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" colors={colors} /> : null}
          {isRegister ? <RolePicker value={role} onChange={setRole} colors={colors} /> : null}
          <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" colors={colors} />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry={!isPasswordVisible} colors={colors} trailing={<Pressable accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'} hitSlop={8} onPress={() => setIsPasswordVisible((visible) => !visible)}><Ionicons color={colors.textSecondary} name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={21} /></Pressable>} />
        </View>

        {error ? <View style={[styles.error, { backgroundColor: colors.dangerSoft }]}><Ionicons color={colors.danger} name="alert-circle-outline" size={20} /><Text color="danger" style={styles.errorText}>{error}</Text></View> : null}
        <Button fullWidth label={isRegister ? 'Create account' : 'Sign in'} loading={isSubmitting} onPress={submit} />

        <View style={styles.switchRow}>
          <Text color="textSecondary">{isRegister ? 'Already have an account?' : 'New to JusticeNow?'}</Text>
          <Pressable onPress={() => router.replace(isRegister ? '/login' : '/register')}><Text color="link" style={styles.switchAction}>{isRegister ? 'Sign in' : 'Create an account'}</Text></Pressable>
        </View>
        <View style={styles.privacyRow}><Ionicons color={colors.success} name="lock-closed-outline" size={17} /><Text color="textTertiary" style={styles.privacy}>Your information is encrypted and only used to support your case.</Text></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; colors: ReturnType<typeof useColors>; secureTextEntry?: boolean; keyboardType?: 'email-address' | 'default'; autoCapitalize?: 'none' | 'sentences'; trailing?: React.ReactNode };

function Field({ label, colors, trailing, ...props }: FieldProps) {
  return <View style={styles.field}><Text color="textSecondary" style={styles.fieldLabel} variant="label">{label}</Text><View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}><TextInput {...props} placeholderTextColor={colors.textTertiary} style={[styles.input, { color: colors.textPrimary }]} /></View>{trailing ? <View style={styles.trailing}>{trailing}</View> : null}</View>;
}

function RolePicker({ value, onChange, colors }: { value: UserRole; onChange: (role: UserRole) => void; colors: ReturnType<typeof useColors> }) {
  const roles: UserRole[] = ['CITIZEN', 'OFFICER', 'ADMIN'];
  return <View><Text color="textSecondary" style={styles.fieldLabel} variant="label">Account role</Text><View style={styles.roleRow}>{roles.map((roleOption) => <Pressable key={roleOption} accessibilityRole="radio" accessibilityState={{ checked: value === roleOption }} onPress={() => onChange(roleOption)} style={[styles.roleOption, { backgroundColor: value === roleOption ? colors.primarySoft : colors.surface, borderColor: value === roleOption ? colors.primary : colors.border }]}><Text color={value === roleOption ? 'primarySoftText' : 'textSecondary'} style={styles.roleText}>{roleOption}</Text></Pressable>)}</View></View>;
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
  roleRow: { flexDirection: 'row', gap: Spacing.sm },
  roleOption: { alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, flex: 1, minHeight: 48, justifyContent: 'center', paddingHorizontal: Spacing.sm },
  roleText: { fontSize: 14, fontWeight: '700' },
  error: { alignItems: 'flex-start', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, padding: Spacing.md },
  errorText: { flex: 1 },
  switchRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginTop: Spacing.xxl },
  switchAction: { fontWeight: '700' },
  privacyRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginTop: Spacing.xxxl },
  privacy: { flex: 1, textAlign: 'center' },
});
