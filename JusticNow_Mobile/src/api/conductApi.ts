import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { request } from './client';
import { getSocket } from './socket';

/**
 * Officer conduct: citizens report their case officer, admins review reports
 * and talk to officers (messages and formal warnings) in one shared thread.
 * Officers never receive complaints or complaint ids — see conductController.js.
 */

export type ComplaintReason = 'NO_RESPONSE' | 'UNPROFESSIONAL' | 'PRESSURE_OR_THREAT' | 'PRIVACY_BREACH' | 'ASKED_FOR_PAYMENT' | 'OTHER';
export type ComplaintStatus = 'OPEN' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'DISMISSED';
export type StaffMessageKind = 'MESSAGE' | 'WARNING';

/** Mirrors the server's limits so the form can say so before sending. */
export const COMPLAINT_DETAILS_MIN = 20;
export const CONDUCT_TEXT_MAX = 2000;
export const RESOLUTION_NOTE_MIN = 10;

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Plain-language reasons, in the order the citizen sees them. */
export const COMPLAINT_REASONS: { value: ComplaintReason; label: string; hint: string; icon: IconName }[] = [
  { value: 'NO_RESPONSE', label: 'Not responding', hint: 'Ignores my messages or does not update my case', icon: 'time-outline' },
  { value: 'UNPROFESSIONAL', label: 'Rude or disrespectful', hint: 'Spoke to me in a rude, mocking or unfair way', icon: 'sad-outline' },
  { value: 'PRESSURE_OR_THREAT', label: 'Pressured or threatened me', hint: 'Pushed me to drop or change my report', icon: 'warning-outline' },
  { value: 'PRIVACY_BREACH', label: 'Shared my private details', hint: 'Told others about me or my report without asking', icon: 'eye-outline' },
  { value: 'ASKED_FOR_PAYMENT', label: 'Asked me for money', hint: 'Wanted a payment, gift or favour to help me', icon: 'cash-outline' },
  { value: 'OTHER', label: 'Something else', hint: 'Any other problem with how my case is handled', icon: 'ellipsis-horizontal-circle-outline' },
];

export const complaintReasonLabel = (reason: ComplaintReason) =>
  COMPLAINT_REASONS.find((item) => item.value === reason)?.label ?? 'Something else';

/** Label + badge tone for each status. The label always carries the meaning, never the colour alone. */
export const COMPLAINT_STATUS: Record<ComplaintStatus, { label: string; tone: 'warning' | 'info' | 'success' | 'neutral'; icon: IconName }> = {
  OPEN: { label: 'Waiting for review', tone: 'warning', icon: 'hourglass-outline' },
  UNDER_REVIEW: { label: 'Under review', tone: 'info', icon: 'search-outline' },
  ACTION_TAKEN: { label: 'Action taken', tone: 'success', icon: 'checkmark-circle-outline' },
  DISMISSED: { label: 'Closed, no action', tone: 'neutral', icon: 'close-circle-outline' },
};

export const isComplaintActive = (status: ComplaintStatus) => status === 'OPEN' || status === 'UNDER_REVIEW';

// ---------------------------------------------------------------------------
// Citizen
// ---------------------------------------------------------------------------

export interface CitizenComplaint {
  id: number;
  reason: ComplaintReason;
  details: string;
  status: ComplaintStatus;
  resolutionNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export function getCaseComplaints(caseId: string): Promise<CitizenComplaint[]> {
  return request<CitizenComplaint[]>(`/api/cases/${encodeURIComponent(caseId)}/complaints`);
}

export function reportOfficer(caseId: string, payload: { reason: ComplaintReason; details: string }): Promise<CitizenComplaint> {
  return request<CitizenComplaint>(`/api/cases/${encodeURIComponent(caseId)}/complaints`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Admin: complaint review
// ---------------------------------------------------------------------------

export interface StaffMessage {
  id: number;
  officerId: number;
  kind: StaffMessageKind;
  content: string;
  fromAdmin: boolean;
  senderName: string;
  createdAt: string;
  readAt: string | null;
  /** Admin view only. */
  complaintId?: number | null;
}

export interface AdminComplaint {
  id: number;
  reason: ComplaintReason;
  details: string;
  status: ComplaintStatus;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedBy: { id: number; name: string | null } | null;
  case: { id: number; reference: string; category: string; status: string; isAnonymous: boolean; currentOfficerId: number | null };
  /** Null when the case was reported anonymously. */
  reporter: { id: number; name: string | null; email: string } | null;
  officer: { id: number; name: string | null; email: string; isActive: boolean };
}

export interface AdminComplaintDetail extends AdminComplaint {
  officerRecord: { totalComplaints: number; activeComplaints: number; warningsSent: number };
  linkedMessages: StaffMessage[];
}

export function getComplaints(statuses: ComplaintStatus[] = []): Promise<{ complaints: AdminComplaint[]; counts: Partial<Record<ComplaintStatus, number>> }> {
  const query = statuses.length ? `?status=${statuses.join(',')}` : '';
  return request(`/api/admin/complaints${query}`);
}

export function getComplaint(id: string | number): Promise<AdminComplaintDetail> {
  return request<AdminComplaintDetail>(`/api/admin/complaints/${encodeURIComponent(String(id))}`);
}

export function reviewComplaint(id: number, payload: { status: Exclude<ComplaintStatus, 'OPEN'>; resolutionNote?: string }): Promise<AdminComplaint> {
  return request<AdminComplaint>(`/api/admin/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

// ---------------------------------------------------------------------------
// Admin <-> officer channel
// ---------------------------------------------------------------------------

export interface StaffThread {
  officerId: number;
  officerName: string;
  officerActive: boolean;
  lastMessage: StaffMessage;
  unreadCount: number;
  /** Officer view: an unread formal warning is waiting. */
  hasUnreadWarning: boolean;
  /** Admin view: open or in-review reports against this officer. */
  activeComplaints?: number;
}

/** Officers pass `'me'`; admins pass the officer's id. */
export type ThreadKey = number | 'me';

export function getStaffThreads(): Promise<StaffThread[]> {
  return request<StaffThread[]>('/api/staff-chat/threads');
}

export function getStaffMessages(officer: ThreadKey, before?: number): Promise<{
  officer: { id: number; name: string | null; email: string; isActive: boolean };
  messages: StaffMessage[];
  hasMore: boolean;
}> {
  return request(`/api/staff-chat/${officer}/messages${before ? `?before=${before}` : ''}`);
}

export function sendStaffMessage(officer: ThreadKey, payload: { content: string; kind?: StaffMessageKind; complaintId?: number }): Promise<StaffMessage> {
  return request<StaffMessage>(`/api/staff-chat/${officer}/messages`, { method: 'POST', body: JSON.stringify(payload) });
}

/** Live messages for one officer's thread over the shared socket. Returns an unsubscribe. */
export function subscribeToStaffThread(officerId: number, onMessage: (message: StaffMessage) => void): () => void {
  const socket = getSocket();
  const handle = (message: StaffMessage) => {
    if (message.officerId === officerId) onMessage(message);
  };
  socket.on('staff:message', handle);
  return () => {
    socket.off('staff:message', handle);
  };
}
