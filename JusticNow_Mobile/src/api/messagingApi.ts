import { io, type Socket } from 'socket.io-client';

import { API_URL, request } from './client';

export const USE_MOCK_DATA = false;

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

const mockMessages: Message[] = [
  { id: 'message-001', caseId: 'JN-2026-0412', senderId: 'officer-014', senderName: 'Maya Perera', senderRole: 'OFFICER', content: 'Hello. I have reviewed the latest update on your case.', createdAt: '2026-08-22T09:15:00.000Z', isRead: true },
  { id: 'message-002', caseId: 'JN-2026-0412', senderId: 'citizen-001', senderName: 'You', senderRole: 'CITIZEN', content: 'Thank you. Is there anything else you need from me?', createdAt: '2026-08-22T09:17:00.000Z', isRead: true },
  { id: 'message-003', caseId: 'JN-2026-0412', senderId: 'officer-014', senderName: 'Maya Perera', senderRole: 'OFFICER', content: 'A copy of the incident report would help us complete the review.', createdAt: '2026-08-22T09:20:00.000Z', isRead: false },
  { id: 'message-004', caseId: 'JN-2026-0412', senderId: 'citizen-001', senderName: 'You', senderRole: 'CITIZEN', content: 'I can send that today. I appreciate your help.', createdAt: '2026-08-22T09:24:00.000Z', isRead: true },
  { id: 'message-005', caseId: 'JN-2026-0412', senderId: 'officer-014', senderName: 'Maya Perera', senderRole: 'OFFICER', content: 'That would be perfect. I will notify you when the review progresses.', createdAt: '2026-08-22T09:26:00.000Z', isRead: false },
  { id: 'message-006', caseId: 'JN-2026-0412', senderId: 'officer-022', senderName: 'Daniel Silva', senderRole: 'OFFICER', content: 'I have added a note from the review team to your case.', createdAt: '2026-08-21T15:40:00.000Z', isRead: true },
  { id: 'message-007', caseId: 'JN-2026-0412', senderId: 'officer-022', senderName: 'Daniel Silva', senderRole: 'OFFICER', content: 'Please let us know if you have any questions.', createdAt: '2026-08-21T15:42:00.000Z', isRead: false },
];

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

export async function getMessages(caseId: string): Promise<Message[]> {
  if (USE_MOCK_DATA) {
    await wait(500);
    return mockMessages.map((message) => ({ ...message, caseId }));
  }
  return request<Message[]>(`/api/cases/${encodeURIComponent(caseId)}/messages`);
}

export async function sendMessage(caseId: string, payload: SendMessagePayload): Promise<Message> {
  if (USE_MOCK_DATA) {
    await wait(500);
    return { id: `message-${Date.now()}`, caseId, senderId: 'citizen-001', senderName: 'You', senderRole: 'CITIZEN', content: payload.content, createdAt: new Date().toISOString(), isRead: false };
  }
  return request<Message>(`/api/cases/${encodeURIComponent(caseId)}/messages`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await wait(500);
    return;
  }
  await request<void>(`/api/messages/${encodeURIComponent(messageId)}/read`, { method: 'PUT' });
}

export async function uploadAttachment(file: { uri: string; name: string; type: string }, accessToken?: string) {
  const formData = new FormData();
  formData.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  const response = await fetch(`${API_URL}/api/messages/upload`, {
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