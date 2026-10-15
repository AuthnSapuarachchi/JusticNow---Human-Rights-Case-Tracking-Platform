import { CaseStatus } from '@/api/caseApi';

export const statusConfig: Record<CaseStatus, { label: string; color: string; background: string; icon: 'time-outline' | 'sync-outline' | 'checkmark-circle-outline' }> = {
  pending: { label: 'Pending', color: '#b96925', background: '#fff0df', icon: 'time-outline' },
  'in-progress': { label: 'In progress', color: '#2875d0', background: '#e7f0fc', icon: 'sync-outline' },
  resolved: { label: 'Resolved', color: '#28725b', background: '#e2f2ed', icon: 'checkmark-circle-outline' },
};

export const getStatusConfig = (status: CaseStatus) => statusConfig[status];

export type OfficerCaseStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACTION_REQUIRED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'NEW'
  | 'WAITING_FOR_USER'
  | 'INVESTIGATING';

export const officerStatusConfig: Record<
  OfficerCaseStatus,
  { label: string; color: string; background: string; icon: 'time-outline' | 'sync-outline' | 'checkmark-circle-outline' | 'alert-circle-outline' | 'lock-closed-outline' | 'search-outline' }
> = {
  NEW: { label: 'New', color: '#2875d0', background: '#e7f0fc', icon: 'time-outline' },
  SUBMITTED: { label: 'Submitted', color: '#b96925', background: '#fff0df', icon: 'time-outline' },
  UNDER_REVIEW: { label: 'Under review', color: '#2875d0', background: '#e7f0fc', icon: 'sync-outline' },
  INVESTIGATING: { label: 'Investigating', color: '#5b3fc7', background: '#efeafd', icon: 'search-outline' },
  WAITING_FOR_USER: { label: 'Waiting for user', color: '#b96925', background: '#fff0df', icon: 'alert-circle-outline' },
  ACTION_REQUIRED: { label: 'Action required', color: '#d04f28', background: '#fcebe7', icon: 'alert-circle-outline' },
  RESOLVED: { label: 'Resolved', color: '#28725b', background: '#e2f2ed', icon: 'checkmark-circle-outline' },
  CLOSED: { label: 'Closed', color: '#718088', background: '#edf1f2', icon: 'lock-closed-outline' },
};

export const getOfficerStatusConfig = (status?: string | null) => {
  if (!status) {
    return {
      label: 'Unknown',
      color: '#718088',
      background: '#edf1f2',
      icon: 'time-outline' as const,
    };
  }
  return (
    officerStatusConfig[status as OfficerCaseStatus] || {
      label: status.replace(/_/g, ' '),
      color: '#718088',
      background: '#edf1f2',
      icon: 'time-outline' as const,
    }
  );
};

export const formatCaseDate = (date: string) => date ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date)) : 'Awaiting update';

export const formatCaseDateTime = (date: string) => date ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date)) : 'Not yet reached';