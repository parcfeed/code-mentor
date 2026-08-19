-- AlterTable: ajouter la colonne reporter_comment (nullable, pas de perte de données)
ALTER TABLE "reports" ADD COLUMN "reporter_comment" TEXT;

-- AlterTable: ajouter snippet_id si manquant (nullable, compatible avec données existantes)
ALTER TABLE "reports" ADD COLUMN "snippet_id" TEXT;

-- AddForeignKey: FK vers snippets (seulement si pas déjà présente)
DO $$ BEGIN
  ALTER TABLE "reports" ADD CONSTRAINT "reports_snippet_id_fkey"
    FOREIGN KEY ("snippet_id") REFERENCES "snippets"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
