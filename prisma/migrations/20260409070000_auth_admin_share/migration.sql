-- DropIndex
DROP INDEX IF EXISTS "Account_provider_providerAccountId_key";

-- DropIndex
DROP INDEX IF EXISTS "Session_sessionToken_key";

-- DropIndex
DROP INDEX IF EXISTS "VerificationToken_identifier_token_key";

-- DropIndex
DROP INDEX IF EXISTS "VerificationToken_token_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS "Account";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS "Session";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS "VerificationToken";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AdminConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ShareToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables: User (email → loginId, drop nullable fields)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loginId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Migrate existing users: use email as loginId (fallback to id), coalesce nullable name/password
INSERT INTO "new_User" ("id", "loginId", "name", "password", "createdAt")
  SELECT "id",
         COALESCE("email", "id"),
         COALESCE("name", 'user'),
         COALESCE("password", ''),
         CURRENT_TIMESTAMP
  FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AdminConfig_key_key" ON "AdminConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ShareToken_token_key" ON "ShareToken"("token");
