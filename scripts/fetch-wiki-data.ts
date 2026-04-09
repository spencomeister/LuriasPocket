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
      const chars = await fetchCharacters("SSR");
      console.log(`   ${chars.length} 件取得`);
      let count = 0;
      for (const c of chars) {
        await prisma.character.upsert({
          where: { name: c.name },
          create: {
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
        });
        count++;
        if (count % 50 === 0) process.stdout.write(`   ${count} / ${chars.length}\r`);
      }
      console.log(`   ✅ ${count} 件 upsert 完了`);
    } catch (e) {
      console.error("   ❌ キャラクター取得エラー:", e);
    }
  }

  if (target === "all" || target === "summons") {
    console.log("\n🌟 召喚石取得中...");
    try {
      const summons = await fetchSummons();
      console.log(`   ${summons.length} 件取得`);
      let count = 0;
      for (const s of summons) {
        await prisma.summon.upsert({
          where: { name: s.name },
          create: {
            name: s.name,
            nameJp: s.nameJp,
            element: s.element,
            category: normalizeCategory(s.category),
            imageUrl: s.imageUrl,
            mainAura: s.mainAura,
            subAura: s.subAura,
          },
          update: {
            nameJp: s.nameJp,
            element: s.element,
            category: normalizeCategory(s.category),
            imageUrl: s.imageUrl,
            mainAura: s.mainAura,
            subAura: s.subAura,
          },
        });
        count++;
        if (count % 50 === 0) process.stdout.write(`   ${count} / ${summons.length}\r`);
      }
      console.log(`   ✅ ${count} 件 upsert 完了`);
    } catch (e) {
      console.error("   ❌ 召喚石取得エラー:", e);
    }
  }

  if (target === "all" || target === "weapons") {
    console.log("\n🗡️  武器取得中...");
    try {
      const weapons = await fetchWeapons();
      console.log(`   ${weapons.length} 件取得`);
      let count = 0;
      for (const w of weapons) {
        await prisma.weapon.upsert({
          where: { name: w.name },
          create: {
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
            nameJp: w.nameJp,
            element: w.element,
            weaponType: normalizeCategory(w.weaponType) ?? "",
            category: normalizeCategory(w.category),
            imageUrl: w.imageUrl,
            skills: JSON.stringify(w.skills),
            obtain: w.obtain,
          },
        });
        count++;
        if (count % 50 === 0) process.stdout.write(`   ${count} / ${weapons.length}\r`);
      }
      console.log(`   ✅ ${count} 件 upsert 完了`);
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
