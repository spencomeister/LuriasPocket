import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const element = searchParams.get("element");
  const category = searchParams.get("category");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));
  const skip = (page - 1) * limit;

  const where = {
    ...(element ? { element } : {}),
    ...(category ? { category } : {}),
  };

  const [summons, total] = await Promise.all([
    prisma.summon.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.summon.count({ where }),
  ]);

  return Response.json({ summons, total, page, limit });
}
