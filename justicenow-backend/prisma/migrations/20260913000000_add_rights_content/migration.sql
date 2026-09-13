-- EP-07 Know Your Rights content tables. Additive only - no existing table
-- is touched. One row per category per locale in "rightscategory", so the
-- language toggle still applies once real translations exist.
--
-- Rewritten for PostgreSQL (originally written for MySQL, before the team
-- switched datasources). Note: this migration alone does not make the full
-- chain runnable from scratch on a fresh Postgres database - every migration
-- before 20260912090000 is still MySQL syntax. That is a separate,
-- pre-existing issue on the shared history, not something this file fixes.

CREATE TABLE "rightscategory" (
    "id" SERIAL NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "sources" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER,

    CONSTRAINT "rightscategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rightsprotection" (
    "id" SERIAL NOT NULL,
    "protectionId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "rightsprotection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rightsfaq" (
    "id" SERIAL NOT NULL,
    "faqId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "rightsfaq_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rightscategory_categoryId_locale_key" ON "rightscategory"("categoryId", "locale");

ALTER TABLE "rightsprotection"
  ADD CONSTRAINT "rightsprotection_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "rightscategory"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rightsfaq"
  ADD CONSTRAINT "rightsfaq_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "rightscategory"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
