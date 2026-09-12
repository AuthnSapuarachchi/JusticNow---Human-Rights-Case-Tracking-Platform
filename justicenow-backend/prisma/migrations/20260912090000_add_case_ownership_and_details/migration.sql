CREATE TYPE "ViolationCategory" AS ENUM (
  'WORKPLACE_DISCRIMINATION',
  'HUMAN_RIGHTS_VIOLATION',
  'DIGITAL_PRIVACY',
  'OTHER'
);

ALTER TABLE "case"
  ADD COLUMN "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "category" "ViolationCategory" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "location" TEXT,
  ADD COLUMN "actionRequest" TEXT,
  ADD COLUMN "reporterId" INTEGER;

ALTER TABLE "case"
  ADD CONSTRAINT "case_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "user"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "case_reporterId_idx" ON "case"("reporterId");