-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserInventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "uncap" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserInventory" ("createdAt", "id", "itemId", "itemType", "quantity", "uncap", "updatedAt", "userId") SELECT "createdAt", "id", "itemId", "itemType", "quantity", "uncap", "updatedAt", "userId" FROM "UserInventory";
DROP TABLE "UserInventory";
ALTER TABLE "new_UserInventory" RENAME TO "UserInventory";
CREATE UNIQUE INDEX "UserInventory_userId_itemType_itemId_key" ON "UserInventory"("userId", "itemType", "itemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
