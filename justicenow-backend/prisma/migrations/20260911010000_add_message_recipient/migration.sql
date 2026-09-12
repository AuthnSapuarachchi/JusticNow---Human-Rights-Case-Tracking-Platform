ALTER TABLE `message`
  ADD COLUMN `recipientId` INT NULL;

ALTER TABLE `message`
  ADD CONSTRAINT `messages_recipientId_fkey`
  FOREIGN KEY (`recipientId`) REFERENCES `user`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;