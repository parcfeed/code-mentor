-- PostgreSQL ne permet PAS de retirer une valeur d'un enum via ALTER TYPE ... DROP VALUE.
-- On recrée donc le type sans 'admin' puis on recaste la colonne.
-- 1. Aucun utilisateur admin ne doit subsister : convertir d'éventuels comptes en modérateur.
UPDATE "users" SET "role" = 'moderator' WHERE "role" = 'admin';

-- 2. Créer le nouveau type sans la valeur 'admin'.
CREATE TYPE "user_role_new" AS ENUM ('member', 'moderator');

-- 3. Recaster la colonne users.role vers le nouveau type.
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "user_role_new" USING ("role"::text::"user_role_new");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member';

-- 4. Supprimer l'ancien type et renommer le nouveau.
DROP TYPE "user_role";
ALTER TYPE "user_role_new" RENAME TO "user_role";