/**
 * Write access to Know Your Rights content (EP-07).
 *
 * Wraps the shared `request()` helper, which attaches the access token and
 * retries once after refreshing it. Every endpoint here is ADMIN-only on the
 * server, so a failed role check surfaces as a 401/403 rather than silently
 * succeeding.
 *
 * `rights.ts` next door holds the public read path.
 */

import { request } from '@/api/client';

/** Full category record, children included - the read shape for editing. */
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

// Returns ids and nested children, which the public list endpoint omits.
export function fetchRightsForManagement() {
  return request<ManagedRightsCategory[]>('/api/rights/manage');
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
