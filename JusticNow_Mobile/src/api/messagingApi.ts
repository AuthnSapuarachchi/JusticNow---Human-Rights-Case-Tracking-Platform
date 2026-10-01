import { io, type Socket } from 'socket.io-client';

import { API_URL, request } from './client';

export interface Message {
  id: string;
  caseId: string;
  senderId: string;
  senderName: string;
  senderRole: 'OFFICER' | 'CITIZEN';
  content: string;
  createdAt: string;
  isRead: boolean;
  recipientId?: string | null;
  attachment?: { url: string; name?: string; type?: string } | null;
}

export interface SendMessagePayload {
  content: string;
  attachment?: { url: string; name?: string; type?: string };
  recipientId?: string;
}

export const connectToChat = (caseId: string, onMessage: (message: Message) => void, accessToken?: string): Socket => {
  const socket = io(API_URL, { transports: ['websocket'], auth: { token: accessToken } });
  socket.on('connect', () => socket.emit('chat:join', caseId));
  socket.on('chat:message', onMessage);
  return socket;
};

export async function getMessages(caseId: string): Promise<Message[]> {
  return request<Message[]>(`/api/cases/${encodeURIComponent(caseId)}/messages`);
}

export async function sendMessage(caseId: string, payload: SendMessagePayload): Promise<Message> {
  return request<Message>(`/api/cases/${encodeURIComponent(caseId)}/messages`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  await request<void>(`/api/messages/${encodeURIComponent(messageId)}/read`, { method: 'PUT' });
}

export async function uploadAttachment(caseId: string, file: { uri: string; name: string; type: string }, accessToken?: string) {
  const formData = new FormData();
  formData.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  const response = await fetch(`${API_URL}/api/cases/${encodeURIComponent(caseId)}/messages/upload`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: formData,
  });
  if (!response.ok) throw new Error('Unable to upload this attachment.');
  return response.json() as Promise<{ url: string; name: string; type: string }>;
}

export interface Officer {
  id: number;
  name?: string | null;
  email: string;
  role: 'OFFICER';
}

export function getOfficers(): Promise<Officer[]> {
  return request<Officer[]>('/api/users/officers');
}