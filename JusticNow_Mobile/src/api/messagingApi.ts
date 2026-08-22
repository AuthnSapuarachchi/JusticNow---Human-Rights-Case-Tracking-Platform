export const USE_MOCK_DATA = true;

export interface Message {
  id: string;
  caseId: string;
  senderId: string;
  senderName: string;
  senderRole: 'Officer' | 'Citizen';
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface SendMessagePayload {
  content: string;
}

const mockMessages: Message[] = [
  { id: 'message-001', caseId: 'JN-2026-0412', senderId: 'officer-014', senderName: 'Maya Perera', senderRole: 'Officer', content: 'Hello. I have reviewed the latest update on your case.', createdAt: '2026-08-22T09:15:00.000Z', isRead: true },
  { id: 'message-002', caseId: 'JN-2026-0412', senderId: 'citizen-001', senderName: 'You', senderRole: 'Citizen', content: 'Thank you. Is there anything else you need from me?', createdAt: '2026-08-22T09:17:00.000Z', isRead: true },
  { id: 'message-003', caseId: 'JN-2026-0412', senderId: 'officer-014', senderName: 'Maya Perera', senderRole: 'Officer', content: 'A copy of the incident report would help us complete the review.', createdAt: '2026-08-22T09:20:00.000Z', isRead: false },
  { id: 'message-004', caseId: 'JN-2026-0412', senderId: 'citizen-001', senderName: 'You', senderRole: 'Citizen', content: 'I can send that today. I appreciate your help.', createdAt: '2026-08-22T09:24:00.000Z', isRead: true },
  { id: 'message-005', caseId: 'JN-2026-0412', senderId: 'officer-014', senderName: 'Maya Perera', senderRole: 'Officer', content: 'That would be perfect. I will notify you when the review progresses.', createdAt: '2026-08-22T09:26:00.000Z', isRead: false },
];

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? ''}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

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
    return { id: `message-${Date.now()}`, caseId, senderId: 'citizen-001', senderName: 'You', senderRole: 'Citizen', content: payload.content, createdAt: new Date().toISOString(), isRead: false };
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