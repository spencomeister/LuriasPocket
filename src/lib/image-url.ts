/**
 * GBF 画像URL生成ユーティリティ
 *
 * 優先順位:
 * 1. Wiki の画像URL（既存の imageUrl フィールド）
 * 2. gameId ベースの公式アセットサーバーURL
 */

const ASSET_BASE =
  "https://game-a.granbluefantasy.jp/assets/img/sp/assets";

const TYPE_PATH: Record<string, string> = {
  character: "npc",
  weapon: "weapon",
  summon: "summon",
};

export function getImageUrl(
  type: "character" | "weapon" | "summon",
  wikiImageUrl: string | null | undefined,
  gameId: string | null | undefined,
): string | null {
  if (wikiImageUrl) return wikiImageUrl;
  if (!gameId) return null;

  const folder = TYPE_PATH[type];
  return `${ASSET_BASE}/${folder}/m/${gameId}.png`;
}

/** Wiki画像URLのみ返す */
export function getWikiImageUrl(
  wikiImageUrl: string | null | undefined,
): string | null {
  return wikiImageUrl ?? null;
}

/** game asset server URLのみ返す */
export function getGameAssetUrl(
  type: "character" | "weapon" | "summon",
  gameId: string | null | undefined,
): string | null {
  if (!gameId) return null;
  const folder = TYPE_PATH[type];
  return `${ASSET_BASE}/${folder}/m/${gameId}.png`;
}
