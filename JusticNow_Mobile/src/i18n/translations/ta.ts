/**
 * Tamil strings.
 *
 * ⚠️  NEEDS NATIVE-SPEAKER REVIEW BEFORE SUBMISSION.
 *
 * Only navigation and common UI terms are filled in, as starting points. Every
 * entry below must be checked by a Tamil speaker on the team.
 *
 * Legal and rights content is deliberately NOT translated here. Mistranslating
 * a legal term in a human-rights app is a real harm, not a cosmetic bug — those
 * strings need a person who can verify them against Sri Lankan law.
 *
 * Anything absent falls back to English automatically, so the app stays usable
 * while this file is filled in. Partial is fine; wrong is not.
 */

import type { TranslationKey } from './en';

export const ta: Partial<Record<TranslationKey, string>> = {
  'nav.home': 'முகப்பு',
  'nav.cases': 'வழக்குகள்',
  'nav.messages': 'செய்திகள்',
  'nav.support': 'ஆதரவு',

  'common.search': 'தேடு',
  'common.back': 'பின்செல்',
  'common.cancel': 'ரத்து செய்',

  'language.select': 'மொழியைத் தேர்ந்தெடுக்கவும்',

  // TODO(ta): everything below this line is still English at runtime.
  // Priority order for translation: directory.*, rights.category.*, request.*
};
