"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  loginId: string;
  name: string;
  createdAt: string;
  _count: { inventory: number };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/auth/check").then(async (res) => {
      if (!res.ok) router.replace("/admin/login");
      else setAuthed(true);
    });
  }, [router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchUsers();
  }, [authed, fetchUsers]);

  const handleDelete = async (user: User) => {
    if (!confirm(`「${user.name}」(${user.loginId}) を削除しますか？\nこの操作は取り消せません。`)) return;

    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id }),
    });
    if (res.ok) fetchUsers();
  };

  if (authed === null || loading) {
    return (
      <main className="max-w-3xl mx-auto py-12 px-4">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-2">
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← 管理パネル</a>
      </div>
      <h1 className="text-2xl font-bold mb-2 text-gradient">ユーザー管理</h1>
      <p className="text-sm text-gray-500 mb-6">登録ユーザー {users.length} 人</p>

      <div className="glass rounded-xl border border-white/10 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">ユーザーなし</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">名前</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ログインID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">所持数</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">登録日</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-200">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">{user.loginId}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{user._count.inventory}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
