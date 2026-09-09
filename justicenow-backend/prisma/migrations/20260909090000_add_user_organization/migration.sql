-- Keep organization membership optional for citizens, officers, and admins.
ALTER TABLE `User`
  ADD COLUMN `organizationId` INTEGER NULL;

ALTER TABLE `User`
  ADD CONSTRAINT `User_organizationId_fkey`
  FOREIGN KEY (`organizationId`) REFERENCES `LegalOrganization`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
