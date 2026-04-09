/**
 * カテゴリ文字列を正規化する（小文字に統一）。
 * Wiki データのカテゴリは大文字・小文字が混在しているため、
 * 保存時に統一することで重複を防ぐ。
 */
export function normalizeCategory(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.toLowerCase();
}
