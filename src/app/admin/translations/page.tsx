"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Translation {
  id: number;
  category: string;
  key: string;
  valueJp: string;
}

const CATEGORIES = [
  { key: "weaponType", label: "武器種" },
  { key: "characterType", label: "キャラタイプ" },
  { key: "element", label: "属性" },
  { key: "series", label: "シリーズ" },
  { key: "rarity", label: "レアリティ" },
] as const;

export default function TranslationsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [activeCategory, setActiveCategory] = useState("weaponType");
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(false);

  // 新規追加フォーム
  const [newKey, setNewKey] = useState("");
  const [newValueJp, setNewValueJp] = useState("");

  // 編集中
  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetch("/api/admin/auth/check").then(async (res) => {
      if (!res.ok) router.replace("/admin/login");
      else setAuthed(true);
    });
  }, [router]);

  const fetchTranslations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/translations?category=${activeCategory}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTranslations(data);
    } catch {
      setTranslations([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (authed) fetchTranslations();
  }, [authed, fetchTranslations]);

  const handleAdd = async () => {
    if (!newKey.trim() || !newValueJp.trim()) return;
    await fetch("/api/translations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: activeCategory,
        key: newKey.trim(),
        valueJp: newValueJp.trim(),
      }),
    });
    setNewKey("");
    setNewValueJp("");
    fetchTranslations();
  };

  const handleUpdate = async (id: number) => {
    if (!editValue.trim()) return;
    await fetch("/api/translations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, valueJp: editValue.trim() }),
    });
    setEditId(null);
    fetchTranslations();
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/translations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchTranslations();
  };

  if (authed === null) {
    return (
      <main className="max-w-3xl mx-auto py-12 px-4">
        <p className="text-gray-500">認証確認中...</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-2">
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← 管理パネル</a>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-gradient">翻訳管理</h1>

      {/* カテゴリタブ */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? "bg-indigo-500/30 text-indigo-200 border border-indigo-500/50"
                : "glass border border-white/10 text-gray-400 hover:text-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 新規追加 */}
      <div className="glass rounded-xl p-4 border border-white/10 mb-6">
        <h2 className="text-sm font-medium text-gray-400 mb-3">新規追加</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key (EN)"
            className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
          />
          <input
            type="text"
            value={newValueJp}
            onChange={(e) => setNewValueJp(e.target.value)}
            placeholder="日本語訳"
            className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
          />
          <button
            onClick={handleAdd}
            className="bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            追加
          </button>
        </div>
      </div>

      {/* テーブル */}
      <div className="glass rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : translations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">データなし</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Key (EN)
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  日本語訳
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {translations.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                    {t.key}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editId === t.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleUpdate(t.id)
                        }
                        className="bg-white/5 border border-indigo-500/50 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none w-full"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-200">{t.valueJp}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {editId === t.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(t.id)}
                            className="text-xs text-green-400 hover:text-green-300"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="text-xs text-gray-500 hover:text-gray-300"
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditId(t.id);
                              setEditValue(t.valueJp);
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            削除
                          </button>
                        </>
                      )}
                    </div>
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
