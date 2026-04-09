"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, name, password }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "登録に失敗しました。");
        setLoading(false);
        return;
      }

      // 登録後に自動ログイン
      await signIn("credentials", { loginId, password, redirect: false });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 animate-fade-slide-up">
      <h1 className="text-2xl font-bold mb-6 text-center text-gradient">新規登録</h1>
      <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4 border border-white/10">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded p-3 text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">ログインID（英数字・ハイフン・アンダースコア、3〜32文字）</label>
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
            pattern="[a-zA-Z0-9_\-]{3,32}"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40"
            placeholder="your-id"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">ユーザー名（表示名、日本語/絵文字OK）</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40"
            placeholder="グランくん 🎮"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">パスワード（8文字以上）</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 py-2 rounded-lg font-medium hover:bg-indigo-500/30 disabled:opacity-50 transition-colors"
        >
          {loading ? "登録中..." : "登録する"}
        </button>
        <p className="text-center text-sm text-gray-500">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/auth/signin" className="text-indigo-400 underline">
            ログイン
          </Link>
        </p>
      </form>
    </div>
  );
}
