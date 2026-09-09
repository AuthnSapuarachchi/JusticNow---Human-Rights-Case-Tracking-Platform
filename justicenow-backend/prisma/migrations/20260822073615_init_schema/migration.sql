-- Upgrade the original schema without recreating tables from the initial migration.
ALTER TABLE `User`
  MODIFY `name` VARCHAR(191) NULL,
  MODIFY `role` ENUM('CITIZEN', 'OFFICER', 'ADMIN') NOT NULL DEFAULT 'OFFICER';
