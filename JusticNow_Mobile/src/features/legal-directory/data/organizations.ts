/**
 * Mock organisations for EP-06 (JN-29).
 *
 * Placeholder Sri Lankan organisations — plausible but fictional, so nothing
 * here implies a real body endorses the app. Distances are kilometres.
 *
 * Shaped to `Organization` so swapping to a real `fetch` is a one-line change
 * in `getOrganizations()` once the backend models these fields.
 */

import type { Organization } from '../types';

export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-001',
    name: 'Colombo Legal Aid Centre',
    description:
      'Free legal advice and court representation for low-income families across the Western Province.',
    verified: true,
    languages: ['si', 'ta', 'en'],
    categories: ['legalAid', 'humanRights'],
    isFree: true,
    distanceKm: 2.4,
    location: 'Colombo 07',
    contact: { phone: '+94 11 234 5678', email: 'help@colombolegalaid.lk' },
  },
  {
    id: 'org-002',
    name: "Workers' Rights Collective",
    description:
      'Supports employees facing unfair dismissal, unpaid wages and unsafe working conditions.',
    verified: true,
    languages: ['si', 'ta', 'en'],
    categories: ['workplaceRights', 'legalAid'],
    isFree: true,
    distanceKm: 5.1,
    location: 'Kotahena, Colombo 13',
    contact: { phone: '+94 11 345 6789', email: 'contact@workersrights.lk' },
  },
  {
    id: 'org-003',
    name: "Women's Advocacy Network",
    description:
      'Legal support and counselling for women facing domestic violence, harassment or discrimination.',
    verified: true,
    languages: ['si', 'en'],
    categories: ['womensRights', 'counselling'],
    isFree: true,
    distanceKm: 8.0,
    location: 'Nugegoda',
    contact: { phone: '+94 11 456 7890', email: 'support@womensadvocacy.lk' },
  },
  {
    id: 'org-004',
    name: 'Jaffna Community Law Centre',
    description:
      'Community legal clinic serving the Northern Province, with a focus on land and property disputes.',
    verified: true,
    languages: ['ta', 'en'],
    categories: ['landRights', 'legalAid', 'humanRights'],
    isFree: true,
    distanceKm: 12.6,
    location: 'Jaffna',
    contact: { phone: '+94 21 222 3344', email: 'info@jaffnalawcentre.lk' },
  },
  {
    id: 'org-005',
    name: 'Kandy Human Rights Clinic',
    description:
      'Documents human-rights violations and assists complainants before the Human Rights Commission.',
    verified: true,
    languages: ['si', 'ta', 'en'],
    categories: ['humanRights'],
    isFree: true,
    distanceKm: 15.3,
    location: 'Kandy',
    contact: { email: 'clinic@kandyhrc.lk' },
  },
  {
    id: 'org-006',
    name: 'Silva & Associates',
    description:
      'Private practice handling employment disputes and constitutional matters. Initial consultation chargeable.',
    verified: false,
    languages: ['si', 'en'],
    categories: ['workplaceRights', 'legalAid'],
    isFree: false,
    distanceKm: 3.7,
    location: 'Colombo 03',
    contact: { phone: '+94 11 567 8901', email: 'chambers@silva-associates.lk' },
  },
  {
    id: 'org-007',
    name: 'Child Protection Legal Unit',
    description:
      'Legal assistance in cases of child abuse, exploitation and denial of access to education.',
    verified: true,
    languages: ['si', 'ta', 'en'],
    categories: ['childRights', 'counselling'],
    isFree: true,
    distanceKm: 6.9,
    location: 'Rajagiriya',
    contact: { phone: '+94 11 678 9012', email: 'protect@cplu.lk' },
  },
  {
    id: 'org-008',
    name: 'Galle Legal Support Trust',
    description:
      'Southern Province legal aid, including assistance for fisher communities and coastal land disputes.',
    verified: false,
    languages: ['si', 'en'],
    categories: ['legalAid', 'landRights'],
    isFree: true,
    distanceKm: 22.4,
    location: 'Galle',
    contact: { phone: '+94 91 223 4455' },
  },
];

/**
 * Stands in for the eventual API call.
 *
 * Deliberately async and slightly delayed so the screens exercise their real
 * loading and error states rather than rendering synchronously — otherwise the
 * swap to a real endpoint surfaces bugs that were hidden all along.
 */
export async function getOrganizations(): Promise<Organization[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return MOCK_ORGANIZATIONS;
}

export async function getOrganizationById(id: string): Promise<Organization | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return MOCK_ORGANIZATIONS.find((organization) => organization.id === id);
}
