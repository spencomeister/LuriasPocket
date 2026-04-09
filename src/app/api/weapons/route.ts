import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const element = searchParams.get("element");
  const weaponType = searchParams.get("weaponType");
  const category = searchParams.get("category");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));
  const skip = (page - 1) * limit;

  const where = {
    ...(element ? { element } : {}),
    ...(weaponType ? { weaponType } : {}),
    ...(category ? { category } : {}),
  };

  const [weapons, total] = await Promise.all([
    prisma.weapon.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.weapon.count({ where }),
  ]);

  return Response.json({ weapons, total, page, limit });
}
