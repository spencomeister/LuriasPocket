import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const LOGIN_ID_RE = /^[a-zA-Z0-9_\-]{3,32}$/;

export async function POST(request: NextRequest) {
  try {
    const { loginId, name, password } = await request.json() as {
      loginId?: string;
      name?: string;
      password?: string;
    };

    if (!loginId || !name || !password) {
      return Response.json(
        { error: "ログインID、ユーザー名、パスワードは必須です。" },
        { status: 400 }
      );
    }

    if (!LOGIN_ID_RE.test(loginId)) {
      return Response.json(
        { error: "ログインIDは英数字・ハイフン・アンダースコアで3〜32文字です。" },
        { status: 400 }
      );
    }

    if (name.length < 1 || name.length > 50) {
      return Response.json(
        { error: "ユーザー名は1〜50文字です。" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "パスワードは8文字以上です。" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { loginId } });
    if (existing) {
      return Response.json(
        { error: "このログインIDは既に使用されています。" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { loginId, name, password: hashed },
    });

    return Response.json(
      { id: user.id, loginId: user.loginId, name: user.name },
      { status: 201 }
    );
  } catch (err) {
    console.error("register error:", err);
    return Response.json({ error: "登録に失敗しました。" }, { status: 500 });
  }
}
