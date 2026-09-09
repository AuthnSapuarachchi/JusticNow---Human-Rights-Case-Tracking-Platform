import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider, AuthRedirect, useAuth } from '@/context/AuthContext';
import { I18nProvider } from '@/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <I18nProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </I18nProvider>
  );
}

function AuthGate() {
  const { isLoading } = useAuth();

  if (isLoading) return null;
  return (
    <>
      <AuthRedirect />
      <Slot />
    </>
  );
}
