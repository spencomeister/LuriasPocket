import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchCharacters, fetchSummons, fetchWeapons } from "@/lib/wiki-api";
import { normalizeCategory } from "@/lib/normalize";

const BATCH_SIZE = 50;

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
      const chars = await fetchCharacters();
      for (let i = 0; i < chars.length; i += BATCH_SIZE) {
        const batch = chars.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((c) =>
            prisma.character.upsert({
              where: { name: c.name },
              create: {
                name: c.name,
                gameId: c.gameId,
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
                gameId: c.gameId,
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
            })
          )
        );
      }
      results.characters = { fetched: chars.length, upserted: chars.length };
    } catch (err) {
      results.characters = { error: String(err) };
    }
  }

  // 召喚石
  if (target === "all" || target === "summons") {
    try {
      const summons = await fetchSummons();
      for (let i = 0; i < summons.length; i += BATCH_SIZE) {
        const batch = summons.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((s) =>
            prisma.summon.upsert({
              where: { name: s.name },
              create: {
                name: s.name,
                gameId: s.gameId,
                nameJp: s.nameJp,
                element: s.element,
                category: normalizeCategory(s.category),
                imageUrl: s.imageUrl,
                mainAura: s.mainAura,
                subAura: s.subAura,
              },
              update: {
                gameId: s.gameId,
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
      }
      results.summons = { fetched: summons.length, upserted: summons.length };
    } catch (err) {
      results.summons = { error: String(err) };
    }
  }

  // 武器
  if (target === "all" || target === "weapons") {
    try {
      const weapons = await fetchWeapons();
      for (let i = 0; i < weapons.length; i += BATCH_SIZE) {
        const batch = weapons.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((w) =>
            prisma.weapon.upsert({
              where: { name: w.name },
              create: {
                name: w.name,
                gameId: w.gameId,
                nameJp: w.nameJp,
                element: w.element,
                weaponType: normalizeCategory(w.weaponType) ?? "",
                category: normalizeCategory(w.category),
                imageUrl: w.imageUrl,
                skills: JSON.stringify(w.skills),
                obtain: w.obtain,
              },
              update: {
                gameId: w.gameId,
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
      }
      results.weapons = { fetched: weapons.length, upserted: weapons.length };
    } catch (err) {
      results.weapons = { error: String(err) };
    }
  }

  return Response.json({ ok: true, results });
}
