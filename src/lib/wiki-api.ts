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

const WIKI_API = "https://gbf.wiki/api.php";
const DEFAULT_LIMIT = 500;

// ── 型定義 ────────────────────────────────────────────────────────────────────

export interface WikiCharacter {
  name: string;
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
  nameJp: string | null;
  element: string;
  category: string | null;
  imageUrl: string | null;
  mainAura: string | null;
  subAura: string | null;
}

export interface WikiWeapon {
  name: string;
  nameJp: string | null;
  element: string;
  weaponType: string;
  category: string | null;
  imageUrl: string | null;
  skills: string[];
  obtain: string | null;
}

// ── ヘルパー ───────────────────────────────────────────────────────────────────

/** GBF Wiki の Cargo API を呼び出す汎用ヘルパー */
async function cargoQuery(params: Record<string, string>): Promise<Record<string, string>[]> {
  const url = new URL(WIKI_API);
  url.searchParams.set("action", "cargoquery");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(DEFAULT_LIMIT));
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "gbf-checker/1.0 (https://github.com/spencomeister/gbf-checker)" },
    next: { revalidate: 3600 }, // 1 時間キャッシュ
  });

  if (!res.ok) {
    throw new Error(`GBF Wiki API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as { cargoquery?: { title: Record<string, string> }[] };
  return (json.cargoquery ?? []).map((item) => item.title);
}

/** Wiki のアイテム画像 URL を組み立てる */
function buildImageUrl(fileName: string | undefined): string | null {
  if (!fileName) return null;
  // MediaWiki サムネイル形式: /Special:Redirect/file/<ファイル名>
  const encoded = encodeURIComponent(fileName.replace(/ /g, "_"));
  return `https://gbf.wiki/Special:Redirect/file/${encoded}`;
}

/** パイプ (|) 区切りのリストを配列に変換する */
function splitPipe(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── キャラクター ──────────────────────────────────────────────────────────────

/**
 * GBF Wiki からキャラクター一覧を取得する。
 * @param rarity 絞り込むレアリティ (デフォルト: "SSR")
 */
export async function fetchCharacters(rarity = "SSR"): Promise<WikiCharacter[]> {
  const rows = await cargoQuery({
    tables: "characters",
    fields: [
      "characters.name",
      "characters.name__full=nameJp",
      "characters.rarity",
      "characters.element",
      "characters.weapon",
      "characters.type=category",
      "characters.image",
      "characters.release_date=releaseDate",
      "characters.obtain",
      "characters.skills",
      "characters.support_skills=abilities",
    ].join(","),
    where: `characters.rarity="${rarity}"`,
    order_by: "characters.release_date DESC",
  });

  return rows.map((row) => ({
    name: row["name"] ?? "",
    nameJp: row["nameJp"] || null,
    rarity: row["rarity"] ?? rarity,
    element: row["element"] ?? "",
    weapon: row["weapon"] ?? "",
    category: row["category"] || null,
    imageUrl: buildImageUrl(row["image"]),
    releaseDate: row["releaseDate"] || null,
    obtain: row["obtain"] || null,
    skills: splitPipe(row["skills"]),
    abilities: splitPipe(row["abilities"]),
  }));
}

// ── 召喚石 ────────────────────────────────────────────────────────────────────

/** GBF Wiki から召喚石一覧を取得する。 */
export async function fetchSummons(): Promise<WikiSummon[]> {
  const rows = await cargoQuery({
    tables: "summons",
    fields: [
      "summons.name",
      "summons.name__full=nameJp",
      "summons.element",
      "summons.type=category",
      "summons.image",
      "summons.main_call=mainAura",
      "summons.sub_aura=subAura",
    ].join(","),
    order_by: "summons.name ASC",
  });

  return rows.map((row) => ({
    name: row["name"] ?? "",
    nameJp: row["nameJp"] || null,
    element: row["element"] ?? "",
    category: row["category"] || null,
    imageUrl: buildImageUrl(row["image"]),
    mainAura: row["mainAura"] || null,
    subAura: row["subAura"] || null,
  }));
}

// ── 武器 ──────────────────────────────────────────────────────────────────────

/** GBF Wiki から武器一覧を取得する。 */
export async function fetchWeapons(): Promise<WikiWeapon[]> {
  const rows = await cargoQuery({
    tables: "weapons",
    fields: [
      "weapons.name",
      "weapons.name__full=nameJp",
      "weapons.element",
      "weapons.type=weaponType",
      "weapons.obtain_cat=category",
      "weapons.image",
      "weapons.skills",
      "weapons.obtain",
    ].join(","),
    order_by: "weapons.name ASC",
  });

  return rows.map((row) => ({
    name: row["name"] ?? "",
    nameJp: row["nameJp"] || null,
    element: row["element"] ?? "",
    weaponType: row["weaponType"] ?? "",
    category: row["category"] || null,
    imageUrl: buildImageUrl(row["image"]),
    skills: splitPipe(row["skills"]),
    obtain: row["obtain"] || null,
  }));
}
