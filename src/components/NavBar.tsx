"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function NavBar() {
  const { data: session, status } = useSession();

  return (
    <nav className="glass border-t-0 border-x-0 border-b border-white/10 text-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link href="/" className="font-bold text-lg tracking-wide text-gradient font-title">
          ルリアのぽけっと手帳
        </Link>
        <Link href="/characters" className="text-sm text-gray-400 hover:text-white transition-colors">
          キャラクター
        </Link>
        <Link href="/summons" className="text-sm text-gray-400 hover:text-white transition-colors">
          召喚石
        </Link>
        <Link href="/weapons" className="text-sm text-gray-400 hover:text-white transition-colors">
          武器
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {status === "loading" ? null : session ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                マイ所持
              </Link>
              <Link href="/export" className="text-sm text-gray-400 hover:text-white transition-colors">
                エクスポート
              </Link>
              <span className="text-sm text-gray-500">{session.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="glass px-3 py-1 rounded text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ログイン
              </Link>
              <Link
                href="/auth/signup"
                className="bg-sky-500/20 border border-sky-500/30 text-sky-300 px-3 py-1 rounded text-sm font-medium hover:bg-sky-500/30 transition-all"
              >
                新規登録
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
