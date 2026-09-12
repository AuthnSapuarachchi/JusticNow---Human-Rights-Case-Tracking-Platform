import { useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/design-system/use-colors';

import { AuthLayout, Field, PasswordVisibilityButton } from './AuthLayout';

export function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
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
      await login({ email, password });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      error={error}
      isSubmitting={isSubmitting}
      onSubmit={submit}
      submitLabel="Sign in"
      subtitle="Sign in to manage your reports and continue where you left off."
      switchLabel="Create an account"
      switchPrompt="New to JusticeNow?"
      switchRoute="/register"
      title="Welcome back."
    >
      <Field autoCapitalize="none" colors={colors} keyboardType="email-address" label="Email address" onChangeText={setEmail} placeholder="you@example.com" value={email} />
      <Field
        colors={colors}
        label="Password"
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secureTextEntry={!isPasswordVisible}
        trailing={<PasswordVisibilityButton onPress={() => setIsPasswordVisible((visible) => !visible)} visible={isPasswordVisible} />}
        value={password}
      />
    </AuthLayout>
  );
}