-- EP-07 Know Your Rights content tables. Additive only - no existing table
-- is touched. One row per category per locale in `rightscategory`, so the
-- language toggle still applies once real translations exist.

CREATE TABLE `rightscategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoryId` VARCHAR(191) NOT NULL,
    `locale` VARCHAR(191) NOT NULL DEFAULT 'en',
    `icon` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `intro` TEXT NOT NULL,
    `sources` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,

    UNIQUE INDEX `rightscategory_categoryId_locale_key`(`categoryId`, `locale`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rightsprotection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `protectionId` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `categoryId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rightsfaq` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `faqId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `answer` TEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `categoryId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `rightsprotection`
  ADD CONSTRAINT `rightsprotection_categoryId_fkey`
  FOREIGN KEY (`categoryId`) REFERENCES `rightscategory`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rightsfaq`
  ADD CONSTRAINT `rightsfaq_categoryId_fkey`
  FOREIGN KEY (`categoryId`) REFERENCES `rightscategory`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
