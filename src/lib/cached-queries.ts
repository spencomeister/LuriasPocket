import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// ── Translation Maps (TTL: 1 hour) ──────────────────────────────────────────

export const getCachedTranslationMap = unstable_cache(
  async (category: string): Promise<Record<string, string>> => {
    const rows = await prisma.translation.findMany({ where: { category } });
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key.toLowerCase()] = row.valueJp;
    }
    return map;
  },
  ["translation-map"],
  { revalidate: 3600, tags: ["translations"] },
);

// ── System Exclusions (TTL: 1 hour) ─────────────────────────────────────────

export const getCachedExclusions = unstable_cache(
  async () => {
    return prisma.systemExclusion.findMany();
  },
  ["system-exclusions"],
  { revalidate: 3600, tags: ["exclusions"] },
);

// ── Character filter metadata (TTL: 15 min) ─────────────────────────────────

export const getCachedCharacterFilters = unstable_cache(
  async () => {
    const [elements, weapons, categories, seriesList, rarities] =
      await Promise.all([
        prisma.character.findMany({
          select: { element: true },
          distinct: ["element"],
        }),
        prisma.character.findMany({
          select: { weapon: true },
          distinct: ["weapon"],
        }),
        prisma.character.findMany({
          select: { category: true },
          distinct: ["category"],
          where: { category: { not: null } },
        }),
        prisma.character.findMany({
          select: { series: true },
          distinct: ["series"],
          where: { series: { not: null } },
        }),
        prisma.character.findMany({
          select: { rarity: true },
          distinct: ["rarity"],
        }),
      ]);

    // 武器種は個別の値をカンマ分割で抽出
    const weaponSet = new Set<string>();
    weapons.forEach((w) =>
      w.weapon
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((wt) => weaponSet.add(wt)),
    );

    return {
      elements: elements.map((e) => e.element),
      weapons: [...weaponSet].sort(),
      categories: categories.map((c) => c.category!).filter(Boolean),
      seriesList: seriesList.map((s) => s.series!).filter(Boolean),
      rarities: rarities.map((r) => r.rarity).filter(Boolean).sort(),
    };
  },
  ["character-filters"],
  { revalidate: 900, tags: ["character-filters"] },
);

// ── Summon filter metadata (TTL: 15 min) ─────────────────────────────────────

export const getCachedSummonFilters = unstable_cache(
  async () => {
    const [elements, categories, rarities] = await Promise.all([
      prisma.summon.findMany({
        select: { element: true },
        distinct: ["element"],
      }),
      prisma.summon.findMany({
        select: { category: true },
        distinct: ["category"],
        where: { category: { not: null } },
      }),
      prisma.summon.findMany({
        select: { rarity: true },
        distinct: ["rarity"],
        where: { rarity: { not: null } },
      }),
    ]);

    return {
      elements: elements.map((e) => e.element),
      categories: categories.map((c) => c.category!).filter(Boolean),
      rarities: rarities.map((r) => r.rarity!).sort(),
    };
  },
  ["summon-filters"],
  { revalidate: 900, tags: ["summon-filters"] },
);

// ── Weapon filter metadata (TTL: 15 min) ─────────────────────────────────────

export const getCachedWeaponFilters = unstable_cache(
  async () => {
    const [elements, weaponTypes, categories, rarities] = await Promise.all([
      prisma.weapon.findMany({
        select: { element: true },
        distinct: ["element"],
      }),
      prisma.weapon.findMany({
        select: { weaponType: true },
        distinct: ["weaponType"],
      }),
      prisma.weapon.findMany({
        select: { category: true },
        distinct: ["category"],
        where: { category: { not: null } },
      }),
      prisma.weapon.findMany({
        select: { rarity: true },
        distinct: ["rarity"],
        where: { rarity: { not: null } },
      }),
    ]);

    return {
      elements: elements.map((e) => e.element),
      weaponTypes: weaponTypes.map((w) => w.weaponType),
      categories: categories.map((c) => c.category!).filter(Boolean),
      rarities: rarities.map((r) => r.rarity!).sort(),
    };
  },
  ["weapon-filters"],
  { revalidate: 900, tags: ["weapon-filters"] },
);
