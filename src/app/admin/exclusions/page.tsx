"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Exclusion {
  id: number;
  type: string;
  value: string;
}

interface Translation {
  id: number;
  category: string;
  key: string;
  valueJp: string;
}

const EXCLUSION_TYPES = [
  { key: "category", label: "カテゴリ", translationCategory: null },
  { key: "weaponType", label: "武器種", translationCategory: "weaponType" },
  { key: "series", label: "シリーズ", translationCategory: "series" },
] as const;

export default function AdminExclusionsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [exclusions, setExclusions] = useState<Exclusion[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/auth/check").then(async (res) => {
      if (!res.ok) router.replace("/admin/login");
      else setAuthed(true);
    });
  }, [router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [exclRes, transRes, charRes, summonRes, weaponRes] = await Promise.all([
      fetch("/api/exclusions"),
      fetch("/api/translations"),
      fetch("/api/characters?distinct=category"),
      fetch("/api/summons?distinct=category"),
      fetch("/api/weapons?distinct=category"),
    ]);
    const excl = exclRes.ok ? await exclRes.json() : [];
    const trans = await transRes.json();

    const cats = new Set<string>();
    for (const res of [charRes, summonRes, weaponRes]) {
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach((item: { category?: string }) => {
            if (item.category) cats.add(item.category);
          });
        }
      }
    }

    setExclusions(Array.isArray(excl) ? excl : []);
    setTranslations(trans);
    setCategories([...cats].sort());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  const isExcluded = (type: string, value: string) =>
    exclusions.some((e) => e.type === type && e.value === value);

  const toggle = async (type: string, value: string) => {
    if (isExcluded(type, value)) {
      await fetch("/api/exclusions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
      });
    } else {
      await fetch("/api/exclusions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
      });
    }
    fetchData();
  };

  const getJp = (category: string, key: string) => {
    const t = translations.find(
      (t) =>
        t.category === category &&
        (t.key === key || t.key.toLowerCase() === key.toLowerCase()),
    );
    return t?.valueJp ?? key;
  };

  const weaponTypes = translations
    .filter((t) => t.category === "weaponType")
    .map((t) => t.key);
  const seriesKeys = translations
    .filter((t) => t.category === "series")
    .map((t) => t.key);

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
      <h1 className="text-2xl font-bold mb-2 text-gradient">システム除外設定</h1>
      <p className="text-sm text-gray-500 mb-8">
        除外を有効にすると、全ユーザーの一覧ページから非表示になります。
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">カテゴリ</h2>
        <div className="glass rounded-xl border border-white/10 p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <ToggleChip
                key={cat}
                label={cat}
                active={isExcluded("category", cat)}
                onClick={() => toggle("category", cat)}
              />
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-600">
                データなし（先にインポートしてください）
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">武器種</h2>
        <div className="glass rounded-xl border border-white/10 p-4">
          <div className="flex flex-wrap gap-2">
            {weaponTypes.map((wt) => (
              <ToggleChip
                key={wt}
                label={getJp("weaponType", wt)}
                sublabel={wt}
                active={isExcluded("weaponType", wt)}
                onClick={() => toggle("weaponType", wt)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">シリーズ</h2>
        <div className="glass rounded-xl border border-white/10 p-4">
          <div className="flex flex-wrap gap-2">
            {seriesKeys.map((s) => (
              <ToggleChip
                key={s}
                label={getJp("series", s)}
                sublabel={s}
                active={isExcluded("series", s)}
                onClick={() => toggle("series", s)}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ToggleChip({
  label,
  sublabel,
  active,
  onClick,
}: {
  label: string;
  sublabel?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
        active
          ? "bg-red-500/20 text-red-300 border-red-500/40 line-through"
          : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
      }`}
    >
      {label}
      {sublabel && sublabel !== label && (
        <span className="ml-1 text-xs text-gray-500">({sublabel})</span>
      )}
    </button>
  );
}
