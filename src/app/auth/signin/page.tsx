"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      loginId,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("ログインIDまたはパスワードが正しくありません。");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 animate-fade-slide-up">
      <h1 className="text-2xl font-bold mb-6 text-center text-gradient">ログイン</h1>
      <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4 border border-white/10">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded p-3 text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">ログインID</label>
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40"
            placeholder="your-id"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-500/20 text-sky-300 border border-sky-500/40 py-2 rounded-lg font-medium hover:bg-sky-500/30 disabled:opacity-50 transition-colors"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
        <p className="text-center text-sm text-gray-500">
          アカウントをお持ちでない方は{" "}
          <Link href="/auth/signup" className="text-sky-400 underline">
            新規登録
          </Link>
        </p>
      </form>
    </div>
  );
}
