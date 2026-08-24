/**
 * EP-07 rights structure (JN-29).
 *
 * Ids and icons only — all readable text comes from i18n.
 *
 * Scope note: JN-29 is the scaffold ticket. `workplace` is fully written as the
 * worked example (it is the Figma template screen); the other eight carry their
 * intro and key protections. Filling every category out to the same depth is
 * JN-60 in Sprint 2.
 *
 * The Figma export for the workplace page contained US law in two places — the
 * FLSA minimum wage / 40-hour week, and the Title VII protected-class list.
 * Both are replaced here with the Sri Lankan position. See README notes.
 */

import type { RightsCategory, RightsCategoryId, RightsDetail } from '../types';

export const RIGHTS_CATEGORIES: RightsCategory[] = [
  { id: 'workplace', icon: 'briefcase' },
  { id: 'child', icon: 'happy' },
  { id: 'women', icon: 'female' },
  { id: 'disability', icon: 'accessibility' },
  { id: 'privacy', icon: 'shield-checkmark' },
  { id: 'discrimination', icon: 'people' },
  { id: 'detention', icon: 'document-text' },
  { id: 'education', icon: 'school' },
  { id: 'healthcare', icon: 'medkit' },
];

export const RIGHTS_DETAILS: Record<RightsCategoryId, RightsDetail> = {
  workplace: {
    id: 'workplace',
    protections: [
      { id: 'wages', icon: 'cash' },
      { id: 'safety', icon: 'shield-checkmark' },
      { id: 'organise', icon: 'people' },
      { id: 'harassment', icon: 'ban' },
      { id: 'dismissal', icon: 'document-text' },
    ],
    faqs: [{ id: 'unsafe' }, { id: 'contractor' }, { id: 'overtime' }],
    sources: [
      'Constitution of Sri Lanka, Article 12(2)',
      'Shop and Office Employees Act No. 19 of 1954',
      'Wages Boards Ordinance No. 27 of 1941',
      'National Minimum Wage of Workers Act No. 3 of 2016',
      'Termination of Employment of Workmen Act No. 45 of 1971',
      'Industrial Disputes Act No. 43 of 1950',
      'Factories Ordinance No. 45 of 1942',
    ],
  },
  child: {
    id: 'child',
    protections: [
      { id: 'exploitation', icon: 'ban' },
      { id: 'education', icon: 'school' },
      { id: 'protection', icon: 'shield-checkmark' },
    ],
    faqs: [],
    sources: [
      'Employment of Women, Young Persons and Children Act No. 47 of 1956',
      'National Child Protection Authority Act No. 50 of 1998',
    ],
  },
  women: {
    id: 'women',
    protections: [
      { id: 'equality', icon: 'people' },
      { id: 'violence', icon: 'shield-checkmark' },
      { id: 'maternity', icon: 'heart' },
    ],
    faqs: [],
    sources: [
      'Constitution of Sri Lanka, Article 12(2)',
      'Prevention of Domestic Violence Act No. 34 of 2005',
      'Maternity Benefits Ordinance No. 32 of 1939',
    ],
  },
  disability: {
    id: 'disability',
    protections: [
      { id: 'access', icon: 'accessibility' },
      { id: 'employment', icon: 'briefcase' },
      { id: 'discrimination', icon: 'ban' },
    ],
    faqs: [],
    sources: [
      'Protection of the Rights of Persons with Disabilities Act No. 28 of 1996',
      'Constitution of Sri Lanka, Article 12(2)',
    ],
  },
  privacy: {
    id: 'privacy',
    protections: [
      { id: 'data', icon: 'lock-closed' },
      { id: 'expression', icon: 'chatbubbles' },
      { id: 'information', icon: 'document-text' },
    ],
    faqs: [],
    sources: [
      'Personal Data Protection Act No. 9 of 2022',
      'Right to Information Act No. 12 of 2016',
      'Constitution of Sri Lanka, Article 14(1)(a)',
    ],
  },
  discrimination: {
    id: 'discrimination',
    protections: [
      { id: 'equality', icon: 'people' },
      { id: 'remedy', icon: 'document-text' },
      { id: 'services', icon: 'business' },
    ],
    faqs: [],
    sources: [
      'Constitution of Sri Lanka, Article 12(2)',
      'Human Rights Commission of Sri Lanka Act No. 21 of 1996',
    ],
  },
  detention: {
    id: 'detention',
    protections: [
      { id: 'arrest', icon: 'information-circle' },
      { id: 'bail', icon: 'document-text' },
      { id: 'habeas', icon: 'shield-checkmark' },
    ],
    faqs: [],
    sources: [
      'Constitution of Sri Lanka, Articles 13 and 141',
      'Code of Criminal Procedure Act No. 15 of 1979',
      'Bail Act No. 30 of 1997',
    ],
  },
  education: {
    id: 'education',
    protections: [
      { id: 'access', icon: 'school' },
      { id: 'exclusion', icon: 'ban' },
      { id: 'special', icon: 'accessibility' },
    ],
    faqs: [],
    sources: ['Education Ordinance No. 31 of 1939', 'Constitution of Sri Lanka, Article 12(2)'],
  },
  healthcare: {
    id: 'healthcare',
    protections: [
      { id: 'access', icon: 'medkit' },
      { id: 'emergency', icon: 'pulse' },
      { id: 'privacy', icon: 'lock-closed' },
    ],
    faqs: [],
    sources: ['National Health Policy', 'Personal Data Protection Act No. 9 of 2022'],
  },
};

export function getRightsCategories(): RightsCategory[] {
  return RIGHTS_CATEGORIES;
}

export function getRightsDetail(id: string): RightsDetail | undefined {
  return RIGHTS_DETAILS[id as RightsCategoryId];
}
