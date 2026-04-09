import { isAdminAuthenticated } from "@/lib/admin-auth";

/** GET /api/admin/auth/check — admin 認証状態チェック */
export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  return Response.json({ ok: true });
}
