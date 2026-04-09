import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json() as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return Response.json(
        { error: "メールアドレスとパスワードは必須です。" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "このメールアドレスは既に登録されています。" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: name ?? null, email, password: hashed },
    });

    return Response.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (err) {
    console.error("register error:", err);
    return Response.json({ error: "登録に失敗しました。" }, { status: 500 });
  }
}
