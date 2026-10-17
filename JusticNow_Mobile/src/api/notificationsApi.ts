import { request } from './client';

export type NotificationType = 'OFFICER_PENDING' | 'CASE_UNASSIGNED' | 'CASE_ASSIGNED' | 'NEW_MESSAGE' | 'ACCOUNT_APPROVED' | 'REFRESH';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  /** Live events only: refresh the list without sound or a banner. */
  silent?: boolean;
}

/** Admins and officers only. Built from live data, newest first. */
export function getNotifications(): Promise<AppNotification[]> {
  return request<AppNotification[]>('/api/notifications');
}
