import { request } from './client';
import { OfficerCaseStatus } from '@/features/cases/statusUtils';

export type CasePriority = 'NORMAL' | 'URGENT';

export type CaseActionType =
  | 'ASSIGNED'
  | 'STATUS_CHANGED'
  | 'NOTE_ADDED'
  | 'INFO_REQUESTED'
  | 'REFERRED'
  | 'CLOSED'
  | 'ESCALATED';

export type InfoRequestStatus = 'PENDING' | 'RESOLVED';

export interface DashboardStats {
  totalAssigned: number;
  newCases: number;
  urgent: number;
  waitingForUser: number;
  investigating: number;
  recentlyUpdated: number;
}

export interface CaseOfficerUser {
  id: number;
  name: string | null;
  email: string;
  role?: string;
}

export interface CaseEvidenceItem {
  id: number;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

export interface OfficerCaseItem {
  id: number;
  description: string;
  incidentDate: string | null;
  isAnonymous: boolean;
  category: string;
  location: string | null;
  actionRequest: string | null;
  status: OfficerCaseStatus;
  priority: CasePriority;
  escalated: boolean;
  escalatedAt: string | null;
  trackingCodeId: number;
  officerId: number | null;
  reporterId: number | null;
  createdAt: string;
  updatedAt: string;
  trackingCode: {
    code: string;
  };
  officer: CaseOfficerUser | null;
  reporter: CaseOfficerUser | null;
  evidence: CaseEvidenceItem[];
  _count?: {
    notes?: number;
    infoRequests?: number;
    referrals?: number;
    actions?: number;
    evidence?: number;
  };
}

export interface CasePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OfficerCasesResponse {
  cases: OfficerCaseItem[];
  pagination: CasePagination;
}

export interface CaseNote {
  id: number;
  caseId: number;
  authorId: number;
  content: string;
  createdAt: string;
  author: CaseOfficerUser;
}

export interface CaseStatusHistoryItem {
  id: number;
  caseId: number;
  fromStatus: OfficerCaseStatus;
  toStatus: OfficerCaseStatus;
  changedById: number;
  note: string | null;
  createdAt: string;
  changedBy: CaseOfficerUser;
}

export interface CaseInfoRequestItem {
  id: number;
  caseId: number;
  requestedById: number;
  message: string;
  status: InfoRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
  requestedBy: CaseOfficerUser;
}

export interface LegalOrganizationItem {
  id: number;
  name: string;
  contactEmail: string;
  verified: boolean;
  createdAt?: string;
}

export interface CaseReferralItem {
  id: number;
  caseId: number;
  referredById: number;
  referredToOrganizationId: number | null;
  referredToText: string | null;
  reason: string;
  createdAt: string;
  referredBy: CaseOfficerUser;
  referredToOrganization: LegalOrganizationItem | null;
}

export interface CaseActionItem {
  id: number;
  caseId: number;
  actorId: number;
  actionType: CaseActionType;
  detail: string | null;
  createdAt: string;
  actor: CaseOfficerUser;
}

export interface OfficerCaseDetail {
  id: number;
  description: string;
  incidentDate: string | null;
  isAnonymous: boolean;
  category: string;
  location: string | null;
  actionRequest: string | null;
  status: OfficerCaseStatus;
  priority: CasePriority;
  escalated: boolean;
  escalatedAt: string | null;
  trackingCodeId: number;
  officerId: number | null;
  reporterId: number | null;
  createdAt: string;
  updatedAt: string;
  trackingCode: {
    id: number;
    code: string;
    pin: string;
    createdAt: string;
  };
  officer: CaseOfficerUser | null;
  reporter: CaseOfficerUser | null;
  evidence: CaseEvidenceItem[];
  notes: CaseNote[];
  statusHistory: CaseStatusHistoryItem[];
  infoRequests: CaseInfoRequestItem[];
  referrals: CaseReferralItem[];
  actions: CaseActionItem[];
}

export interface OfficerCaseFilterParams {
  page?: number;
  limit?: number;
  assignedToMe?: boolean;
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fetch officer dashboard metrics
 */
export function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>('/api/officer/dashboard/stats');
}

/**
 * Fetch paginated queue of cases with filters
 */
export function getOfficerCases(params: OfficerCaseFilterParams = {}): Promise<OfficerCasesResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.append('page', String(params.page));
  if (params.limit !== undefined) query.append('limit', String(params.limit));
  if (params.assignedToMe !== undefined) query.append('assignedToMe', String(params.assignedToMe));
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.priority && params.priority !== 'ALL') query.append('priority', params.priority);
  if (params.search?.trim()) query.append('search', params.search.trim());
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);

  const qs = query.toString();
  return request<OfficerCasesResponse>(`/api/officer/cases${qs ? `?${qs}` : ''}`);
}

/**
 * Fetch full case detail for officer view
 */
export function getOfficerCase(caseId: number | string): Promise<OfficerCaseDetail> {
  return request<OfficerCaseDetail>(`/api/officer/cases/${encodeURIComponent(caseId)}`);
}

/**
 * Assign a case to an officer (or defaults to current user if officerId is omitted)
 */
export function assignCase(
  caseId: number | string,
  officerId?: number
): Promise<{ message: string; case: OfficerCaseDetail; action: CaseActionItem }> {
  return request(`/api/officer/cases/${encodeURIComponent(caseId)}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(officerId ? { officerId } : {}),
  });
}

/**
 * Update case status with transition note
 */
export function updateCaseStatus(
  caseId: number | string,
  status: OfficerCaseStatus,
  note?: string
): Promise<{ message: string; case: OfficerCaseDetail; statusHistory: CaseStatusHistoryItem; action: CaseActionItem }> {
  return request(`/api/officer/cases/${encodeURIComponent(caseId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  });
}

/**
 * Add a private internal note
 */
export function addCaseNote(caseId: number | string, content: string): Promise<CaseNote> {
  return request(`/api/officer/cases/${encodeURIComponent(caseId)}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

/**
 * Get all private internal notes
 */
export function getCaseNotes(caseId: number | string): Promise<CaseNote[]> {
  return request<CaseNote[]>(`/api/officer/cases/${encodeURIComponent(caseId)}/notes`);
}

/**
 * Request further information from reporter
 */
export function createCaseInfoRequest(
  caseId: number | string,
  message: string
): Promise<{ message: string; infoRequest: CaseInfoRequestItem; case: OfficerCaseDetail }> {
  return request(`/api/officer/cases/${encodeURIComponent(caseId)}/info-requests`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/**
 * Refer case to a legal organization or external entity
 */
export function createCaseReferral(
  caseId: number | string,
  payload: { organizationId?: number; referredToText?: string; reason: string }
): Promise<{ message: string; referral: CaseReferralItem }> {
  return request(`/api/officer/cases/${encodeURIComponent(caseId)}/referrals`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Record a manual action in the case audit log
 */
export function createCaseAction(
  caseId: number | string,
  payload: { actionType?: CaseActionType; detail: string }
): Promise<CaseActionItem> {
  return request(`/api/officer/cases/${encodeURIComponent(caseId)}/actions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get case action / audit history
 */
export function getCaseActions(caseId: number | string): Promise<CaseActionItem[]> {
  return request<CaseActionItem[]>(`/api/officer/cases/${encodeURIComponent(caseId)}/actions`);
}

/**
 * Close a case
 */
export function closeCase(
  caseId: number | string,
  reason?: string
): Promise<{ message: string; case: OfficerCaseDetail; statusHistory: CaseStatusHistoryItem; action: CaseActionItem }> {
  return request(`/api/officer/cases/${encodeURIComponent(caseId)}/close`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Escalate case to urgent
 */
export function escalateCase(
  caseId: number | string,
  reason?: string
): Promise<{ message: string; case: OfficerCaseDetail; action: CaseActionItem }> {
  return request(`/api/officer/cases/${encodeURIComponent(caseId)}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Fetch legal organizations for referral selection
 */
export function getLegalOrganizations(): Promise<LegalOrganizationItem[]> {
  return request<LegalOrganizationItem[]>('/api/officer/organizations');
}
