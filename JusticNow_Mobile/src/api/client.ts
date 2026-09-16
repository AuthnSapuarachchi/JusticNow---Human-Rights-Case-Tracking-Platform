import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Point this at whichever machine is running the backend.
 *
 * A hardcoded LAN IP cannot be right for everyone - it is whoever committed
 * last, and it breaks for the rest of the team on every network change. So it
 * now reads EXPO_PUBLIC_API_URL first and only falls back to the literal.
 *
 * Create JusticNow_Mobile/.env.local (already gitignored) with your own address:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.5:5000
 * Find your IP with `ipconfig` (Windows) or `ifconfig` (macOS/Linux).
 *
 * Expo inlines EXPO_PUBLIC_* at build time, so restart the dev server after
 * changing it.
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.134.76:5000';
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

export async function requestMultipart<T>(path: string, body: FormData, hasRetried = false): Promise<T> {
	const session = await readSession();
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);

	try {
		console.info(`[API] multipart POST ${API_URL}${path}`);
		const response = await fetch(`${API_URL}${path}`, {
			method: 'POST',
			body,
			signal: controller.signal,
			headers: {
				Accept: 'application/json',
				...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
			},
		});
		const result = (await response.json().catch(() => ({}))) as T & ApiError;
		console.info(`[API] multipart response ${response.status}`);

		if (response.status === 401 && !hasRetried && session?.refreshToken) {
			console.info('[API] multipart access token rejected; attempting refresh');
			const refreshedToken = await refreshAccessToken(session);
			if (refreshedToken) return requestMultipart<T>(path, body, true);
			await AsyncStorage.removeItem('justicenow.session');
			throw new Error('Your session has expired. Please sign in again.');
		}
		if (response.status === 401) {
			await AsyncStorage.removeItem('justicenow.session');
			throw new Error('Your session is invalid. Please sign in again.');
		}

		if (!response.ok) throw new Error(result.error ?? `Request failed with status ${response.status}.`);
		return result;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error('The server did not respond within 15 seconds. Check that the backend is running and the API address is reachable.');
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

export { API_URL };
