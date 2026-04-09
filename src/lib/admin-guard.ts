import { isAdminAuthenticated } from "@/lib/admin-auth";

/** API Route 用の admin ガード。未認証なら 401 Response を返す */
export async function requireAdmin(): Promise<Response | null> {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return Response.json({ error: "Admin authentication required" }, { status: 401 });
  }
  return null;
}
