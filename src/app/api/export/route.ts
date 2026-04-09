import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTranslationMap } from "@/lib/series-names";
import { auth } from "@/lib/auth";

/**
 * GET /api/export?type=characters|summons|weapons&format=json|csv
 * 翻訳済みデータをエクスポートする。ログイン必須。所持情報付き。
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const userId = session.user.id;
  const type = request.nextUrl.searchParams.get("type") ?? "characters";
  const format = request.nextUrl.searchParams.get("format") ?? "json";

  if (!["characters", "summons", "weapons"].includes(type)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!["json", "csv"].includes(format)) {
    return Response.json({ error: "Invalid format" }, { status: 400 });
  }

  // ユーザーの所持情報を取得
  const inventory = await prisma.userInventory.findMany({
    where: { userId, itemType: type === "characters" ? "character" : type === "summons" ? "summon" : "weapon" },
  });
  const ownedMap = new Map(inventory.map((i) => [i.itemId, i.quantity]));

  // 翻訳マップの取得
  const [elementMap, weaponTypeMap, seriesMap, rarityMap] = await Promise.all([
    getTranslationMap("element"),
    getTranslationMap("weaponType"),
    getTranslationMap("series"),
    getTranslationMap("rarity"),
  ]);

  const t = (map: Record<string, string>, key: string | null | undefined) =>
    key ? (map[key.toLowerCase()] ?? key) : "";

  // システム除外を取得
  const exclusions = await prisma.systemExclusion.findMany();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildNot = (type: string): Record<string, string>[] => {
    const conditions: Record<string, string>[] = [];
    for (const ex of exclusions) {
      if (type === "characters") {
        if (ex.type === "category") conditions.push({ category: ex.value });
        if (ex.type === "series") conditions.push({ series: ex.value });
      } else if (type === "weapons") {
        if (ex.type === "category") conditions.push({ category: ex.value });
        if (ex.type === "weaponType") conditions.push({ weaponType: ex.value });
        if (ex.type === "series") conditions.push({ category: ex.value });
      } else if (type === "summons") {
        if (ex.type === "category") conditions.push({ category: ex.value });
      }
    }
    return conditions;
  };

  const notConditions = buildNot(type);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = notConditions.length > 0 ? { NOT: notConditions } : {};

  if (type === "characters") {
    const rows = await prisma.character.findMany({ where, orderBy: { name: "asc" } });
    const data = rows.map((c) => ({
      id: c.id,
      gameId: c.gameId ?? "",
      name: c.name,
      nameJp: c.nameJp ?? "",
      rarity: c.rarity,
      element: t(elementMap, c.element),
      elementEn: c.element,
      weapon: c.weapon
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean)
        .map((w) => t(weaponTypeMap, w))
        .join(", "),
      weaponEn: c.weapon,
      category: c.category ?? "",
      series: t(seriesMap, c.series),
      seriesEn: c.series ?? "",
      releaseDate: c.releaseDate ?? "",
      obtain: c.obtain ?? "",
      owned: ownedMap.has(c.id) ? "○" : "",
    }));
    return respond(data, format, "characters");
  }

  if (type === "summons") {
    const rows = await prisma.summon.findMany({ where, orderBy: { name: "asc" } });
    const data = rows.map((s) => ({
      id: s.id,
      gameId: s.gameId ?? "",
      name: s.name,
      nameJp: s.nameJp ?? "",
      rarity: s.rarity ?? "",
      element: t(elementMap, s.element),
      elementEn: s.element,
      category: s.category ?? "",
      mainAura: s.mainAura ?? "",
      subAura: s.subAura ?? "",
      owned: ownedMap.has(s.id) ? "○" : "",
    }));
    return respond(data, format, "summons");
  }

  // weapons
  const rows = await prisma.weapon.findMany({ where, orderBy: { name: "asc" } });
  const data = rows.map((w) => ({
    id: w.id,
    gameId: w.gameId ?? "",
    name: w.name,
    nameJp: w.nameJp ?? "",
    rarity: w.rarity ?? "",
    element: t(elementMap, w.element),
    elementEn: w.element,
    weaponType: t(weaponTypeMap, w.weaponType),
    weaponTypeEn: w.weaponType,
    category: w.category ?? "",
    obtain: w.obtain ?? "",
    owned: ownedMap.has(w.id) ? "○" : "",
    quantity: ownedMap.get(w.id) ?? 0,
  }));
  return respond(data, format, "weapons");
}

function respond(data: Record<string, unknown>[], format: string, filename: string) {
  if (format === "csv") {
    const csv = toCsv(data);
    // BOM付きUTF-8
    const bom = "\uFEFF";
    return new Response(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.json"`,
    },
  });
}

function toCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\n");
}
