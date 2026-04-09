import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const DB_URL = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

const globalForPrisma = globalThis as unknown as {
  ___prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.___prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: DB_URL }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.___prisma = prisma;
