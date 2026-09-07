/**
 * EP-07 Know Your Rights — data shapes.
 *
 * Content lives in i18n, not here. These structures carry only ids and icons;
 * every piece of readable text is looked up as `rights.detail.<category>.…` so
 * the whole section translates with the rest of the app.
 */

import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type RightsCategoryId =
  | 'workplace'
  | 'child'
  | 'women'
  | 'disability'
  | 'privacy'
  | 'discrimination'
  | 'detention'
  | 'education'
  | 'healthcare';

export type RightsCategory = {
  id: RightsCategoryId;
  icon: IoniconName;
};

/** One "Key protection" card on a category page. */
export type RightsProtection = {
  /** Key suffix: rights.detail.<category>.protection.<id>.title / .body */
  id: string;
  icon: IoniconName;
};

/** One FAQ entry. Key suffix: rights.detail.<category>.faq.<id>.q / .a */
export type RightsFaq = {
  id: string;
};

export type RightsDetail = {
  id: RightsCategoryId;
  protections: RightsProtection[];
  faqs: RightsFaq[];
  /** Statutes cited on the page, shown in a source note. */
  sources: string[];
};
