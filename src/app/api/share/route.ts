import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

/** POST /api/share — 共有トークン発行 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { expiresIn } = (await request.json()) as { expiresIn?: string };

  // 有効期限の算出
  const durations: Record<string, number> = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  const ms = durations[expiresIn ?? "24h"] ?? durations["24h"];
  const expiresAt = new Date(Date.now() + ms);

  const token = nanoid(21);

  const shareToken = await prisma.shareToken.create({
    data: {
      userId: session.user.id,
      token,
      expiresAt,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = `${appUrl}/share/${shareToken.token}`;

  return Response.json({ token: shareToken.token, url: shareUrl, expiresAt: shareToken.expiresAt });
}

/** GET /api/share — 自分の共有トークン一覧 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // 期限切れを遅延削除
  await prisma.shareToken.deleteMany({
    where: { userId: session.user.id, expiresAt: { lt: new Date() } },
  });

  const tokens = await prisma.shareToken.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return Response.json(
    tokens.map((t) => ({
      token: t.token,
      url: `${appUrl}/share/${t.token}`,
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
    })),
  );
}

/** DELETE /api/share — 共有トークン削除 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { token } = (await request.json()) as { token?: string };
  if (!token) {
    return Response.json({ error: "token is required" }, { status: 400 });
  }

  await prisma.shareToken.deleteMany({
    where: { userId: session.user.id, token },
  });

  return Response.json({ ok: true });
}
