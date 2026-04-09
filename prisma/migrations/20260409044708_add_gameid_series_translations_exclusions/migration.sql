-- AlterTable
ALTER TABLE "Character" ADD COLUMN "gameId" TEXT;
ALTER TABLE "Character" ADD COLUMN "series" TEXT;

-- AlterTable
ALTER TABLE "Summon" ADD COLUMN "gameId" TEXT;
ALTER TABLE "Summon" ADD COLUMN "rarity" TEXT;

-- AlterTable
ALTER TABLE "Weapon" ADD COLUMN "gameId" TEXT;
ALTER TABLE "Weapon" ADD COLUMN "rarity" TEXT;

-- CreateTable
CREATE TABLE "Translation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJp" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserExclusion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "UserExclusion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Translation_category_key_key" ON "Translation"("category", "key");

-- CreateIndex
CREATE UNIQUE INDEX "UserExclusion_userId_type_value_key" ON "UserExclusion"("userId", "type", "value");
