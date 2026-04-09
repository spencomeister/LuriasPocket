import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchCharacters, fetchSummons, fetchWeapons } from "@/lib/wiki-api";

/**
 * POST /api/fetch-wiki
 * GBF Wiki からデータを取得してデータベースに保存する。
 * クエリパラメータ: ?target=characters|summons|weapons|all (デフォルト: all)
 *
 * 本番環境では Cron Job やバッチで定期実行することを想定。
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target") ?? "all";

  const results: Record<string, { fetched: number; upserted: number } | { error: string }> = {};

  // キャラクター
  if (target === "all" || target === "characters") {
    try {
      const chars = await fetchCharacters("SSR");
      let upserted = 0;
      for (const c of chars) {
        await prisma.character.upsert({
          where: { name: c.name },
          create: {
            name: c.name,
            nameJp: c.nameJp,
            rarity: c.rarity,
            element: c.element,
            weapon: c.weapon,
            category: c.category,
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
            category: c.category,
            imageUrl: c.imageUrl,
            releaseDate: c.releaseDate,
            obtain: c.obtain,
            skills: JSON.stringify(c.skills),
            abilities: JSON.stringify(c.abilities),
          },
        });
        upserted++;
      }
      results.characters = { fetched: chars.length, upserted };
    } catch (err) {
      results.characters = { error: String(err) };
    }
  }

  // 召喚石
  if (target === "all" || target === "summons") {
    try {
      const summons = await fetchSummons();
      let upserted = 0;
      for (const s of summons) {
        await prisma.summon.upsert({
          where: { name: s.name },
          create: {
            name: s.name,
            nameJp: s.nameJp,
            element: s.element,
            category: s.category,
            imageUrl: s.imageUrl,
            mainAura: s.mainAura,
            subAura: s.subAura,
          },
          update: {
            nameJp: s.nameJp,
            element: s.element,
            category: s.category,
            imageUrl: s.imageUrl,
            mainAura: s.mainAura,
            subAura: s.subAura,
          },
        });
        upserted++;
      }
      results.summons = { fetched: summons.length, upserted };
    } catch (err) {
      results.summons = { error: String(err) };
    }
  }

  // 武器
  if (target === "all" || target === "weapons") {
    try {
      const weapons = await fetchWeapons();
      let upserted = 0;
      for (const w of weapons) {
        await prisma.weapon.upsert({
          where: { name: w.name },
          create: {
            name: w.name,
            nameJp: w.nameJp,
            element: w.element,
            weaponType: w.weaponType,
            category: w.category,
            imageUrl: w.imageUrl,
            skills: JSON.stringify(w.skills),
            obtain: w.obtain,
          },
          update: {
            nameJp: w.nameJp,
            element: w.element,
            weaponType: w.weaponType,
            category: w.category,
            imageUrl: w.imageUrl,
            skills: JSON.stringify(w.skills),
            obtain: w.obtain,
          },
        });
        upserted++;
      }
      results.weapons = { fetched: weapons.length, upserted };
    } catch (err) {
      results.weapons = { error: String(err) };
    }
  }

  return Response.json({ ok: true, results });
}
