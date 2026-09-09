import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

export type ApiError = { error?: string };

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(`${API_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	});

	const body = (await response.json().catch(() => ({}))) as T & ApiError;
	if (!response.ok) {
		throw new Error(body.error ?? 'Something went wrong. Please try again.');
	}

	return body;
}

export { API_URL };
