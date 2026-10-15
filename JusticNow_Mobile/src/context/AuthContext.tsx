import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { Platform } from 'react-native';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { request, requestMultipart } from '@/api/client';

const SESSION_KEY = 'justicenow.session';

export type UserRole = 'CITIZEN' | 'OFFICER' | 'LAWYER' | 'ADMIN';
export type VerificationStatus = 'NOT_REQUIRED' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';

type User = {
  id: number;
  email: string;
  name?: string | null;
  role: UserRole;
  verificationStatus?: VerificationStatus;
  rejectionReason?: string | null;
};

type Session = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

type Credentials = { email: string; password: string };
export type Registration = Credentials & {
  name: string;
  role?: 'CITIZEN' | 'OFFICER';
  contactNumber?: string;
  fields?: Record<string, string>;
  documents?: { uri: string; name: string; type: string; file?: Blob }[];
  documentTypes?: string[];
};

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
    if (!details.role || details.role === 'CITIZEN') {
      await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: details.name.trim(), email: details.email.trim(), password: details.password, role: 'CITIZEN' }),
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', details.name.trim());
    formData.append('email', details.email.trim());
    formData.append('password', details.password);
    formData.append('role', details.role);
    formData.append('contactNumber', details.contactNumber || '');
    Object.entries(details.fields || {}).forEach(([key, value]) => formData.append(key, value));
    formData.append('documentTypes', JSON.stringify(details.documentTypes || []));
    for (const document of details.documents || []) {
      if (Platform.OS === 'web') {
        const file: Blob = document.file ?? await fetch(document.uri).then((response) => response.blob());
        formData.append('documents', file, document.name);
      } else {
        formData.append('documents', { uri: document.uri, name: document.name, type: document.type } as any);
      }
    }
    await requestMultipart('/api/auth/register', formData);
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
  const isAuthRoute = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'verification-status';
  const isPending = session && session.user.role !== 'CITIZEN' && session.user.verificationStatus !== 'APPROVED' && session.user.verificationStatus !== 'NOT_REQUIRED';
  const destination = isPending ? '/verification-status' : session?.user.role === 'ADMIN' ? '/admin' : session?.user.role === 'OFFICER' ? '/officer' : '/';
  const isWrongRoleRoute = session && ((isPending && segments[0] !== 'verification-status') || (segments[0] === 'admin' && session.user.role !== 'ADMIN') || (segments[0] === 'officer' && session.user.role !== 'OFFICER') || (segments[0] === 'lawyer' && session.user.role !== 'LAWYER') || (segments[0] === undefined && session.user.role !== 'CITIZEN'));

  useEffect(() => {
    if (isLoading) return;
    if (!session && !isAuthRoute) router.replace('/login');
    if (session && isAuthRoute) router.replace(destination);
    if (isWrongRoleRoute) router.replace(destination);
  }, [isLoading, session, isAuthRoute, isWrongRoleRoute, destination, router]);

  return null;
}
