/**
 * Sinhala strings.
 *
 * ⚠️  NEEDS NATIVE-SPEAKER REVIEW BEFORE SUBMISSION.
 *
 * Only navigation and common UI terms are filled in, as starting points. Every
 * entry below must be checked by a Sinhala speaker on the team.
 *
 * Legal and rights content is deliberately NOT translated here. Mistranslating
 * a legal term in a human-rights app is a real harm, not a cosmetic bug — those
 * strings need a person who can verify them against Sri Lankan law.
 *
 * Anything absent falls back to English automatically, so the app stays usable
 * while this file is filled in. Partial is fine; wrong is not.
 */

import type { TranslationKey } from './en';

export const si: Partial<Record<TranslationKey, string>> = {
  'nav.home': 'මුල් පිටුව',
  'nav.cases': 'නඩු',
  'nav.messages': 'පණිවිඩ',
  'nav.support': 'සහාය',

  'common.search': 'සොයන්න',
  'common.back': 'ආපසු',
  'common.cancel': 'අවලංගු කරන්න',

  'language.select': 'භාෂාව තෝරන්න',

  // TODO(si): everything below this line is still English at runtime.
  // Priority order for translation: directory.*, rights.category.*, request.*
};
