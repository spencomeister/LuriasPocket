import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCategory } from "@/lib/normalize";
import { requireAdmin } from "@/lib/admin-guard";

/** GET /api/exclusions — システム全体の除外設定取得 */
export async function GET() {
  const exclusions = await prisma.systemExclusion.findMany({
    orderBy: [{ type: "asc" }, { value: "asc" }],
  });
  return Response.json(exclusions);
}

/** POST /api/exclusions — 除外追加（admin必須） */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { type, value } = (await request.json()) as {
    type: string;
    value: string;
  };
  if (!type || !value) {
    return Response.json({ error: "type and value are required" }, { status: 400 });
  }
  const normalizedValue = normalizeCategory(value) ?? value;
  const exclusion = await prisma.systemExclusion.upsert({
    where: { type_value: { type, value: normalizedValue } },
    create: { type, value: normalizedValue },
    update: {},
  });
  return Response.json(exclusion);
}

/** DELETE /api/exclusions — 除外削除（admin必須） */
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { type, value } = (await request.json()) as {
    type: string;
    value: string;
  };
  if (!type || !value) {
    return Response.json({ error: "type and value are required" }, { status: 400 });
  }
  const normalizedValue = normalizeCategory(value) ?? value;
  await prisma.systemExclusion.deleteMany({ where: { type, value: normalizedValue } });
  return Response.json({ ok: true });
}
