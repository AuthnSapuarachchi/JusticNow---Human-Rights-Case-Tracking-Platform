ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LAWYER';

CREATE TYPE "VerificationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED');

ALTER TABLE "user"
  ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "contactNumber" TEXT;

CREATE TABLE "VerificationProfile" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "officerId" TEXT,
  "organization" TEXT,
  "department" TEXT,
  "designation" TEXT,
  "governmentId" TEXT,
  "lawyerNumber" TEXT,
  "firm" TEXT,
  "practiceArea" TEXT,
  "experienceYears" INTEGER,
  "additionalDocuments" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerificationProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VerificationProfile_userId_key" UNIQUE ("userId"),
  CONSTRAINT "VerificationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VerificationDocument" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "documentType" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "storageName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VerificationDocument_storageName_key" UNIQUE ("storageName"),
  CONSTRAINT "VerificationDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VerificationDocument_userId_idx" ON "VerificationDocument"("userId");