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
      // gameId が空のレコードはスキップ
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
      results.characters = { fetched: chars.length, upserted: valid.length };
    } catch (err) {
      results.characters = { error: String(err) };
    }
  }

  // 召喚石
  if (target === "all" || target === "summons") {
    try {
      const summons = await fetchSummons();
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
      }
      results.summons = { fetched: summons.length, upserted: validSummons.length };
    } catch (err) {
      results.summons = { error: String(err) };
    }
  }

  // 武器
  if (target === "all" || target === "weapons") {
    try {
      const weapons = await fetchWeapons();
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
      }
      results.weapons = { fetched: weapons.length, upserted: validWeapons.length };
    } catch (err) {
      results.weapons = { error: String(err) };
    }
  }

  return Response.json({ ok: true, results });
}
