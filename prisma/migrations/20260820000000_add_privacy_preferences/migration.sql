-- AlterTable: add privacy preference columns to users
ALTER TABLE "users" ADD COLUMN "default_anonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "show_in_leaderboard" BOOLEAN NOT NULL DEFAULT true;
