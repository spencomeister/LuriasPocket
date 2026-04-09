"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth/check").then(async (res) => {
      if (!res.ok) {
        router.replace("/admin/login");
      } else {
        setAuthed(true);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  };

  if (authed === null) {
    return (
      <main className="max-w-3xl mx-auto py-12 px-4">
        <p className="text-gray-500">認証確認中...</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">管理パネル</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ログアウト
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AdminCard
          href="/admin/import"
          title="データインポート"
          description="GBF Wiki から最新データを取得・保存"
          icon="📥"
        />
        <AdminCard
          href="/admin/exclusions"
          title="除外設定"
          description="一覧ページから非表示にするカテゴリ・武器種・シリーズ"
          icon="🚫"
        />
        <AdminCard
          href="/admin/translations"
          title="翻訳管理"
          description="属性・武器種・シリーズ等の日本語翻訳"
          icon="🌐"
        />
        <AdminCard
          href="/admin/users"
          title="ユーザー管理"
          description="登録ユーザー一覧と削除"
          icon="👥"
        />
        <AdminCard
          href="/admin/password"
          title="パスワード変更"
          description="管理パスワードを変更"
          icon="🔑"
        />
      </div>
    </main>
  );
}

function AdminCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="glass glass-hover rounded-xl p-6 border border-white/10 transition-all block"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h2 className="font-semibold text-white mb-1">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
