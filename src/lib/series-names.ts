import { prisma } from "@/lib/prisma";

/** DB の Translation テーブルから翻訳を一括取得する */
export async function getTranslationMap(
  category: string,
): Promise<Record<string, string>> {
  const rows = await prisma.translation.findMany({ where: { category } });
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key.toLowerCase()] = row.valueJp;
  }
  return map;
}

/** 指定カテゴリの翻訳を1件取得。なければ key をそのまま返す。 */
export async function translateKey(
  category: string,
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "";
  const row = await prisma.translation.findUnique({
    where: { category_key: { category, key } },
  });
  if (row) return row.valueJp;
  // lowercase で再検索
  const rowLower = await prisma.translation.findUnique({
    where: { category_key: { category, key: key.toLowerCase() } },
  });
  return rowLower?.valueJp ?? key;
}
