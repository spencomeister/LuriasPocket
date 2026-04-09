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

  const results: Record<string, { count: number; skipped?: number; errors?: string[] } | { error: string }> = {};

  if (body.characters) {
    // gameId で重複排除（後勝ち）& gameId 空を除外
    const deduped = dedup(body.characters.filter((c) => c.gameId?.trim()));
    const errors: string[] = [];
    let upserted = 0;
    for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
      const batch = deduped.slice(i, i + BATCH_SIZE);
      try {
        await prisma.$transaction(
          batch.map((c) => {
            const series = c.series ?? deriveSeriesFromObtain(c.obtain);
            return prisma.character.upsert({
              where: { gameId: c.gameId! },
              create: {
                gameId: c.gameId!,
                name: c.name,
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
                name: c.name,
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
        upserted += batch.length;
      } catch (err) {
        errors.push(`batch ${i}-${i + batch.length}: ${String(err)}`);
      }
    }
    results.characters = {
      count: upserted,
      skipped: body.characters.length - deduped.length,
      ...(errors.length > 0 ? { errors } : {}),
    };
  }

  if (body.summons) {
    const deduped = dedup(body.summons.filter((s) => s.gameId?.trim()));
    const errors: string[] = [];
    let upserted = 0;
    for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
      const batch = deduped.slice(i, i + BATCH_SIZE);
      try {
        await prisma.$transaction(
          batch.map((s) =>
            prisma.summon.upsert({
              where: { gameId: s.gameId! },
              create: {
                gameId: s.gameId!,
                name: s.name,
                nameJp: s.nameJp ?? null,
                rarity: s.rarity ?? null,
                element: s.element ?? "",
                category: normalizeCategory(s.category),
                imageUrl: s.imageUrl ?? null,
                mainAura: s.mainAura ?? null,
                subAura: s.subAura ?? null,
              },
              update: {
                name: s.name,
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
        upserted += batch.length;
      } catch (err) {
        errors.push(`batch ${i}-${i + batch.length}: ${String(err)}`);
      }
    }
    results.summons = {
      count: upserted,
      skipped: body.summons.length - deduped.length,
      ...(errors.length > 0 ? { errors } : {}),
    };
  }

  if (body.weapons) {
    const deduped = dedup(body.weapons.filter((w) => w.gameId?.trim()));
    const errors: string[] = [];
    let upserted = 0;
    for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
      const batch = deduped.slice(i, i + BATCH_SIZE);
      try {
        await prisma.$transaction(
          batch.map((w) =>
            prisma.weapon.upsert({
              where: { gameId: w.gameId! },
              create: {
                gameId: w.gameId!,
                name: w.name,
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
                name: w.name,
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
        upserted += batch.length;
      } catch (err) {
        errors.push(`batch ${i}-${i + batch.length}: ${String(err)}`);
      }
    }
    results.weapons = {
      count: upserted,
      skipped: body.weapons.length - deduped.length,
      ...(errors.length > 0 ? { errors } : {}),
    };
  }

  return Response.json({ ok: true, results });
}

/** gameId で重複排除（後勝ち） */
function dedup<T extends { gameId?: string | null }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (row.gameId) map.set(row.gameId, row);
  }
  return [...map.values()];
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
