import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

/** GET /api/translations?category=weaponType */
export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category");
    const where = category ? { category } : {};
    const translations = await prisma.translation.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });
    return Response.json(translations);
  } catch (err) {
    console.error("GET /api/translations error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

/** POST /api/translations — 新規翻訳追加（admin必須） */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { category, key, valueJp } = (await request.json()) as {
    category: string;
    key: string;
    valueJp: string;
  };
  if (!category || !key || !valueJp) {
    return Response.json({ error: "category, key, valueJp are required" }, { status: 400 });
  }
  const translation = await prisma.translation.upsert({
    where: { category_key: { category, key } },
    create: { category, key, valueJp },
    update: { valueJp },
  });
  return Response.json(translation);
}

/** PUT /api/translations — 翻訳更新（admin必須） */
export async function PUT(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id, valueJp } = (await request.json()) as {
    id: number;
    valueJp: string;
  };
  if (!id || !valueJp) {
    return Response.json({ error: "id and valueJp are required" }, { status: 400 });
  }
  const translation = await prisma.translation.update({
    where: { id },
    data: { valueJp },
  });
  return Response.json(translation);
}

/** DELETE /api/translations — 翻訳削除（admin必須） */
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = (await request.json()) as { id: number };
  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }
  await prisma.translation.delete({ where: { id } });
  return Response.json({ ok: true });
}
