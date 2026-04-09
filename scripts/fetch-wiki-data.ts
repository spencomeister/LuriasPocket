/**
 * GBF Wiki データ取得スクリプト
 *
 * 使い方:
 *   npx tsx scripts/fetch-wiki-data.ts [characters|summons|weapons|all]
 *
 * 動作:
 *   GBF Wiki (https://gbf.wiki/) の Cargo API からデータを取得し、
 *   ローカルの SQLite データベースに upsert する。
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { fetchCharacters, fetchSummons, fetchWeapons } from "../src/lib/wiki-api.js";
import { normalizeCategory } from "../src/lib/normalize.js";

const BATCH_SIZE = 50;

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter });

const target = process.argv[2] ?? "all";

async function main() {
  console.log(`🚀 GBF Wiki データ取得開始 (target: ${target})`);

  if (target === "all" || target === "characters") {
    console.log("\n⚔️  キャラクター取得中...");
    try {
      const chars = await fetchCharacters();
      console.log(`   ${chars.length} 件取得`);
      const valid = chars.filter((c) => c.gameId);
      for (let i = 0; i < valid.length; i += BATCH_SIZE) {
        const batch = valid.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((c) =>
            prisma.character.upsert({
              where: { gameId: c.gameId! },
              create: {
                gameId: c.gameId!,
                name: c.name,
                nameJp: c.nameJp,
                rarity: c.rarity,
                element: c.element,
                weapon: c.weapon,
                category: normalizeCategory(c.category),
                imageUrl: c.imageUrl,
                releaseDate: c.releaseDate,
                obtain: c.obtain,
                skills: JSON.stringify(c.skills),
                abilities: JSON.stringify(c.abilities),
              },
              update: {
                name: c.name,
                nameJp: c.nameJp,
                element: c.element,
                weapon: c.weapon,
                category: normalizeCategory(c.category),
                imageUrl: c.imageUrl,
                releaseDate: c.releaseDate,
                obtain: c.obtain,
                skills: JSON.stringify(c.skills),
                abilities: JSON.stringify(c.abilities),
              },
            })
          )
        );
        process.stdout.write(`   ${Math.min(i + BATCH_SIZE, valid.length)} / ${valid.length}\r`);
      }
      console.log(`   ✅ ${valid.length} 件 upsert 完了`);
    } catch (e) {
      console.error("   ❌ キャラクター取得エラー:", e);
    }
  }

  if (target === "all" || target === "summons") {
    console.log("\n🌟 召喚石取得中...");
    try {
      const summons = await fetchSummons();
      console.log(`   ${summons.length} 件取得`);
      const validSummons = summons.filter((s) => s.gameId);
      for (let i = 0; i < validSummons.length; i += BATCH_SIZE) {
        const batch = validSummons.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((s) =>
            prisma.summon.upsert({
              where: { gameId: s.gameId! },
              create: {
                gameId: s.gameId!,
                name: s.name,
                nameJp: s.nameJp,
                element: s.element,
                category: normalizeCategory(s.category),
                imageUrl: s.imageUrl,
                mainAura: s.mainAura,
                subAura: s.subAura,
              },
              update: {
                name: s.name,
                nameJp: s.nameJp,
                element: s.element,
                category: normalizeCategory(s.category),
                imageUrl: s.imageUrl,
                mainAura: s.mainAura,
                subAura: s.subAura,
              },
            })
          )
        );
        process.stdout.write(`   ${Math.min(i + BATCH_SIZE, validSummons.length)} / ${validSummons.length}\r`);
      }
      console.log(`   ✅ ${validSummons.length} 件 upsert 完了`);
    } catch (e) {
      console.error("   ❌ 召喚石取得エラー:", e);
    }
  }

  if (target === "all" || target === "weapons") {
    console.log("\n🗡️  武器取得中...");
    try {
      const weapons = await fetchWeapons();
      console.log(`   ${weapons.length} 件取得`);
      const validWeapons = weapons.filter((w) => w.gameId);
      for (let i = 0; i < validWeapons.length; i += BATCH_SIZE) {
        const batch = validWeapons.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((w) =>
            prisma.weapon.upsert({
              where: { gameId: w.gameId! },
              create: {
                gameId: w.gameId!,
                name: w.name,
                nameJp: w.nameJp,
                element: w.element,
                weaponType: normalizeCategory(w.weaponType) ?? "",
                category: normalizeCategory(w.category),
                imageUrl: w.imageUrl,
                skills: JSON.stringify(w.skills),
                obtain: w.obtain,
              },
              update: {
                name: w.name,
                nameJp: w.nameJp,
                element: w.element,
                weaponType: normalizeCategory(w.weaponType) ?? "",
                category: normalizeCategory(w.category),
                imageUrl: w.imageUrl,
                skills: JSON.stringify(w.skills),
                obtain: w.obtain,
              },
            })
          )
        );
        process.stdout.write(`   ${Math.min(i + BATCH_SIZE, validWeapons.length)} / ${validWeapons.length}\r`);
      }
      console.log(`   ✅ ${validWeapons.length} 件 upsert 完了`);
    } catch (e) {
      console.error("   ❌ 武器取得エラー:", e);
    }
  }

  await prisma.$disconnect();
  console.log("\n✨ 完了");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
