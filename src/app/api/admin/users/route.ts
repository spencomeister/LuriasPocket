import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

/** GET /api/admin/users — ユーザー一覧 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      loginId: true,
      name: true,
      createdAt: true,
      _count: { select: { inventory: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(users);
}

/** DELETE /api/admin/users — ユーザー削除 */
export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return Response.json({ ok: true });
}
