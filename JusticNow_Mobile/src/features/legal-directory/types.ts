/**
 * EP-06 Legal Support Directory — data shapes.
 *
 * These match the proposal in the project CLAUDE.md, NOT the current backend.
 * Prisma's `LegalOrganization` today has only id (Int), name, contactEmail,
 * verified and createdAt — none of the fields the directory card design needs,
 * and there is no LegalSupportRequest model at all.
 *
 * So treat this as the contract we are asking M1/M4 for. Two things will bite
 * when the real endpoint lands:
 *   - `id` is `string` here but `Int` in Prisma
 *   - every field below except id/name/verified needs adding to the schema
 */

export type OrganizationCategory =
  | 'legalAid'
  | 'humanRights'
  | 'workplaceRights'
  | 'womensRights'
  | 'childRights'
  | 'counselling'
  | 'landRights';

export type Organization = {
  id: string;
  name: string;
  /** Short plain-language description of what the organisation does. */
  description: string;
  verified: boolean;
  /** Language codes the organisation can serve clients in. */
  languages: string[];
  categories: OrganizationCategory[];
  isFree: boolean;
  /** Kilometres. Never miles — Sri Lankan context. */
  distanceKm: number;
  location: string;
  contact: { phone?: string; email?: string };
};

export type SupportType =
  | 'LEGAL_ADVICE'
  | 'REPRESENTATION'
  | 'DOCUMENT_REVIEW'
  | 'STRATEGIC_CONSULTATION';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';

export type LegalSupportRequest = {
  id: string;
  organizationId: string;
  caseId?: string;
  supportType: SupportType;
  message: string;
  consentGiven: boolean;
  status: RequestStatus;
};

/** Filters on the directory list. `all` means the filter is not applied. */
export type DirectoryFilters = {
  query: string;
  category: OrganizationCategory | 'all';
  cost: 'all' | 'free' | 'paid';
  language: string | 'all';
};
