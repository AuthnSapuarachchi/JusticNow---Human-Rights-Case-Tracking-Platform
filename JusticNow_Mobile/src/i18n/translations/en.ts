/**
 * English strings — the canonical dictionary.
 *
 * This file defines the key set for the whole app: `TranslationKey` is derived
 * from it, so adding a key here and nowhere else is safe (other languages fall
 * back to English), but using a key that is NOT here is a compile error.
 *
 * Keys are namespaced by screen or concern. Keep them alphabetical within a
 * namespace so merge conflicts stay small.
 */

export const en = {
  // ---- shared chrome -------------------------------------------------------
  'common.appName': 'JusticeNow',
  'common.back': 'Go back',
  'common.cancel': 'Cancel',
  'common.error': 'Something went wrong. Please try again.',
  'common.loading': 'Loading…',
  'common.notifications': 'Notifications',
  'common.retry': 'Try again',
  'common.search': 'Search',
  'common.viewAll': 'View all',

  'nav.home': 'Home',
  'nav.cases': 'Cases',
  'nav.messages': 'Messages',
  'nav.support': 'Support',

  'language.select': 'Choose a language',

  // ---- EP-06 Legal Support Directory (US-13) -------------------------------
  'directory.title': 'Find Legal Help',
  'directory.searchPlaceholder': 'Search organizations or locations',
  'directory.searchLabel': 'Search legal organizations by name or location',
  'directory.filterAll': 'All services',
  'directory.filterFree': 'Free services',
  'directory.filterLegalAid': 'Legal aid',
  'directory.filterHumanRights': 'Human rights',
  'directory.verified': 'Verified',
  'directory.distance': '{{km}} km away',
  'directory.languages': 'Languages: {{languages}}',
  'directory.requestSupport': 'Request support',
  'directory.free': 'Free',
  'directory.paid': 'Paid',
  'directory.empty': 'No organisations match your filters.',
  'directory.emptyHint': 'Try removing a filter or searching a different area.',

  // ---- EP-06 Request Support (US-14) ---------------------------------------
  'request.title': 'Request Support',
  'request.relatedCase': 'Select related case (optional)',
  'request.selectCase': 'Select a case from your dashboard',
  'request.supportType': 'Type of support needed',
  'request.legalAdvice': 'Legal advice',
  'request.representation': 'Representation',
  'request.documentReview': 'Document review',
  'request.strategicConsultation': 'Strategic consultation',
  'request.message': 'Message to organisation',
  'request.messagePlaceholder':
    'Briefly describe your situation and any specific questions. Please do not include highly sensitive personal details here.',
  'request.privacyTitle': 'Data privacy and sharing',
  'request.privacyBody':
    'By submitting this request you authorise JusticeNow to share your basic profile information and the selected case details with {{organisation}}. Your data remains encrypted end to end.',
  'request.consent': 'I consent to sharing my report and evidence with this organisation.',
  'request.send': 'Send request',
  'request.sending': 'Sending your request…',
  'request.sent': 'Request sent',
  'request.consentRequired': 'Please give consent before sending your request.',
  'request.messageRequired': 'Please describe your situation before sending.',

  // ---- EP-07 Know Your Rights (US-15) --------------------------------------
  'rights.title': 'Know Your Rights',
  'rights.intro':
    'Clear, plain-language information about your legal rights and protections. Search below or explore the categories.',
  'rights.searchPlaceholder': 'Search rights, topics, or situations',
  'rights.searchLabel': 'Search rights information',
  'rights.categories': 'Categories',
  'rights.featuredGuides': 'Featured guides',
  'rights.readGuide': 'Read guide',
  'rights.urgentGuide': 'Urgent guide',
  'rights.keyProtections': 'Key protections',
  'rights.faq': 'Frequently asked questions',
  'rights.violatedTitle': 'Rights violated?',
  'rights.violatedBody':
    'If you believe your rights have been violated, document everything. Keep records of communications, dates, and witnesses. You can report an incident securely through JusticeNow to receive guidance.',
  'rights.reportIncident': 'Report an incident',

  // Category names and their plain-language descriptions.
  'rights.category.workplace': 'Workplace Rights',
  'rights.category.workplace.desc': 'Fair pay, safe conditions, and protection from unfair dismissal.',
  'rights.category.child': 'Child Rights',
  'rights.category.child.desc': 'Protection from exploitation, access to education, and general welfare.',
  'rights.category.women': "Women's Rights",
  'rights.category.women.desc': 'Gender equality, reproductive rights, and protection against violence.',
  'rights.category.disability': 'Disability Rights',
  'rights.category.disability.desc': 'Equal access, reasonable accommodation, and anti-discrimination.',
  'rights.category.privacy': 'Digital Privacy',
  'rights.category.privacy.desc': 'Data protection, surveillance laws, and online freedom of expression.',
  'rights.category.discrimination': 'Discrimination',
  'rights.category.discrimination.desc':
    'Protection against bias based on race, religion, language, caste, sex, political opinion, or place of birth.',
  'rights.category.detention': 'Unlawful Detention',
  'rights.category.detention.desc': 'Your rights during arrest, bail procedures, and habeas corpus.',
  'rights.category.education': 'Access to Education',
  'rights.category.education.desc': 'The right to schooling, special education, and protection from exclusion.',
  'rights.category.healthcare': 'Access to Healthcare',
  'rights.category.healthcare.desc': 'Patient rights, emergency care access, and medical privacy.',
} as const;

export type TranslationKey = keyof typeof en;
