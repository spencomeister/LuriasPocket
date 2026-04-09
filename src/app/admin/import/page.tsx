"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

const WIKI_API = "https://gbf.wiki/api.php";
const LIMIT = 500;

type Status = "idle" | "fetching" | "importing" | "done" | "error";

interface Progress {
  characters: { status: Status; fetched: number; imported: number; error?: string };
  summons: { status: Status; fetched: number; imported: number; error?: string };
  weapons: { status: Status; fetched: number; imported: number; error?: string };
}

const initial: Progress = {
  characters: { status: "idle", fetched: 0, imported: 0 },
  summons: { status: "idle", fetched: 0, imported: 0 },
  weapons: { status: "idle", fetched: 0, imported: 0 },
};

async function cargoQuery(params: Record<string, string>) {
  const url = new URL(WIKI_API);
  url.searchParams.set("action", "cargoquery");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("limit", String(LIMIT));
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Wiki API ${res.status}`);
  const json = await res.json();
  return (json.cargoquery ?? []).map((item: { title: Record<string, string> }) => item.title);
}

async function cargoQueryAll(params: Record<string, string>) {
  const all: Record<string, string>[] = [];
  let offset = 0;
  while (true) {
    const batch = await cargoQuery({ ...params, offset: String(offset) });
    all.push(...batch);
    if (batch.length < LIMIT) break;
    offset += LIMIT;
  }
  return all;
}

function buildImageUrl(fileName: string | undefined): string | null {
  if (!fileName) return null;
  return `https://gbf.wiki/Special:Redirect/file/${encodeURIComponent(fileName.replace(/ /g, "_"))}`;
}

export default function AdminImportPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<Progress>(initial);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth/check").then(async (res) => {
      if (!res.ok) router.replace("/admin/login");
      else setAuthed(true);
    });
  }, [router]);

  const update = useCallback(
    (key: keyof Progress, patch: Partial<Progress[keyof Progress]>) =>
      setProgress((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } })),
    [],
  );

  const run = useCallback(async () => {
    setRunning(true);
    setProgress(initial);

    // ── キャラクター ──
    try {
      update("characters", { status: "fetching" });
      const rows = await cargoQueryAll({
        tables: "characters",
        fields: [
          "characters.id=gameId",
          "characters.name",
          "characters.jpname=nameJp",
          "characters.rarity",
          "characters.element",
          "characters.weapon",
          "characters.type=category",
          "characters.art1=image",
          "characters.release_date=releaseDate",
          "characters.obtain",
        ].join(","),
        where: 'characters.rarity="SSR"',
        order_by: "characters.release_date DESC",
      });
      const characters = rows.map((r: Record<string, string>) => ({
        name: r.name ?? "",
        gameId: r.gameId || null,
        nameJp: r.nameJp || null,
        rarity: r.rarity ?? "SSR",
        element: r.element ?? "",
        weapon: r.weapon ?? "",
        category: r.category || null,
        imageUrl: buildImageUrl(r.image),
        releaseDate: r.releaseDate || null,
        obtain: r.obtain || null,
        skills: [],
        abilities: [],
      }));
      update("characters", { status: "importing", fetched: characters.length });

      const res = await fetch("/api/import-wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characters }),
      });
      const json = await res.json();
      const count = json.results?.characters?.count ?? 0;
      update("characters", { status: "done", imported: count });
    } catch (e) {
      update("characters", { status: "error", error: String(e) });
    }

    // ── 召喚石 ──
    try {
      update("summons", { status: "fetching" });
      const rows = await cargoQueryAll({
        tables: "summons",
        fields: [
          "summons.id=gameId",
          "summons.name",
          "summons.jpname=nameJp",
          "summons.rarity",
          "summons.element",
          "summons.series=category",
          "summons.img_icon=image",
          "summons.aura1=mainAura",
          "summons.subaura1=subAura",
        ].join(","),
        order_by: "summons.name ASC",
      });
      const summons = rows.map((r: Record<string, string>) => ({
        name: r.name ?? "",
        gameId: r.gameId || null,
        nameJp: r.nameJp || null,
        rarity: r.rarity || null,
        element: r.element ?? "",
        category: r.category || null,
        imageUrl: buildImageUrl(r.image),
        mainAura: r.mainAura || null,
        subAura: r.subAura || null,
      }));
      update("summons", { status: "importing", fetched: summons.length });

      const res = await fetch("/api/import-wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summons }),
      });
      const json = await res.json();
      const count = json.results?.summons?.count ?? 0;
      update("summons", { status: "done", imported: count });
    } catch (e) {
      update("summons", { status: "error", error: String(e) });
    }

    // ── 武器 ──
    try {
      update("weapons", { status: "fetching" });
      const rows = await cargoQueryAll({
        tables: "weapons",
        fields: [
          "weapons.id=gameId",
          "weapons.name",
          "weapons.jpname=nameJp",
          "weapons.rarity",
          "weapons.element",
          "weapons.type=weaponType",
          "weapons.series=category",
          "weapons.img_icon=image",
          "weapons.s1_name=skill1",
          "weapons.s2_name=skill2",
          "weapons.obtain",
        ].join(","),
        order_by: "weapons.name ASC",
      });
      const weapons = rows.map((r: Record<string, string>) => ({
        name: r.name ?? "",
        gameId: r.gameId || null,
        nameJp: r.nameJp || null,
        rarity: r.rarity || null,
        element: r.element ?? "",
        weaponType: r.weaponType ?? "",
        category: r.category || null,
        imageUrl: buildImageUrl(r.image),
        skills: [r.skill1, r.skill2].filter(Boolean) as string[],
        obtain: r.obtain || null,
      }));
      update("weapons", { status: "importing", fetched: weapons.length });

      const res = await fetch("/api/import-wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weapons }),
      });
      const json = await res.json();
      const count = json.results?.weapons?.count ?? 0;
      update("weapons", { status: "done", imported: count });
    } catch (e) {
      update("weapons", { status: "error", error: String(e) });
    }

    setRunning(false);
  }, [update]);

  if (authed === null) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4">
        <p className="text-gray-500">認証確認中...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-2">
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← 管理パネル</a>
      </div>
      <h1 className="text-2xl font-bold mb-2 text-gradient">Wiki データインポート</h1>
      <p className="text-gray-500 mb-6 text-sm">
        ブラウザから GBF Wiki API を直接取得し、ローカル DB に保存します。
      </p>

      <button
        onClick={run}
        disabled={running}
        className="bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 disabled:opacity-50 px-6 py-2 rounded font-medium mb-8 transition-colors"
      >
        {running ? "インポート中..." : "インポート開始"}
      </button>

      <div className="space-y-4">
        {(["characters", "summons", "weapons"] as const).map((key) => {
          const p = progress[key];
          const label = key === "characters" ? "キャラクター" : key === "summons" ? "召喚石" : "武器";
          return (
            <div key={key} className="glass rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="font-medium">{label}</span>
                <StatusBadge status={p.status} />
              </div>
              {p.fetched > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  取得: {p.fetched} 件 / インポート: {p.imported} 件
                </p>
              )}
              {p.error && <p className="text-sm text-red-400 mt-1">{p.error}</p>}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    idle: "bg-white/5 text-gray-500",
    fetching: "bg-blue-500/15 text-blue-300",
    importing: "bg-yellow-500/15 text-yellow-300",
    done: "bg-green-500/15 text-green-300",
    error: "bg-red-500/15 text-red-300",
  };
  const labels: Record<Status, string> = {
    idle: "待機中",
    fetching: "Wiki から取得中...",
    importing: "DB に保存中...",
    done: "完了",
    error: "エラー",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded ${styles[status]}`}>{labels[status]}</span>
  );
}
