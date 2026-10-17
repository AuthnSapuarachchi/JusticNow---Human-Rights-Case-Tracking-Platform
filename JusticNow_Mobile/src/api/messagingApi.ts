import { Platform } from 'react-native';

import { API_URL, request, requestMultipart } from './client';
import { nativeFormDataFile } from './formDataFile';
import { getSocket } from './socket';

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

type ChatHandlers = {
  onMessage: (message: Message) => void;
  /** Fired after every successful (re)join — use it to fetch anything missed while offline. */
  onJoined?: () => void;
  onConnectionChange?: (connected: boolean) => void;
};

/**
 * Live updates for one case conversation over the shared app socket.
 * Re-joins the room automatically after every reconnect. Returns an unsubscribe.
 */
export function subscribeToChat(caseId: string, { onMessage, onJoined, onConnectionChange }: ChatHandlers): () => void {
  const socket = getSocket();
  // The server answers with the numeric id even when we joined by tracking code.
  let joinedId: string | null = null;

  const join = () => {
    socket.emit('chat:join', caseId);
    onConnectionChange?.(true);
  };
  const handleJoined = (id: string) => {
    joinedId = id;
    onJoined?.();
  };
  const handleMessage = (message: Message) => {
    if (message.caseId === caseId || message.caseId === joinedId) onMessage(message);
  };
  const handleDisconnect = () => onConnectionChange?.(false);

  socket.on('connect', join);
  socket.on('disconnect', handleDisconnect);
  socket.on('chat:joined', handleJoined);
  socket.on('chat:message', handleMessage);
  if (socket.connected) join();
  else onConnectionChange?.(false);

  return () => {
    socket.emit('chat:leave', caseId);
    socket.off('connect', join);
    socket.off('disconnect', handleDisconnect);
    socket.off('chat:joined', handleJoined);
    socket.off('chat:message', handleMessage);
  };
}

/**
 * Attachment URLs are Supabase https links (current), or `/uploads/...` paths on the
 * API server (older messages). A few old rows saved the full `http://<old-ip>:5000/uploads/...`
 * address, which breaks once the laptop's IP changes, so those go through the current API host.
 */
export const resolveMediaUrl = (url: string) => {
  const legacyUpload = url.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/);
  if (legacyUpload) return `${API_URL}${legacyUpload[1]}`;
  return /^https?:\/\//.test(url) ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const isImageAttachment = (attachment?: { url: string; type?: string; name?: string } | null) =>
  Boolean(attachment && (attachment.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic)$/i.test(attachment.name || attachment.url)));

export async function getMessages(caseId: string): Promise<Message[]> {
  return request<Message[]>(`/api/cases/${encodeURIComponent(caseId)}/messages`);
}

export async function sendMessage(caseId: string, payload: SendMessagePayload): Promise<Message> {
  return request<Message>(`/api/cases/${encodeURIComponent(caseId)}/messages`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  await request<void>(`/api/messages/${encodeURIComponent(messageId)}/read`, { method: 'PUT' });
}

export async function uploadAttachment(caseId: string, file: { uri: string; name: string; type: string; file?: Blob }) {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    // Browsers need real file data; the { uri } shape below only works natively.
    const blob: Blob = file.file ?? (await (await fetch(file.uri)).blob());
    formData.append('file', blob, file.name);
  } else {
    formData.append('file', nativeFormDataFile(file.uri, file.name, file.type));
  }
  // requestMultipart refreshes an expired token and surfaces the server's error message.
  return requestMultipart<{ url: string; name: string; type: string }>(`/api/cases/${encodeURIComponent(caseId)}/messages/upload`, formData);
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