import { CaseStatus } from '@/api/caseApi';

// Hex values mirror the design-system palette (warning / primary / success /
// danger / neutral) so status pills read the same on every screen.

export const statusConfig: Record<CaseStatus, { label: string; color: string; background: string; icon: 'time-outline' | 'sync-outline' | 'checkmark-circle-outline' }> = {
  pending: { label: 'Pending', color: '#B4671F', background: '#FBEEDC', icon: 'time-outline' },
  'in-progress': { label: 'In progress', color: '#0F2B5B', background: '#DCE3EF', icon: 'sync-outline' },
  resolved: { label: 'Resolved', color: '#2E7D5B', background: '#DFF0E8', icon: 'checkmark-circle-outline' },
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
  NEW: { label: 'New', color: '#0F2B5B', background: '#DCE3EF', icon: 'time-outline' },
  SUBMITTED: { label: 'Submitted', color: '#B4671F', background: '#FBEEDC', icon: 'time-outline' },
  UNDER_REVIEW: { label: 'Under review', color: '#0F2B5B', background: '#DCE3EF', icon: 'sync-outline' },
  INVESTIGATING: { label: 'Investigating', color: '#5B3FC7', background: '#EFEAFD', icon: 'search-outline' },
  WAITING_FOR_USER: { label: 'Waiting for user', color: '#B4671F', background: '#FBEEDC', icon: 'alert-circle-outline' },
  ACTION_REQUIRED: { label: 'Action required', color: '#B3261E', background: '#FBE4E2', icon: 'alert-circle-outline' },
  RESOLVED: { label: 'Resolved', color: '#2E7D5B', background: '#DFF0E8', icon: 'checkmark-circle-outline' },
  CLOSED: { label: 'Closed', color: '#5A6672', background: '#EEF1F4', icon: 'lock-closed-outline' },
};

export const getOfficerStatusConfig = (status?: string | null) => {
  if (!status) {
    return {
      label: 'Unknown',
      color: '#5A6672',
      background: '#EEF1F4',
      icon: 'time-outline' as const,
    };
  }
  return (
    officerStatusConfig[status as OfficerCaseStatus] || {
      label: status.replace(/_/g, ' '),
      color: '#5A6672',
      background: '#EEF1F4',
      icon: 'time-outline' as const,
    }
  );
};

export const formatCaseDate = (date: string) => date ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date)) : 'Awaiting update';

export const formatCaseDateTime = (date: string) => date ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date)) : 'Not yet reached';