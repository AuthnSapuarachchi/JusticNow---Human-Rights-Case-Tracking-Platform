// Flip this flag to use the live case endpoints once the backend is ready.
export const USE_MOCK_DATA = true;

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
  timeline: StatusUpdate[];
}

const mockCases: CaseDetail[] = [
  {
    id: 'case-0412', reference: 'JN-2026-0412', category: 'Community rights inquiry', status: 'in-progress', lastUpdated: '2026-08-22T09:20:00.000Z', description: 'Review of a reported restriction affecting access to community services.', requiredAction: 'Please provide a copy of the incident report to continue the review.',
    timeline: [
      { id: 'status-1', status: 'pending', label: 'Case submitted', timestamp: '2026-08-16T08:30:00.000Z', completed: true },
      { id: 'status-2', status: 'in-progress', label: 'Under review', timestamp: '2026-08-18T14:10:00.000Z', completed: true },
      { id: 'status-3', status: 'in-progress', label: 'Additional information requested', timestamp: '2026-08-22T09:20:00.000Z', completed: true },
      { id: 'status-4', status: 'resolved', label: 'Resolution', timestamp: '', completed: false },
    ],
  },
  {
    id: 'case-0398', reference: 'JN-2026-0398', category: 'Workplace discrimination', status: 'pending', lastUpdated: '2026-08-20T11:05:00.000Z', description: 'A report submitted for initial assessment by the JusticeNow team.',
    timeline: [{ id: 'status-5', status: 'pending', label: 'Case submitted', timestamp: '2026-08-20T11:05:00.000Z', completed: true }, { id: 'status-6', status: 'in-progress', label: 'Under review', timestamp: '', completed: false }, { id: 'status-7', status: 'resolved', label: 'Resolution', timestamp: '', completed: false }],
  },
  {
    id: 'case-0317', reference: 'JN-2026-0317', category: 'Access to public services', status: 'resolved', lastUpdated: '2026-08-12T16:45:00.000Z', description: 'Resolved case relating to equal access to a public facility.',
    timeline: [{ id: 'status-8', status: 'pending', label: 'Case submitted', timestamp: '2026-07-28T10:00:00.000Z', completed: true }, { id: 'status-9', status: 'in-progress', label: 'Under review', timestamp: '2026-07-30T13:25:00.000Z', completed: true }, { id: 'status-10', status: 'resolved', label: 'Resolution', timestamp: '2026-08-12T16:45:00.000Z', completed: true }],
  },
];

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? ''}${url}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getMyCases(): Promise<CaseSummary[]> {
  if (USE_MOCK_DATA) { await wait(500); return mockCases.map(({ id, reference, category, status, lastUpdated }) => ({ id, reference, category, status, lastUpdated })); }
  return request<CaseSummary[]>('/api/cases/my');
}

export async function getCaseDetail(caseId: string): Promise<CaseDetail> {
  if (USE_MOCK_DATA) { await wait(500); const found = mockCases.find((item) => item.id === caseId || item.reference === caseId); if (!found) throw new Error('Case not found'); return found; }
  return request<CaseDetail>(`/api/cases/${encodeURIComponent(caseId)}`);
}

export async function getCaseStatus(caseId: string): Promise<StatusUpdate[]> {
  if (USE_MOCK_DATA) { await wait(500); const found = mockCases.find((item) => item.id === caseId || item.reference === caseId); if (!found) throw new Error('Case not found'); return found.timeline; }
  return request<StatusUpdate[]>(`/api/cases/${encodeURIComponent(caseId)}/status`);
}