import { request } from './client';

export type CaseStatus = 'pending' | 'in-progress' | 'resolved';

export interface CaseSummary {
  id: string;
  reference: string;
  category: string;
  status: CaseStatus;
  lastUpdated: string;
}

export interface StatusUpdate {
  id: string;
  status: CaseStatus;
  label: string;
  timestamp: string;
  completed: boolean;
}

export interface CaseDetail extends CaseSummary {
  description: string;
  requiredAction?: string;
  incidentDate?: string | null;
  location?: string | null;
  evidence?: { id: number; fileUrl: string; fileType: string }[];
  timeline: StatusUpdate[];
}

export function getMyCases(): Promise<CaseSummary[]> { return request<CaseSummary[]>('/api/cases/my'); }

export function getCaseDetail(caseId: string): Promise<CaseDetail> { return request<CaseDetail>(`/api/cases/${encodeURIComponent(caseId)}`); }

export function getCaseStatus(caseId: string): Promise<StatusUpdate[]> { return request<StatusUpdate[]>(`/api/cases/${encodeURIComponent(caseId)}/status`); }