import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveSeriesFromObtain } from "@/lib/derive-series";
import { normalizeCategory } from "@/lib/normalize";
import { requireAdmin } from "@/lib/admin-guard";

const BATCH_SIZE = 50;

/**
 * POST /api/import-wiki
 *
 * ブラウザ側で取得済みの GBF Wiki データを受け取り、DB に upsert する。
 * admin 認証必須。
 *
 * Body: { characters?: CharacterRow[], summons?: SummonRow[], weapons?: WeaponRow[] }
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json() as {
    characters?: CharacterRow[];
    summons?: SummonRow[];
    weapons?: WeaponRow[];
  };

  const results: Record<string, { count: number } | { error: string }> = {};

  if (body.characters) {
    try {
      for (let i = 0; i < body.characters.length; i += BATCH_SIZE) {
        const batch = body.characters.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((c) => {
            const series = c.series ?? deriveSeriesFromObtain(c.obtain);
            return prisma.character.upsert({
              where: { name: c.name },
              create: {
                name: c.name,
                gameId: c.gameId ?? null,
                nameJp: c.nameJp ?? null,
                rarity: c.rarity ?? "SSR",
                element: c.element ?? "",
                weapon: c.weapon ?? "",
                category: normalizeCategory(c.category),
                series,
                imageUrl: c.imageUrl ?? null,
                releaseDate: c.releaseDate ?? null,
                obtain: c.obtain ?? null,
                skills: c.skills ? JSON.stringify(c.skills) : null,
                abilities: c.abilities ? JSON.stringify(c.abilities) : null,
              },
              update: {
                gameId: c.gameId ?? undefined,
                nameJp: c.nameJp ?? null,
                rarity: c.rarity ?? undefined,
                element: c.element ?? "",
                weapon: c.weapon ?? "",
                category: normalizeCategory(c.category),
                series,
                imageUrl: c.imageUrl ?? null,
                releaseDate: c.releaseDate ?? null,
                obtain: c.obtain ?? null,
                skills: c.skills ? JSON.stringify(c.skills) : null,
                abilities: c.abilities ? JSON.stringify(c.abilities) : null,
              },
            });
          })
        );
      }
      results.characters = { count: body.characters.length };
    } catch (err) {
      results.characters = { error: String(err) };
    }
  }

  if (body.summons) {
    try {
      for (let i = 0; i < body.summons.length; i += BATCH_SIZE) {
        const batch = body.summons.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((s) =>
            prisma.summon.upsert({
              where: { name: s.name },
              create: {
                name: s.name,
                gameId: s.gameId ?? null,
                nameJp: s.nameJp ?? null,
                rarity: s.rarity ?? null,
                element: s.element ?? "",
                category: normalizeCategory(s.category),
                imageUrl: s.imageUrl ?? null,
                mainAura: s.mainAura ?? null,
                subAura: s.subAura ?? null,
              },
              update: {
                gameId: s.gameId ?? undefined,
                nameJp: s.nameJp ?? null,
                rarity: s.rarity ?? null,
                element: s.element ?? "",
                category: normalizeCategory(s.category),
                imageUrl: s.imageUrl ?? null,
                mainAura: s.mainAura ?? null,
                subAura: s.subAura ?? null,
              },
            })
          )
        );
      }
      results.summons = { count: body.summons.length };
    } catch (err) {
      results.summons = { error: String(err) };
    }
  }

  if (body.weapons) {
    try {
      for (let i = 0; i < body.weapons.length; i += BATCH_SIZE) {
        const batch = body.weapons.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((w) =>
            prisma.weapon.upsert({
              where: { name: w.name },
              create: {
                name: w.name,
                gameId: w.gameId ?? null,
                nameJp: w.nameJp ?? null,
                rarity: w.rarity ?? null,
                element: w.element ?? "",
                weaponType: normalizeCategory(w.weaponType) ?? "",
                category: normalizeCategory(w.category),
                imageUrl: w.imageUrl ?? null,
                skills: w.skills ? JSON.stringify(w.skills) : null,
                obtain: w.obtain ?? null,
              },
              update: {
                gameId: w.gameId ?? undefined,
                nameJp: w.nameJp ?? null,
                rarity: w.rarity ?? null,
                element: w.element ?? "",
                weaponType: normalizeCategory(w.weaponType) ?? "",
                category: normalizeCategory(w.category),
                imageUrl: w.imageUrl ?? null,
                skills: w.skills ? JSON.stringify(w.skills) : null,
                obtain: w.obtain ?? null,
              },
            })
          )
        );
      }
      results.weapons = { count: body.weapons.length };
    } catch (err) {
      results.weapons = { error: String(err) };
    }
  }

  return Response.json({ ok: true, results });
}

// ── 型定義 ──

interface CharacterRow {
  name: string;
  gameId?: string | null;
  nameJp?: string | null;
  rarity?: string;
  element?: string;
  weapon?: string;
  category?: string | null;
  series?: string | null;
  imageUrl?: string | null;
  releaseDate?: string | null;
  obtain?: string | null;
  skills?: string[];
  abilities?: string[];
}

interface SummonRow {
  name: string;
  gameId?: string | null;
  nameJp?: string | null;
  rarity?: string | null;
  element?: string;
  category?: string | null;
  imageUrl?: string | null;
  mainAura?: string | null;
  subAura?: string | null;
}

interface WeaponRow {
  name: string;
  gameId?: string | null;
  nameJp?: string | null;
  rarity?: string | null;
  element?: string;
  weaponType?: string;
  category?: string | null;
  imageUrl?: string | null;
  skills?: string[];
  obtain?: string | null;
}
