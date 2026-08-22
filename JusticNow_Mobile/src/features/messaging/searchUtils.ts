import { Message } from '@/api/messagingApi';

export function filterMessages(messages: Message[], query: string): Message[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return messages;

  return messages.filter((message) => message.content.toLocaleLowerCase().includes(normalizedQuery));
}