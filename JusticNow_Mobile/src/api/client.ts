import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

export type ApiError = { error?: string };

type StoredSession = { accessToken?: string; refreshToken?: string };

async function readSession(): Promise<StoredSession | null> {
	const storedSession = await AsyncStorage.getItem('justicenow.session');
	return storedSession ? JSON.parse(storedSession) as StoredSession : null;
}

async function refreshAccessToken(session: StoredSession): Promise<string | null> {
	if (!session.refreshToken) return null;
	const response = await fetch(`${API_URL}/api/auth/refresh`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refreshToken: session.refreshToken }),
	});
	if (!response.ok) return null;
	const result = await response.json() as { accessToken?: string };
	if (!result.accessToken) return null;
	await AsyncStorage.setItem('justicenow.session', JSON.stringify({ ...session, accessToken: result.accessToken }));
	return result.accessToken;
}

export async function request<T>(path: string, options: RequestInit = {}, hasRetried = false): Promise<T> {
	const session = await readSession();
	const response = await fetch(`${API_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
			...options.headers,
		},
	});

	if (response.status === 401 && !hasRetried && session?.refreshToken && !path.includes('/auth/')) {
		const refreshedToken = await refreshAccessToken(session);
		if (refreshedToken) return request<T>(path, options, true);
		await AsyncStorage.removeItem('justicenow.session');
	}

	const body = (await response.json().catch(() => ({}))) as T & ApiError;
	if (!response.ok) {
		throw new Error(body.error ?? 'Something went wrong. Please try again.');
	}

	return body;
}

export { API_URL };
