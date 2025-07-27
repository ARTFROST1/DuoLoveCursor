/*
  Warnings:

  - Added the required column `category` to the `Achievement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Achievement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CoupleAchievement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partnershipId" INTEGER NOT NULL,
    "achievementId" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "achievedAt" DATETIME,
    CONSTRAINT "CoupleAchievement_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CoupleAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Achievement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "goal" INTEGER,
    "scope" TEXT NOT NULL DEFAULT 'INDIVIDUAL'
);
INSERT INTO "new_Achievement" ("description", "emoji", "goal", "id", "title") SELECT "description", "emoji", "goal", "id", "title" FROM "Achievement";
DROP TABLE "Achievement";
ALTER TABLE "new_Achievement" RENAME TO "Achievement";
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
