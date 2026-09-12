ALTER TABLE `message`
  ADD COLUMN `senderId` INT NULL,
  ADD COLUMN `attachmentUrl` VARCHAR(191) NULL,
  ADD COLUMN `attachmentName` VARCHAR(191) NULL,
  ADD COLUMN `attachmentType` VARCHAR(191) NULL;

ALTER TABLE `message`
  ADD CONSTRAINT `messages_senderId_fkey`
  FOREIGN KEY (`senderId`) REFERENCES `user`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
