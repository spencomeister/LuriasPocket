"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

const WIKI_API = "https://gbf.wiki/api.php";
const LIMIT = 500;
const CHUNK_SIZE = 100; // サーバーへ一度に送る件数

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

  const importCharacters = useCallback(async () => {
    update("characters", { status: "fetching", fetched: 0, imported: 0, error: undefined });
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
      order_by: "characters.release_date DESC",
    });
    const characters = rows.map((r: Record<string, string>) => ({
      name: r.name ?? "",
      gameId: r.gameId || null,
      nameJp: r.nameJp || null,
      rarity: r.rarity ?? "",
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

    let totalImported = 0;
    let totalSkipped = 0;
    const allErrors: string[] = [];

    for (let i = 0; i < characters.length; i += CHUNK_SIZE) {
      const chunk = characters.slice(i, i + CHUNK_SIZE);
      try {
        const res = await fetch("/api/import-wiki", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characters: chunk }),
        });
        const json = await res.json();
        const r = json.results?.characters;
        if (r?.count) totalImported += r.count;
        if (r?.skipped) totalSkipped += r.skipped;
        if (r?.errors) allErrors.push(...r.errors);
      } catch (e) {
        allErrors.push(`chunk ${i}-${i + chunk.length}: ${String(e)}`);
      }
      update("characters", { imported: totalImported });
    }

    const parts: string[] = [];
    if (totalSkipped) parts.push(`重複除外: ${totalSkipped}件`);
    if (allErrors.length) parts.push(`エラー: ${allErrors.length}バッチ\n${allErrors.slice(0, 3).join("\n")}`);
    update("characters", {
      status: allErrors.length ? "error" : "done",
      imported: totalImported,
      error: parts.join(" / ") || undefined,
    });
  }, [update]);

  const importSummons = useCallback(async () => {
    update("summons", { status: "fetching", fetched: 0, imported: 0, error: undefined });
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

    let totalImported = 0;
    let totalSkipped = 0;
    const allErrors: string[] = [];

    for (let i = 0; i < summons.length; i += CHUNK_SIZE) {
      const chunk = summons.slice(i, i + CHUNK_SIZE);
      try {
        const res = await fetch("/api/import-wiki", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summons: chunk }),
        });
        const json = await res.json();
        const r = json.results?.summons;
        if (r?.count) totalImported += r.count;
        if (r?.skipped) totalSkipped += r.skipped;
        if (r?.errors) allErrors.push(...r.errors);
      } catch (e) {
        allErrors.push(`chunk ${i}-${i + chunk.length}: ${String(e)}`);
      }
      update("summons", { imported: totalImported });
    }

    const parts: string[] = [];
    if (totalSkipped) parts.push(`重複除外: ${totalSkipped}件`);
    if (allErrors.length) parts.push(`エラー: ${allErrors.length}バッチ\n${allErrors.slice(0, 3).join("\n")}`);
    update("summons", {
      status: allErrors.length ? "error" : "done",
      imported: totalImported,
      error: parts.join(" / ") || undefined,
    });
  }, [update]);

  const importWeapons = useCallback(async () => {
    update("weapons", { status: "fetching", fetched: 0, imported: 0, error: undefined });
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

    let totalImported = 0;
    let totalSkipped = 0;
    const allErrors: string[] = [];

    for (let i = 0; i < weapons.length; i += CHUNK_SIZE) {
      const chunk = weapons.slice(i, i + CHUNK_SIZE);
      try {
        const res = await fetch("/api/import-wiki", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weapons: chunk }),
        });
        const json = await res.json();
        const r = json.results?.weapons;
        if (r?.count) totalImported += r.count;
        if (r?.skipped) totalSkipped += r.skipped;
        if (r?.errors) allErrors.push(...r.errors);
      } catch (e) {
        allErrors.push(`chunk ${i}-${i + chunk.length}: ${String(e)}`);
      }
      update("weapons", { imported: totalImported });
    }

    const parts: string[] = [];
    if (totalSkipped) parts.push(`重複除外: ${totalSkipped}件`);
    if (allErrors.length) parts.push(`エラー: ${allErrors.length}バッチ\n${allErrors.slice(0, 3).join("\n")}`);
    update("weapons", {
      status: allErrors.length ? "error" : "done",
      imported: totalImported,
      error: parts.join(" / ") || undefined,
    });
  }, [update]);

  const run = useCallback(async (target: "all" | "characters" | "summons" | "weapons" = "all") => {
    setRunning(true);
    if (target === "all") setProgress(initial);

    if (target === "all" || target === "characters") {
      try { await importCharacters(); } catch (e) { update("characters", { status: "error", error: String(e) }); }
    }
    if (target === "all" || target === "summons") {
      try { await importSummons(); } catch (e) { update("summons", { status: "error", error: String(e) }); }
    }
    if (target === "all" || target === "weapons") {
      try { await importWeapons(); } catch (e) { update("weapons", { status: "error", error: String(e) }); }
    }

    setRunning(false);
  }, [importCharacters, importSummons, importWeapons, update]);

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

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => run("all")}
          disabled={running}
          className="bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 disabled:opacity-50 px-6 py-2 rounded font-medium transition-colors"
        >
          {running ? "インポート中..." : "すべてインポート"}
        </button>
        <button
          onClick={() => run("characters")}
          disabled={running}
          className="bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 disabled:opacity-50 px-4 py-2 rounded text-sm transition-colors"
        >
          キャラクターのみ
        </button>
        <button
          onClick={() => run("summons")}
          disabled={running}
          className="bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 disabled:opacity-50 px-4 py-2 rounded text-sm transition-colors"
        >
          召喚石のみ
        </button>
        <button
          onClick={() => run("weapons")}
          disabled={running}
          className="bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 disabled:opacity-50 px-4 py-2 rounded text-sm transition-colors"
        >
          武器のみ
        </button>
      </div>

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
              {p.error && <pre className="text-xs text-red-400 mt-1 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{p.error}</pre>}
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
