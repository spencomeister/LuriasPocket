"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const TYPES = [
  { key: "characters", label: "キャラクター" },
  { key: "summons", label: "召喚石" },
  { key: "weapons", label: "武器" },
] as const;

const FORMATS = [
  { key: "json", label: "JSON" },
  { key: "csv", label: "CSV (Excel対応)" },
] as const;

export default function ExportPage() {
  const { data: session, status } = useSession();
  const [type, setType] = useState("characters");
  const [format, setFormat] = useState("csv");

  const downloadUrl = `/api/export?type=${type}&format=${format}`;

  if (status === "loading") {
    return (
      <main className="max-w-xl mx-auto py-12 px-4">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="max-w-xl mx-auto py-12 px-4 space-y-6">
        <h1 className="text-2xl font-bold text-gradient">データエクスポート</h1>
        <div className="glass rounded-xl p-8 border border-white/10 text-center">
          <p className="text-gray-400 mb-4">エクスポートにはログインが必要です。</p>
          <Link
            href="/auth/signin"
            className="inline-block px-6 py-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-colors text-sm font-medium"
          >
            ログイン
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto py-12 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gradient">データエクスポート</h1>
        <p className="text-sm text-gray-500 mt-2">
          翻訳済みデータをJSONまたはCSV形式でダウンロードできます。
          所持情報が付加されたデータが出力されます。
        </p>
      </div>

      {/* タイプ選択 */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-400">データタイプ</h2>
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                type === t.key
                  ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                  : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* 形式選択 */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-gray-400">出力形式</h2>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                format === f.key
                  ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                  : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* ダウンロードボタン */}
      <a
        href={downloadUrl}
        download
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-colors text-sm font-medium"
      >
        <span>📥</span>
        <span>ダウンロード ({TYPES.find((t) => t.key === type)?.label} / {format.toUpperCase()})</span>
      </a>
    </main>
  );
}
