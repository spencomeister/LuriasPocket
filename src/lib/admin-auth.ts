import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin-token";
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? "fallback-secret");

/** AdminConfig から passwordHash を取得。未設定なら .env の初期パスワードをハッシュ化して保存 */
async function getPasswordHash(): Promise<string | null> {
  const row = await prisma.adminConfig.findUnique({ where: { key: "passwordHash" } });
  if (row) return row.value;

  // 初期パスワードから自動セットアップ
  const initial = process.env.ADMIN_INITIAL_PASSWORD;
  if (!initial) return null;

  const hash = await bcrypt.hash(initial, 10);
  await prisma.adminConfig.upsert({
    where: { key: "passwordHash" },
    create: { key: "passwordHash", value: hash },
    update: { value: hash },
  });
  // 初回ログイン時にパスワード変更を要求するフラグ
  await prisma.adminConfig.upsert({
    where: { key: "mustChangePassword" },
    create: { key: "mustChangePassword", value: "true" },
    update: {},
  });
  return hash;
}

/** パスワード検証 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = await getPasswordHash();
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

/** パスワード変更（強制変更フラグも解除） */
export async function changeAdminPassword(newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.adminConfig.upsert({
    where: { key: "passwordHash" },
    create: { key: "passwordHash", value: hash },
    update: { value: hash },
  });
  await prisma.adminConfig.upsert({
    where: { key: "mustChangePassword" },
    create: { key: "mustChangePassword", value: "false" },
    update: { value: "false" },
  });
}

/** 強制パスワード変更が必要か */
export async function mustChangePassword(): Promise<boolean> {
  const row = await prisma.adminConfig.findUnique({ where: { key: "mustChangePassword" } });
  return row?.value === "true";
}

/** Admin JWT 生成 */
export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

/** Admin JWT 検証 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/** Cookie から admin 認証チェック */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}
