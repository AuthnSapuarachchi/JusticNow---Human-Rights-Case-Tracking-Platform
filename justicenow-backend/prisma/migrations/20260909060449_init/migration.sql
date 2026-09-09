-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `role` ENUM('CITIZEN', 'OFFICER', 'ADMIN') NOT NULL DEFAULT 'OFFICER',
    `organizationId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `legal_organizations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `contactEmail` VARCHAR(191) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `description` TEXT NOT NULL,
    `status` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'ASSIGNED_TO_OFFICER', 'INVESTIGATION_IN_PROGRESS', 'REFERRED_FOR_LEGAL_SUPPORT', 'RESOLUTION_PROPOSED', 'RESOLVED', 'CLOSED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    `isAnonymous` BOOLEAN NOT NULL DEFAULT true,
    `category` ENUM('WORKPLACE_DISCRIMINATION', 'HUMAN_RIGHTS_VIOLATION', 'DIGITAL_PRIVACY', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `incidentDate` DATETIME(3) NULL,
    `location` VARCHAR(191) NULL,
    `actionRequest` VARCHAR(191) NULL,
    `officerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tracking_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `pin` VARCHAR(191) NOT NULL,
    `caseId` INTEGER NOT NULL,

    UNIQUE INDEX `tracking_codes_code_key`(`code`),
    UNIQUE INDEX `tracking_codes_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evidence_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `fileSize` VARCHAR(191) NULL,
    `caseId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `isFromUser` BOOLEAN NOT NULL,
    `caseId` INTEGER NOT NULL,
    `officerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `case_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caseId` INTEGER NOT NULL,
    `previousStatus` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'ASSIGNED_TO_OFFICER', 'INVESTIGATION_IN_PROGRESS', 'REFERRED_FOR_LEGAL_SUPPORT', 'RESOLUTION_PROPOSED', 'RESOLVED', 'CLOSED', 'REJECTED') NULL,
    `newStatus` ENUM('SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'ASSIGNED_TO_OFFICER', 'INVESTIGATION_IN_PROGRESS', 'REFERRED_FOR_LEGAL_SUPPORT', 'RESOLUTION_PROPOSED', 'RESOLVED', 'CLOSED', 'REJECTED') NOT NULL,
    `changedBy` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `case_notes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caseId` INTEGER NOT NULL,
    `officerId` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `legal_organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cases` ADD CONSTRAINT `cases_officerId_fkey` FOREIGN KEY (`officerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tracking_codes` ADD CONSTRAINT `tracking_codes_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evidence_items` ADD CONSTRAINT `evidence_items_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_officerId_fkey` FOREIGN KEY (`officerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `case_history` ADD CONSTRAINT `case_history_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `case_notes` ADD CONSTRAINT `case_notes_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `case_notes` ADD CONSTRAINT `case_notes_officerId_fkey` FOREIGN KEY (`officerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
