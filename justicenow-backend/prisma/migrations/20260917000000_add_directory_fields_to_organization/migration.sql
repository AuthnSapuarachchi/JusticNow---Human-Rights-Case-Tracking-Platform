-- EP-06 directory fields for LegalOrganization.
--
-- Additive only: every column is nullable or defaulted, so existing rows and
-- the officer referral flow (CaseReferral -> LegalOrganization) are unaffected
-- and no backfill is needed.
--
-- languages and categories are stored comma-separated rather than as relations.
-- They are short, read-only lists rendered as chips; a join table would add
-- two models for no practical gain at this size.

ALTER TABLE "legalorganization" ADD COLUMN "description" TEXT;
ALTER TABLE "legalorganization" ADD COLUMN "languages" TEXT NOT NULL DEFAULT '';
ALTER TABLE "legalorganization" ADD COLUMN "categories" TEXT NOT NULL DEFAULT '';
ALTER TABLE "legalorganization" ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "legalorganization" ADD COLUMN "distanceKm" DOUBLE PRECISION;
ALTER TABLE "legalorganization" ADD COLUMN "location" TEXT;
ALTER TABLE "legalorganization" ADD COLUMN "phone" TEXT;
