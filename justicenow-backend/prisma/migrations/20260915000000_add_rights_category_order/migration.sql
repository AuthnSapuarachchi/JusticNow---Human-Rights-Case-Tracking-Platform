-- Categories need an explicit display order. Without it the list came back
-- alphabetical (Child, Detention, Disability...), which silently discarded the
-- deliberate Figma sequence that starts with Workplace. Protections and FAQs
-- already had an "order" column; this brings categories in line.
--
-- "order" is a reserved word, hence the quoting.

ALTER TABLE "rightscategory" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
