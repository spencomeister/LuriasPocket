"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function NavBar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-indigo-700 text-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link href="/" className="font-bold text-lg tracking-wide">
          GBF Checker
        </Link>
        <Link href="/characters" className="hover:underline text-sm">
          キャラクター
        </Link>
        <Link href="/summons" className="hover:underline text-sm">
          召喚石
        </Link>
        <Link href="/weapons" className="hover:underline text-sm">
          武器
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {status === "loading" ? null : session ? (
            <>
              <Link href="/dashboard" className="hover:underline text-sm">
                マイ所持
              </Link>
              <span className="text-sm opacity-80">{session.user?.name ?? session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="bg-white text-indigo-700 px-3 py-1 rounded text-sm font-medium hover:bg-indigo-100"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="hover:underline text-sm"
              >
                ログイン
              </Link>
              <Link
                href="/auth/signup"
                className="bg-white text-indigo-700 px-3 py-1 rounded text-sm font-medium hover:bg-indigo-100"
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
