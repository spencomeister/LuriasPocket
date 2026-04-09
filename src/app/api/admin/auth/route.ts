import { NextRequest } from "next/server";
import {
  verifyAdminPassword,
  changeAdminPassword,
  createAdminToken,
  mustChangePassword,
  isAdminAuthenticated,
} from "@/lib/admin-auth";

const COOKIE_NAME = "admin-token";

/** POST /api/admin/auth — ログイン */
export async function POST(request: NextRequest) {
  const { password } = (await request.json()) as { password?: string };
  if (!password) {
    return Response.json({ error: "Password is required" }, { status: 400 });
  }

  const valid = await verifyAdminPassword(password);
  if (!valid) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  const needChange = await mustChangePassword();
  const token = await createAdminToken();

  const res = Response.json({ ok: true, mustChangePassword: needChange });
  res.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${8 * 60 * 60}`,
  );
  return res;
}

/** PUT /api/admin/auth — パスワード変更 */
export async function PUT(request: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return Response.json({ error: "Admin authentication required" }, { status: 401 });
  }

  const { newPassword } = (await request.json()) as { newPassword?: string };
  if (!newPassword || newPassword.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  await changeAdminPassword(newPassword);
  return Response.json({ ok: true });
}

/** DELETE /api/admin/auth — ログアウト */
export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
  return res;
}
