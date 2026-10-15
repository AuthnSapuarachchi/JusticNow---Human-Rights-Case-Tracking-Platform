-- AlterEnum
ALTER TYPE "CaseStatus" ADD VALUE IF NOT EXISTS 'NEW';
ALTER TYPE "CaseStatus" ADD VALUE IF NOT EXISTS 'WAITING_FOR_USER';
ALTER TYPE "CaseStatus" ADD VALUE IF NOT EXISTS 'INVESTIGATING';

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('NORMAL', 'URGENT');

-- CreateEnum
CREATE TYPE "CaseActionType" AS ENUM ('ASSIGNED', 'STATUS_CHANGED', 'NOTE_ADDED', 'INFO_REQUESTED', 'REFERRED', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "InfoRequestStatus" AS ENUM ('PENDING', 'RESOLVED');

-- AlterTable
ALTER TABLE "cases"
  ADD COLUMN "priority" "CasePriority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "escalated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "escalatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "casestatushistory" (
  "id" SERIAL NOT NULL,
  "caseId" INTEGER NOT NULL,
  "fromStatus" "CaseStatus" NOT NULL,
  "toStatus" "CaseStatus" NOT NULL,
  "changedById" INTEGER NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "casestatushistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casenote" (
  "id" SERIAL NOT NULL,
  "caseId" INTEGER NOT NULL,
  "authorId" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "casenote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caseinforequest" (
  "id" SERIAL NOT NULL,
  "caseId" INTEGER NOT NULL,
  "requestedById" INTEGER NOT NULL,
  "message" TEXT NOT NULL,
  "status" "InfoRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),

  CONSTRAINT "caseinforequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casereferral" (
  "id" SERIAL NOT NULL,
  "caseId" INTEGER NOT NULL,
  "referredById" INTEGER NOT NULL,
  "referredToOrganizationId" INTEGER,
  "referredToText" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "casereferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caseaction" (
  "id" SERIAL NOT NULL,
  "caseId" INTEGER NOT NULL,
  "actorId" INTEGER NOT NULL,
  "actionType" "CaseActionType" NOT NULL,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "caseaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "casestatushistory"
  ADD CONSTRAINT "casestatushistory_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "casestatushistory"
  ADD CONSTRAINT "casestatushistory_changedById_fkey"
  FOREIGN KEY ("changedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casenote"
  ADD CONSTRAINT "casenote_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "casenote"
  ADD CONSTRAINT "casenote_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caseinforequest"
  ADD CONSTRAINT "caseinforequest_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "caseinforequest"
  ADD CONSTRAINT "caseinforequest_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casereferral"
  ADD CONSTRAINT "casereferral_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "casereferral"
  ADD CONSTRAINT "casereferral_referredById_fkey"
  FOREIGN KEY ("referredById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "casereferral"
  ADD CONSTRAINT "casereferral_referredToOrganizationId_fkey"
  FOREIGN KEY ("referredToOrganizationId") REFERENCES "legalorganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caseaction"
  ADD CONSTRAINT "caseaction_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "caseaction"
  ADD CONSTRAINT "caseaction_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "casestatushistory_caseId_idx" ON "casestatushistory"("caseId");
CREATE INDEX "casestatushistory_changedById_idx" ON "casestatushistory"("changedById");
CREATE INDEX "casenote_caseId_idx" ON "casenote"("caseId");
CREATE INDEX "casenote_authorId_idx" ON "casenote"("authorId");
CREATE INDEX "caseinforequest_caseId_idx" ON "caseinforequest"("caseId");
CREATE INDEX "caseinforequest_requestedById_idx" ON "caseinforequest"("requestedById");
CREATE INDEX "casereferral_caseId_idx" ON "casereferral"("caseId");
CREATE INDEX "casereferral_referredById_idx" ON "casereferral"("referredById");
CREATE INDEX "casereferral_referredToOrganizationId_idx" ON "casereferral"("referredToOrganizationId");
CREATE INDEX "caseaction_caseId_idx" ON "caseaction"("caseId");
CREATE INDEX "caseaction_actorId_idx" ON "caseaction"("actorId");
