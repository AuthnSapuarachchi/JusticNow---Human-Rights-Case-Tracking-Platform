import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { request } from '@/api/client';

const SESSION_KEY = 'justicenow.session';

export type UserRole = 'CITIZEN' | 'OFFICER' | 'ADMIN';

type User = {
  id: number;
  email: string;
  name?: string | null;
  role: UserRole;
};

type Session = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

type Credentials = { email: string; password: string };
type Registration = Credentials & { name: string; role: UserRole };

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (details: Registration) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((storedSession) => {
        if (storedSession) setSession(JSON.parse(storedSession) as Session);
      })
      .catch(() => AsyncStorage.removeItem(SESSION_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const saveSession = async (nextSession: Session) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const login = async (credentials: Credentials) => {
    const nextSession = await request<Session>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: credentials.email.trim(), password: credentials.password }),
    });
    await saveSession(nextSession);
  };

  const register = async (details: Registration) => {
    const nextSession = await request<Session>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: details.name.trim(),
        email: details.email.trim(),
        password: details.password,
        role: details.role,
      }),
    });
    await saveSession(nextSession);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  const value = useMemo(() => ({ session, isLoading, login, register, logout }), [session, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function AuthRedirect() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const isAuthRoute = segments[0] === 'login' || segments[0] === 'register';
  const destination = session?.user.role === 'ADMIN' ? '/admin' : session?.user.role === 'OFFICER' ? '/officer' : '/';
  const isWrongRoleRoute = session && ((segments[0] === 'admin' && session.user.role !== 'ADMIN') || (segments[0] === 'officer' && session.user.role !== 'OFFICER') || (segments[0] === undefined && session.user.role !== 'CITIZEN'));

  useEffect(() => {
    if (isLoading) return;
    if (!session && !isAuthRoute) router.replace('/login');
    if (session && isAuthRoute) router.replace(destination);
    if (isWrongRoleRoute) router.replace(destination);
  }, [isLoading, session, isAuthRoute, isWrongRoleRoute, destination, router]);

  return null;
}
