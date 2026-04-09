"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mustChange, setMustChange] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "認証に失敗しました");
        return;
      }

      if (data.mustChangePassword) {
        setMustChange(true);
      } else {
        router.push("/admin");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("パスワードは8文字以上にしてください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "パスワード変更に失敗しました");
        return;
      }

      router.push("/admin");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (mustChange) {
    return (
      <main className="max-w-md mx-auto py-16 px-4">
        <div className="glass rounded-xl p-8 border border-white/10">
          <h1 className="text-xl font-bold text-gradient mb-2">パスワード変更</h1>
          <p className="text-sm text-gray-500 mb-6">
            初回ログインのため、パスワードを変更してください。
          </p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">新しいパスワード</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-sky-500/50 focus:outline-none"
                placeholder="8文字以上"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">確認</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-sky-500/50 focus:outline-none"
                placeholder="もう一度入力"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "変更中..." : "パスワードを変更"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto py-16 px-4">
      <div className="glass rounded-xl p-8 border border-white/10">
        <h1 className="text-xl font-bold text-gradient mb-2">管理者ログイン</h1>
        <p className="text-sm text-gray-500 mb-6">管理パスワードを入力してください。</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-sky-500/50 focus:outline-none"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "認証中..." : "ログイン"}
          </button>
        </form>
      </div>
    </main>
  );
}
