import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const element = searchParams.get("element");
  const weapon = searchParams.get("weapon");
  const category = searchParams.get("category");
  const rarity = searchParams.get("rarity") ?? "SSR";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));
  const skip = (page - 1) * limit;

  const where = {
    ...(rarity ? { rarity } : {}),
    ...(element ? { element } : {}),
    ...(weapon ? { weapon } : {}),
    ...(category ? { category } : {}),
  };

  const [characters, total] = await Promise.all([
    prisma.character.findMany({
      where,
      skip,
      take: limit,
      orderBy: { releaseDate: "desc" },
    }),
    prisma.character.count({ where }),
  ]);

  return Response.json({ characters, total, page, limit });
}
