-- Officer conduct: citizen complaints about their case officer, and the admin<->officer
-- channel (messages + formal warnings). Additive only - no existing table changes.
-- CreateEnum
CREATE TYPE "ComplaintReason" AS ENUM ('NO_RESPONSE', 'UNPROFESSIONAL', 'PRESSURE_OR_THREAT', 'PRIVACY_BREACH', 'ASKED_FOR_PAYMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED');

-- CreateEnum
CREATE TYPE "StaffMessageKind" AS ENUM ('MESSAGE', 'WARNING');

-- CreateTable
CREATE TABLE "officercomplaint" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "officerId" INTEGER NOT NULL,
    "reason" "ComplaintReason" NOT NULL,
    "details" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "officercomplaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staffmessage" (
    "id" SERIAL NOT NULL,
    "officerId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "kind" "StaffMessageKind" NOT NULL DEFAULT 'MESSAGE',
    "content" TEXT NOT NULL,
    "complaintId" INTEGER,
    "readByOfficerAt" TIMESTAMP(3),
    "readByAdminAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staffmessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "officercomplaint_officerId_idx" ON "officercomplaint"("officerId");

-- CreateIndex
CREATE INDEX "officercomplaint_status_createdAt_idx" ON "officercomplaint"("status", "createdAt");

-- CreateIndex
CREATE INDEX "officercomplaint_caseId_reporterId_idx" ON "officercomplaint"("caseId", "reporterId");

-- CreateIndex
CREATE INDEX "staffmessage_officerId_createdAt_idx" ON "staffmessage"("officerId", "createdAt");

-- AddForeignKey
ALTER TABLE "officercomplaint" ADD CONSTRAINT "officercomplaint_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "officercomplaint" ADD CONSTRAINT "officercomplaint_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "officercomplaint" ADD CONSTRAINT "officercomplaint_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "officercomplaint" ADD CONSTRAINT "officercomplaint_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staffmessage" ADD CONSTRAINT "staffmessage_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staffmessage" ADD CONSTRAINT "staffmessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staffmessage" ADD CONSTRAINT "staffmessage_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "officercomplaint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

