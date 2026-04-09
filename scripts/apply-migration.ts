/**
 * Turso に直接マイグレーション SQL を適用するスクリプト
 *
 * 使い方: npx tsx scripts/apply-migration.ts
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("❌ TURSO_DATABASE_URL と TURSO_AUTH_TOKEN を .env に設定してください");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  // 既存データで gameId が NULL のレコードを先にチェック
  console.log("🔍 NULL gameId チェック...");
  for (const table of ["Character", "Summon", "Weapon"]) {
    const result = await client.execute(`SELECT COUNT(*) as cnt FROM "${table}" WHERE "gameId" IS NULL`);
    const count = Number(result.rows[0]?.cnt ?? 0);
    if (count > 0) {
      console.log(`⚠️  ${table} に gameId が NULL のレコードが ${count} 件あります。削除します...`);
      await client.execute(`DELETE FROM "${table}" WHERE "gameId" IS NULL`);
      console.log(`   ✅ 削除完了`);
    } else {
      console.log(`   ✅ ${table}: OK`);
    }
  }

  // 重複 gameId チェック＆削除（古い方を削除）
  console.log("\n🔍 重複 gameId チェック...");
  for (const table of ["Character", "Summon", "Weapon"]) {
    const result = await client.execute(
      `SELECT "gameId", COUNT(*) as cnt FROM "${table}" WHERE "gameId" IS NOT NULL GROUP BY "gameId" HAVING cnt > 1`
    );
    if (result.rows.length > 0) {
      console.log(`⚠️  ${table} に重複 gameId が ${result.rows.length} 件あります。古い方を削除します...`);
      for (const row of result.rows) {
        const gid = row.gameId as string;
        // 最新の id だけ残す
        await client.execute({
          sql: `DELETE FROM "${table}" WHERE "gameId" = ? AND "id" NOT IN (SELECT MAX("id") FROM "${table}" WHERE "gameId" = ?)`,
          args: [gid, gid],
        });
      }
      console.log(`   ✅ 削除完了`);
    } else {
      console.log(`   ✅ ${table}: OK`);
    }
  }

  // マイグレーション SQL を適用
  console.log("\n📦 マイグレーション適用中...");
  const sqlPath = resolve(__dirname, "../prisma/migrations/20260409145221_unique_gameid_instead_of_name/migration.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  // コメント除去して文単位に分割
  const statements = sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      // 短いログ
      const preview = stmt.replace(/\s+/g, " ").substring(0, 60);
      console.log(`   ✅ ${preview}...`);
    } catch (err) {
      console.error(`   ❌ ${stmt.substring(0, 80)}...`);
      console.error(`      ${err}`);
      throw err;
    }
  }

  console.log("\n✨ マイグレーション完了!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => client.close());
