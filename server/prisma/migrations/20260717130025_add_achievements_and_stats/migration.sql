-- AlterTable
ALTER TABLE "User" ADD COLUMN     "barriers_destroyed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "crawlers_killed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "droppers_killed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "flyers_killed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "max_level_reached" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shooters_killed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_kills" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Achievement" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "desc_ru" TEXT NOT NULL,
    "desc_en" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "user_id" BIGINT NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("user_id","achievement_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");

-- CreateIndex
CREATE INDEX "user_achievements_achievement_id_idx" ON "user_achievements"("achievement_id");

-- CreateIndex
CREATE INDEX "user_achievements_unlocked_at_idx" ON "user_achievements"("unlocked_at");

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
