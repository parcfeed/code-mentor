DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM ('member', 'moderator', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "user_role" USING "role"::text::"user_role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member';

ALTER TABLE "snippets" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
