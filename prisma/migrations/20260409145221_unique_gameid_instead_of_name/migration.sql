/*
  Warnings:

  - Made the column `gameId` on table `Character` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gameId` on table `Summon` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gameId` on table `Weapon` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameJp" TEXT,
    "rarity" TEXT NOT NULL DEFAULT 'SSR',
    "element" TEXT NOT NULL,
    "weapon" TEXT NOT NULL,
    "category" TEXT,
    "series" TEXT,
    "imageUrl" TEXT,
    "releaseDate" TEXT,
    "obtain" TEXT,
    "skills" TEXT,
    "abilities" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Character" ("abilities", "category", "createdAt", "element", "gameId", "id", "imageUrl", "name", "nameJp", "obtain", "rarity", "releaseDate", "series", "skills", "updatedAt", "weapon") SELECT "abilities", "category", "createdAt", "element", "gameId", "id", "imageUrl", "name", "nameJp", "obtain", "rarity", "releaseDate", "series", "skills", "updatedAt", "weapon" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE UNIQUE INDEX "Character_gameId_key" ON "Character"("gameId");
CREATE INDEX "Character_element_rarity_idx" ON "Character"("element", "rarity");
CREATE INDEX "Character_category_idx" ON "Character"("category");
CREATE INDEX "Character_series_idx" ON "Character"("series");
CREATE INDEX "Character_releaseDate_idx" ON "Character"("releaseDate");
CREATE TABLE "new_Summon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameJp" TEXT,
    "rarity" TEXT,
    "element" TEXT NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT,
    "mainAura" TEXT,
    "subAura" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Summon" ("category", "createdAt", "element", "gameId", "id", "imageUrl", "mainAura", "name", "nameJp", "rarity", "subAura", "updatedAt") SELECT "category", "createdAt", "element", "gameId", "id", "imageUrl", "mainAura", "name", "nameJp", "rarity", "subAura", "updatedAt" FROM "Summon";
DROP TABLE "Summon";
ALTER TABLE "new_Summon" RENAME TO "Summon";
CREATE UNIQUE INDEX "Summon_gameId_key" ON "Summon"("gameId");
CREATE INDEX "Summon_element_category_rarity_idx" ON "Summon"("element", "category", "rarity");
CREATE INDEX "Summon_name_idx" ON "Summon"("name");
CREATE TABLE "new_Weapon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameJp" TEXT,
    "rarity" TEXT,
    "element" TEXT NOT NULL,
    "weaponType" TEXT NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT,
    "skills" TEXT,
    "obtain" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Weapon" ("category", "createdAt", "element", "gameId", "id", "imageUrl", "name", "nameJp", "obtain", "rarity", "skills", "updatedAt", "weaponType") SELECT "category", "createdAt", "element", "gameId", "id", "imageUrl", "name", "nameJp", "obtain", "rarity", "skills", "updatedAt", "weaponType" FROM "Weapon";
DROP TABLE "Weapon";
ALTER TABLE "new_Weapon" RENAME TO "Weapon";
CREATE UNIQUE INDEX "Weapon_gameId_key" ON "Weapon"("gameId");
CREATE INDEX "Weapon_element_weaponType_category_rarity_idx" ON "Weapon"("element", "weaponType", "category", "rarity");
CREATE INDEX "Weapon_name_idx" ON "Weapon"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
