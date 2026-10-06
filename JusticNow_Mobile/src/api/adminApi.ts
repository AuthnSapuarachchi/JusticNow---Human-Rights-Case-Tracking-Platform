import { request } from './client';
import { CasePriority } from './officerApi';
import { OfficerCaseStatus } from '@/features/cases/statusUtils';

export type ViolationCategoryCode =
  | 'WORKPLACE_DISCRIMINATION'
  | 'HUMAN_RIGHTS_VIOLATION'
  | 'DIGITAL_PRIVACY'
  | 'OTHER';

export interface AdminOfficer {
  id: number;
  name: string | null;
  email: string;
  role: 'OFFICER';
  isActive: boolean;
  organizationId: number | null;
  organization: { id: number; name: string } | null;
  createdAt: string;
  openCases: number;
}

export interface AttentionCase {
  id: number;
  category: ViolationCategoryCode;
  status: OfficerCaseStatus;
  priority: CasePriority;
  updatedAt: string;
  trackingCode: { code: string } | null;
  officer: { id: number; name: string | null; email: string } | null;
}

export interface AdminStats {
  totalCases: number;
  unassigned: number;
  urgent: number;
  newThisWeek: number;
  resolvedThisMonth: number;
  byStatus: { status: OfficerCaseStatus; count: number }[];
  byCategory: { category: ViolationCategoryCode; count: number }[];
  byPriority: { priority: CasePriority; count: number }[];
  officerWorkload: { id: number; name: string | null; email: string; openCases: number }[];
  needsAttention: AttentionCase[];
}

export interface AdminOrganization {
  id: number;
  name: string;
  contactEmail: string;
  phone: string | null;
  location: string | null;
  description: string | null;
  verified: boolean;
  createdAt: string;
  _count?: { officers: number; referrals: number };
}

export interface AdminCategory {
  id: number;
  code: ViolationCategoryCode;
  label: string;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
  caseCount: number;
}

export interface OfficerInput {
  name?: string;
  email?: string;
  password?: string;
  organizationId?: number | null;
  isActive?: boolean;
}

export interface OrganizationInput {
  name?: string;
  contactEmail?: string;
  phone?: string;
  location?: string;
  description?: string;
  verified?: boolean;
}

export interface CategoryInput {
  label?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Anonymized platform statistics
 */
export function getAdminStats(): Promise<AdminStats> {
  return request<AdminStats>('/api/admin/stats');
}

/**
 * Officer accounts
 */
export function getAdminOfficers(params: { active?: boolean } = {}): Promise<AdminOfficer[]> {
  const qs = params.active !== undefined ? `?active=${params.active}` : '';
  return request<AdminOfficer[]>(`/api/admin/officers${qs}`);
}

export function createOfficer(input: OfficerInput): Promise<AdminOfficer> {
  return request<AdminOfficer>('/api/admin/officers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateOfficer(officerId: number, input: OfficerInput): Promise<AdminOfficer> {
  return request<AdminOfficer>(`/api/admin/officers/${officerId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/**
 * Legal-support organizations
 */
export function getAdminOrganizations(): Promise<AdminOrganization[]> {
  return request<AdminOrganization[]>('/api/admin/organizations');
}

export function createOrganization(input: OrganizationInput): Promise<AdminOrganization> {
  return request<AdminOrganization>('/api/admin/organizations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateOrganization(orgId: number, input: OrganizationInput): Promise<AdminOrganization> {
  return request<AdminOrganization>(`/api/admin/organizations/${orgId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteOrganization(orgId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/admin/organizations/${orgId}`, { method: 'DELETE' });
}

/**
 * Violation categories
 */
export function getAdminCategories(): Promise<AdminCategory[]> {
  return request<AdminCategory[]>('/api/admin/categories');
}

export function updateCategory(code: ViolationCategoryCode, input: CategoryInput): Promise<AdminCategory> {
  return request<AdminCategory>(`/api/admin/categories/${code}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export const formatCategoryCode = (code?: string | null) =>
  code ? code.charAt(0) + code.slice(1).toLowerCase().replace(/_/g, ' ') : 'Uncategorized';
