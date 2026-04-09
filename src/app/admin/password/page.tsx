"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPasswordPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth/check").then(async (res) => {
      if (!res.ok) router.replace("/admin/login");
      else setAuthed(true);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

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
        setError(data.error ?? "変更に失敗しました");
        return;
      }
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (authed === null) {
    return (
      <main className="max-w-md mx-auto py-12 px-4">
        <p className="text-gray-500">認証確認中...</p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-2">
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← 管理パネル</a>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-gradient">パスワード変更</h1>

      <div className="glass rounded-xl p-6 border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">新しいパスワード</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-500/50 focus:outline-none"
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
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-500/50 focus:outline-none"
              placeholder="もう一度入力"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">パスワードを変更しました</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "変更中..." : "変更"}
          </button>
        </form>
      </div>
    </main>
  );
}
