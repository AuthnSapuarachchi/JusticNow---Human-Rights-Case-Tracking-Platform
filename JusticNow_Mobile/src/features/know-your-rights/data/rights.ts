/**
 * EP-07 rights structure (JN-29).
 *
 * Ids and icons only — all readable text comes from i18n.
 *
 * Scope note: JN-29 scaffolded all nine categories with intro + key protections;
 * `workplace` additionally had FAQs, as the Figma template screen. JN-60 brought
 * the other eight up to the same depth with real FAQs, sourced to the same
 * statutes already cited per category below.
 *
 * The Figma export for the workplace page contained US law in two places — the
 * FLSA minimum wage / 40-hour week, and the Title VII protected-class list.
 * Both are replaced here with the Sri Lankan position. See README notes.
 */

import { API_URL } from '@/api/client';
import type { TranslationKey } from '@/i18n';

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
    faqs: [{ id: 'minimumAge' }, { id: 'reportAbuse' }, { id: 'corporalPunishment' }],
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
    faqs: [{ id: 'protectionOrder' }, { id: 'workplaceHarassment' }, { id: 'maternityDismissal' }],
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
    faqs: [{ id: 'accessRefusal' }, { id: 'employmentQuota' }, { id: 'reasonableAccommodation' }],
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
    faqs: [{ id: 'dataMisuse' }, { id: 'onlineHarassment' }, { id: 'infoRequest' }],
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
    faqs: [{ id: 'timeLimit' }, { id: 'privateEmployer' }, { id: 'evidenceNeeded' }],
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
    faqs: [{ id: 'rightsOnArrest' }, { id: 'bailRefused' }, { id: 'habeasCorpusUse' }],
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
    faqs: [{ id: 'schoolFees' }, { id: 'expulsion' }, { id: 'specialNeeds' }],
    sources: ['Education Ordinance No. 31 of 1939', 'Constitution of Sri Lanka, Article 12(2)'],
  },
  healthcare: {
    id: 'healthcare',
    protections: [
      { id: 'access', icon: 'medkit' },
      { id: 'emergency', icon: 'pulse' },
      { id: 'privacy', icon: 'lock-closed' },
    ],
    faqs: [{ id: 'refusedTreatment' }, { id: 'medicalRecordsPrivacy' }, { id: 'complaintProcess' }],
    sources: ['National Health Policy', 'Personal Data Protection Act No. 9 of 2022'],
  },
};

export function getRightsCategories(): RightsCategory[] {
  return RIGHTS_CATEGORIES;
}

export function getRightsDetail(id: string): RightsDetail | undefined {
  return RIGHTS_DETAILS[id as RightsCategoryId];
}

/**
 * Live-vs-bundled resolution (EP-07 admin content).
 *
 * The backend now serves this content from `rightscategory` /
 * `rightsprotection` / `rightsfaq` (GET /api/rights, /api/rights/:categoryId
 * - both public, no auth). Content there can be edited by an admin without a
 * redeploy.
 *
 * These functions try the API first and fall back to the bundled data above
 * (routed through i18n) on any failure - offline, backend down, or a category
 * the API hasn't been seeded with yet. That keeps this screen usable for
 * someone checking their rights on bad connectivity, which matters more here
 * than almost anywhere else in the app.
 *
 * Both paths resolve into the same plain-string shape so screens render one
 * path, not two.
 */

export type ResolvedCategory = {
  id: string;
  icon: RightsCategory['icon'];
  title: string;
  description: string;
};

export type ResolvedProtection = { id: string; icon: string; title: string; body: string };
export type ResolvedFaq = { id: string; question: string; answer: string };

export type ResolvedRightsDetail = {
  id: string;
  title: string;
  intro: string;
  sources: string[];
  protections: ResolvedProtection[];
  faqs: ResolvedFaq[];
};

type RemoteCategory = { categoryId: string; icon: string; title: string; description: string };
type RemoteRightsDetail = RemoteCategory & {
  intro: string;
  sources: string;
  protections: { protectionId: string; icon: string; title: string; body: string }[];
  faqs: { faqId: string; question: string; answer: string }[];
};

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/** Bundled category as a t()-resolved ResolvedCategory - the offline fallback. */
function toBundledCategory(category: RightsCategory, t: (key: TranslationKey) => string): ResolvedCategory {
  return {
    id: category.id,
    icon: category.icon,
    title: t(`rights.category.${category.id}` as TranslationKey),
    description: t(`rights.category.${category.id}.desc` as TranslationKey),
  };
}

export async function resolveCategories(t: (key: TranslationKey) => string): Promise<ResolvedCategory[]> {
  const remote = await fetchJson<RemoteCategory[]>('/api/rights');
  if (remote && remote.length > 0) {
    return remote.map((category) => ({
      id: category.categoryId,
      icon: category.icon as RightsCategory['icon'],
      title: category.title,
      description: category.description,
    }));
  }
  return RIGHTS_CATEGORIES.map((category) => toBundledCategory(category, t));
}

export async function resolveRightsDetail(
  categoryId: string,
  t: (key: TranslationKey) => string,
): Promise<ResolvedRightsDetail | undefined> {
  const remote = await fetchJson<RemoteRightsDetail>(`/api/rights/${categoryId}`);
  if (remote) {
    return {
      id: remote.categoryId,
      title: remote.title,
      intro: remote.intro,
      sources: remote.sources.split('\n').filter(Boolean),
      protections: remote.protections.map((p) => ({ id: p.protectionId, icon: p.icon, title: p.title, body: p.body })),
      faqs: remote.faqs.map((f) => ({ id: f.faqId, question: f.question, answer: f.answer })),
    };
  }

  const bundled = getRightsDetail(categoryId);
  if (!bundled) return undefined;
  const titleKey = `rights.category.${bundled.id}` as TranslationKey;
  const introKey = `rights.detail.${bundled.id}.intro` as TranslationKey;
  return {
    id: bundled.id,
    title: t(titleKey),
    intro: t(introKey),
    sources: bundled.sources,
    protections: bundled.protections.map((p) => ({
      id: p.id,
      icon: p.icon,
      title: t(`rights.detail.${bundled.id}.protection.${p.id}.title` as TranslationKey),
      body: t(`rights.detail.${bundled.id}.protection.${p.id}.body` as TranslationKey),
    })),
    faqs: bundled.faqs.map((f) => ({
      id: f.id,
      question: t(`rights.detail.${bundled.id}.faq.${f.id}.q` as TranslationKey),
      answer: t(`rights.detail.${bundled.id}.faq.${f.id}.a` as TranslationKey),
    })),
  };
}
