/**
 * GBF Wiki API Module
 *
 * GBF Wiki (https://gbf.wiki/) は MediaWiki + Cargo 拡張を使用しており、
 * api.php を通じて英語名・日本語名を含む構造化データを取得できる。
 *
 * Cargo クエリの基本形:
 *   https://gbf.wiki/api.php?action=cargoquery
 *     &tables=<テーブル名>
 *     &fields=<カラム>
 *     &where=<条件>
 *     &limit=<件数>
 *     &format=json
 */

import nodeFetch, { type RequestInit } from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { normalizeCategory } from "@/lib/normalize";

const WIKI_API = "https://gbf.wiki/api.php";
const DEFAULT_LIMIT = 500;

function getProxyAgent(): HttpsProxyAgent<string> | undefined {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  return proxy ? new HttpsProxyAgent(proxy) : undefined;
}

// ── 型定義 ────────────────────────────────────────────────────────────────────

export interface WikiCharacter {
  name: string;
  gameId: string | null;
  nameJp: string | null;
  rarity: string;
  element: string;
  weapon: string;
  category: string | null;
  imageUrl: string | null;
  releaseDate: string | null;
  obtain: string | null;
  skills: string[];
  abilities: string[];
}

export interface WikiSummon {
  name: string;
  gameId: string | null;
  nameJp: string | null;
  element: string;
  category: string | null;
  imageUrl: string | null;
  mainAura: string | null;
  subAura: string | null;
}

export interface WikiWeapon {
  name: string;
  gameId: string | null;
  nameJp: string | null;
  element: string;
  weaponType: string;
  category: string | null;
  imageUrl: string | null;
  skills: string[];
  obtain: string | null;
}

// ── ヘルパー ───────────────────────────────────────────────────────────────────

/** GBF Wiki の Cargo API を呼び出す汎用ヘルパー (1 ページ分) */
async function cargoQuery(params: Record<string, string>): Promise<Record<string, string>[]> {
  const url = new URL(WIKI_API);
  url.searchParams.set("action", "cargoquery");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(DEFAULT_LIMIT));
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const agent = getProxyAgent();
  const options: RequestInit = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    ...(agent ? { agent } : {}),
  };

  const res = await nodeFetch(url.toString(), options);

  if (!res.ok) {
    throw new Error(`GBF Wiki API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as { cargoquery?: { title: Record<string, string> }[] };
  return (json.cargoquery ?? []).map((item) => item.title);
}

/** 全ページを自動的に取得する Cargo クエリ */
async function cargoQueryAll(params: Record<string, string>): Promise<Record<string, string>[]> {
  const all: Record<string, string>[] = [];
  let offset = 0;
  while (true) {
    const batch = await cargoQuery({ ...params, offset: String(offset) });
    all.push(...batch);
    if (batch.length < DEFAULT_LIMIT) break;
    offset += DEFAULT_LIMIT;
  }
  return all;
}

/** Wiki のアイテム画像 URL を組み立てる */
function buildImageUrl(fileName: string | undefined): string | null {
  if (!fileName) return null;
  // MediaWiki サムネイル形式: /Special:Redirect/file/<ファイル名>
  const encoded = encodeURIComponent(fileName.replace(/ /g, "_"));
  return `https://gbf.wiki/Special:Redirect/file/${encoded}`;
}

// ── キャラクター ──────────────────────────────────────────────────────────────

/**
 * GBF Wiki からキャラクター一覧を取得する。
 * @param rarity 絞り込むレアリティ (デフォルト: "SSR")
 */
export async function fetchCharacters(rarity = "SSR"): Promise<WikiCharacter[]> {
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
    where: `characters.rarity="${rarity}"`,
    order_by: "characters.release_date DESC",
  });

  return rows.map((row) => ({
    name: row["name"] ?? "",
    gameId: row["gameId"] || null,
    nameJp: row["nameJp"] || null,
    rarity: row["rarity"] ?? rarity,
    element: row["element"] ?? "",
    weapon: row["weapon"] ?? "",
    category: normalizeCategory(row["category"]),
    imageUrl: buildImageUrl(row["image"]),
    releaseDate: row["releaseDate"] || null,
    obtain: row["obtain"] || null,
    skills: [],
    abilities: [],
  }));
}

// ── 召喚石 ────────────────────────────────────────────────────────────────────

/** GBF Wiki から召喚石一覧を取得する。 */
export async function fetchSummons(): Promise<WikiSummon[]> {
  const rows = await cargoQueryAll({
    tables: "summons",
    fields: [
      "summons.id=gameId",
      "summons.name",
      "summons.jpname=nameJp",
      "summons.element",
      "summons.series=category",
      "summons.img_icon=image",
      "summons.aura1=mainAura",
      "summons.subaura1=subAura",
    ].join(","),
    order_by: "summons.name ASC",
  });

  return rows.map((row) => ({
    name: row["name"] ?? "",
    gameId: row["gameId"] || null,
    nameJp: row["nameJp"] || null,
    element: row["element"] ?? "",
    category: normalizeCategory(row["category"]),
    imageUrl: buildImageUrl(row["image"]),
    mainAura: row["mainAura"] || null,
    subAura: row["subAura"] || null,
  }));
}

// ── 武器 ──────────────────────────────────────────────────────────────────────

/** GBF Wiki から武器一覧を取得する。 */
export async function fetchWeapons(): Promise<WikiWeapon[]> {
  const rows = await cargoQueryAll({
    tables: "weapons",
    fields: [
      "weapons.id=gameId",
      "weapons.name",
      "weapons.jpname=nameJp",
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

  return rows.map((row) => ({
    name: row["name"] ?? "",
    gameId: row["gameId"] || null,
    nameJp: row["nameJp"] || null,
    element: row["element"] ?? "",
    weaponType: normalizeCategory(row["weaponType"]) ?? "",
    category: normalizeCategory(row["category"]),
    imageUrl: buildImageUrl(row["image"]),
    skills: [row["skill1"], row["skill2"]].filter(Boolean) as string[],
    obtain: row["obtain"] || null,
  }));
}
