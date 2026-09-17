/**
 * Content management API for EP-06 and EP-07.
 *
 * Wraps the shared `request()` helper, which already attaches the access token
 * and retries once after refreshing it. Every endpoint below is ADMIN-only on
 * the server; the screens are additionally behind the /admin route guard.
 */

import { request } from '@/api/client';
import type { Organization } from '@/features/legal-directory/types';

/** Full category record as the admin endpoint returns it, children included. */
export type ManagedRightsCategory = {
  id: number;
  categoryId: string;
  locale: string;
  icon: string;
  title: string;
  description: string;
  intro: string;
  sources: string;
  order: number;
  protections: ManagedProtection[];
  faqs: ManagedFaq[];
};

export type ManagedProtection = {
  id: number;
  protectionId: string;
  icon: string;
  title: string;
  body: string;
  order: number;
};

export type ManagedFaq = {
  id: number;
  faqId: string;
  question: string;
  answer: string;
  order: number;
};

// --- Know Your Rights ---

export function fetchRightsForManagement() {
  return request<ManagedRightsCategory[]>('/api/rights/admin');
}

export function createRightsCategory(data: Partial<ManagedRightsCategory>) {
  return request<ManagedRightsCategory>('/api/rights', { method: 'POST', body: JSON.stringify(data) });
}

export function updateRightsCategory(id: number, data: Partial<ManagedRightsCategory>) {
  return request<ManagedRightsCategory>(`/api/rights/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteRightsCategory(id: number) {
  return request<void>(`/api/rights/${id}`, { method: 'DELETE' });
}

export function createProtection(categoryId: number, data: Partial<ManagedProtection>) {
  return request<ManagedProtection>(`/api/rights/${categoryId}/protections`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProtection(id: number, data: Partial<ManagedProtection>) {
  return request<ManagedProtection>(`/api/rights/protections/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteProtection(id: number) {
  return request<void>(`/api/rights/protections/${id}`, { method: 'DELETE' });
}

export function createFaq(categoryId: number, data: Partial<ManagedFaq>) {
  return request<ManagedFaq>(`/api/rights/${categoryId}/faqs`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateFaq(id: number, data: Partial<ManagedFaq>) {
  return request<ManagedFaq>(`/api/rights/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteFaq(id: number) {
  return request<void>(`/api/rights/faqs/${id}`, { method: 'DELETE' });
}

// --- Legal directory ---

export function fetchOrganizations() {
  return request<Organization[]>('/api/organizations');
}

/** `contact` is flattened to phone/email, matching what the endpoint accepts. */
export type OrganizationInput = Omit<Organization, 'id' | 'contact'> & {
  contactEmail: string;
  phone?: string;
};

export function createOrganization(data: Partial<OrganizationInput>) {
  return request<Organization>('/api/organizations', { method: 'POST', body: JSON.stringify(data) });
}

export function updateOrganization(id: string, data: Partial<OrganizationInput>) {
  return request<Organization>(`/api/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteOrganization(id: string) {
  return request<void>(`/api/organizations/${id}`, { method: 'DELETE' });
}
