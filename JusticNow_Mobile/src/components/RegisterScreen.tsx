import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/design-system/use-colors';

import { AuthLayout, Field, PasswordVisibilityButton } from './AuthLayout';

export function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!name.trim()) {
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
      await register({ name, email, password });
      router.replace('/login');
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
      submitLabel="Create account"
      subtitle="Keep track of your reports and reach trusted legal support securely."
      switchLabel="Sign in"
      switchPrompt="Already have an account?"
      switchRoute="/login"
      title="Create a safe space."
    >
      <Field colors={colors} label="Full name" onChangeText={setName} placeholder="Your name" value={name} />
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