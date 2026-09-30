-- AlterTable
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "legalorganization"
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "violationcategoryconfig" (
  "id" SERIAL NOT NULL,
  "code" "ViolationCategory" NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "violationcategoryconfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "violationcategoryconfig_code_key" ON "violationcategoryconfig"("code");

-- Seed the existing enum values
INSERT INTO "violationcategoryconfig" ("code", "label", "description") VALUES
  ('WORKPLACE_DISCRIMINATION', 'Workplace discrimination', 'Unfair treatment, harassment, or dismissal at work.'),
  ('HUMAN_RIGHTS_VIOLATION', 'Human rights violation', 'Violations of fundamental rights such as unlawful detention or abuse.'),
  ('DIGITAL_PRIVACY', 'Digital privacy', 'Misuse of personal data, surveillance, or online abuse.'),
  ('OTHER', 'Other', 'Any other issue that does not fit the categories above.')
ON CONFLICT ("code") DO NOTHING;
