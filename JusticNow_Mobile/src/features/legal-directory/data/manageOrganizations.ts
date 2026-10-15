/**
 * Write access to the legal directory (EP-06).
 *
 * Wraps the shared `request()` helper, which attaches the access token and
 * retries once after refreshing it. Every write here is ADMIN-only on the
 * server.
 *
 * `organizations.ts` next door holds the public read path and its offline
 * fallback; this module deliberately has no fallback, because a silent stale
 * read would be misleading on a screen whose whole purpose is editing.
 */

import { request } from '@/api/client';

import type { Organization } from '../types';

/** `contact` is flattened to phone/email, matching what the endpoint accepts. */
export type OrganizationInput = Omit<Organization, 'id' | 'contact'> & {
  contactEmail: string;
  phone?: string;
};

export function fetchOrganizationsForManagement() {
  return request<Organization[]>('/api/organizations');
}

export function createOrganization(data: Partial<OrganizationInput>) {
  return request<Organization>('/api/organizations', { method: 'POST', body: JSON.stringify(data) });
}

export function updateOrganization(id: string, data: Partial<OrganizationInput>) {
  return request<Organization>(`/api/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteOrganization(id: string) {
  return request<void>(`/api/organizations/${id}`, { method: 'DELETE' });
}
