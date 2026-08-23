import { CaseStatus } from '@/api/caseApi';

export const statusConfig: Record<CaseStatus, { label: string; color: string; background: string; icon: 'time-outline' | 'sync-outline' | 'checkmark-circle-outline' }> = {
  pending: { label: 'Pending', color: '#b96925', background: '#fff0df', icon: 'time-outline' },
  'in-progress': { label: 'In progress', color: '#2875d0', background: '#e7f0fc', icon: 'sync-outline' },
  resolved: { label: 'Resolved', color: '#28725b', background: '#e2f2ed', icon: 'checkmark-circle-outline' },
};

export const getStatusConfig = (status: CaseStatus) => statusConfig[status];

export const formatCaseDate = (date: string) => date ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date)) : 'Awaiting update';

export const formatCaseDateTime = (date: string) => date ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date)) : 'Not yet reached';