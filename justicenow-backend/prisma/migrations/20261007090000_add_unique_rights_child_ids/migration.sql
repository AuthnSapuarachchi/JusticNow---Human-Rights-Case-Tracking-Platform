-- Stable content IDs are unique within each parent category. The auto-generated
-- integer primary keys remain the database identity for these rows.
CREATE UNIQUE INDEX "rightsprotection_categoryId_protectionId_key"
ON "rightsprotection"("categoryId", "protectionId");

CREATE UNIQUE INDEX "rightsfaq_categoryId_faqId_key"
ON "rightsfaq"("categoryId", "faqId");
