import { prisma } from "@/lib/prisma";
import { elementBadge, elementGlow, ELEMENT_EMOJI } from "@/lib/element-colors";
import { getWikiImageUrl, getGameAssetUrl } from "@/lib/image-url";
import { auth } from "@/lib/auth";
import { AddToInventoryButton } from "@/components/AddToInventoryButton";
import { FallbackImage } from "@/components/FallbackImage";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import type { FilterRowConfig } from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import {
  getCachedTranslationMap,
  getCachedExclusions,
  getCachedCharacterFilters,
} from "@/lib/cached-queries";

export const metadata = {
  title: "キャラクター一覧 | ルリアのぽけっと手帳",
};

export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<{
    element?: string;
    weapon?: string;
    category?: string;
    series?: string;
    rarity?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const { q } = params;
  const elementArr = params.element?.split(",").filter(Boolean) ?? [];
  const weaponArr = params.weapon?.split(",").filter(Boolean) ?? [];
  const categoryArr = params.category?.split(",").filter(Boolean) ?? [];
  const seriesArr = params.series?.split(",").filter(Boolean) ?? [];
  const rarityArr = params.rarity?.split(",").filter(Boolean) ?? [];
  const page = Math.max(1, Number(params.page ?? "1"));
  const limit = 48;
  const skip = (page - 1) * limit;

  // キャッシュから準静的データを並列取得
  const [exclusions, filters, weaponTypeMap, seriesMap, charTypeMap, elementMap, session] =
    await Promise.all([
      getCachedExclusions(),
      getCachedCharacterFilters(),
      getCachedTranslationMap("weaponType"),
      getCachedTranslationMap("characterSeries"),
      getCachedTranslationMap("characterType"),
      getCachedTranslationMap("element"),
      auth(),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (elementArr.length > 0) where.element = elementArr.length === 1 ? elementArr[0] : { in: elementArr };
  if (weaponArr.length > 0) {
    // weapon フィールドはカンマ区切り文字列なので contains で OR 検索
    where.OR = [
      ...(where.OR ?? []),
      ...weaponArr.map((w) => ({ weapon: { contains: w } })),
    ];
  }
  if (categoryArr.length > 0) where.category = categoryArr.length === 1 ? categoryArr[0] : { in: categoryArr };
  if (seriesArr.length > 0) where.series = seriesArr.length === 1 ? seriesArr[0] : { in: seriesArr };
  if (rarityArr.length > 0) where.rarity = rarityArr.length === 1 ? rarityArr[0] : { in: rarityArr };
  if (q) {
    const searchOr = [
      { nameJp: { contains: q } },
      { name: { contains: q } },
    ];
    where.OR = where.OR ? [...where.OR, ...searchOr] : searchOr;
  }

  // システム除外適用
  const notConditions: Record<string, string>[] = [];
  for (const ex of exclusions) {
    if (ex.type === "category") notConditions.push({ category: ex.value });
    if (ex.type === "series") notConditions.push({ series: ex.value });
  }
  if (notConditions.length > 0) where.NOT = notConditions;

  // メインクエリ + 所持状態を並列取得
  const inventoryPromise = session?.user?.id
    ? prisma.userInventory.findMany({
        where: { userId: session.user.id, itemType: "character" },
        select: { itemId: true },
      })
    : Promise.resolve([]);

  const [characters, total, inventory] = await Promise.all([
    prisma.character.findMany({ where, skip, take: limit, orderBy: { releaseDate: "desc" } }),
    prisma.character.count({ where }),
    inventoryPromise,
  ]);

  const totalPages = Math.ceil(total / limit);
  const ownedIds = new Set(inventory.map((i) => i.itemId));

  // フィルター行定義
  const filterRows: FilterRowConfig[] = [
    {
      key: "rarity",
      label: "レアリティ",
      options: filters.rarities.map((r) => ({ value: r, label: r })),
    },
    {
      key: "element",
      label: "属性",
      options: filters.elements.map((e) => ({
        value: e,
        label: `${ELEMENT_EMOJI[e] ?? ""} ${elementMap[e.toLowerCase()] ?? e}`,
      })),
    },
    ...(filters.weapons.length > 0
      ? [
          {
            key: "weapon",
            label: "武器種",
            options: filters.weapons.map((w) => ({
              value: w,
              label: weaponTypeMap[w.toLowerCase()] ?? w,
            })),
          },
        ]
      : []),
    ...(filters.seriesList.length > 0
      ? [
          {
            key: "series",
            label: "シリーズ",
            options: filters.seriesList.map((s) => ({
              value: s,
              label: seriesMap[s.toLowerCase()] ?? s,
            })),
          },
        ]
      : []),
  ];

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (params.element) sp.set("element", params.element);
    if (params.weapon) sp.set("weapon", params.weapon);
    if (params.category) sp.set("category", params.category);
    if (params.series) sp.set("series", params.series);
    if (params.rarity) sp.set("rarity", params.rarity);
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/characters${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gradient">キャラクター一覧</h1>
          <span className="text-sm text-gray-500">{total} 件</span>
        </div>
        <SearchBar />
      </div>

      {/* フィルターバー */}
      <FilterBar rows={filterRows} />

      {/* カードグリッド */}
      {characters.length === 0 ? (
        <div className="glass rounded-xl text-center py-16">
          <p className="text-gray-500">該当するキャラクターが見つかりません。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {characters.map((c, i) => {
            const wikiUrl = getWikiImageUrl(c.imageUrl);
            const assetUrl = getGameAssetUrl("character", c.gameId);
            const hasImage = wikiUrl || assetUrl;
            const weaponTypes = c.weapon
              .split(",")
              .map((w) => w.trim())
              .filter(Boolean);

            return (
              <div
                key={c.id}
                style={{ "--stagger": i } as React.CSSProperties}
                className={`
                  animate-fade-slide-up glass rounded-xl overflow-hidden border border-white/10
                  transition-all ${elementGlow(c.element)}
                  ${ownedIds.has(c.id) ? "ring-1 ring-sky-500/30" : ""}
                `}
              >
                {/* 画像 */}
                <div className="aspect-[3/4] bg-white/5 relative">
                  {hasImage ? (
                    <FallbackImage
                      src={wikiUrl}
                      fallbackSrc={assetUrl}
                      alt={c.nameJp ?? c.name}
                      className="w-full h-full object-cover"
                      placeholderClassName="w-full h-full flex items-center justify-center text-4xl"
                      placeholderEmoji={ELEMENT_EMOJI[c.element] ?? "❓"}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {ELEMENT_EMOJI[c.element] ?? "❓"}
                    </div>
                  )}
                  {ownedIds.has(c.id) && (
                    <div className="absolute top-2 right-2 bg-sky-500/80 text-white text-xs px-1.5 py-0.5 rounded">
                      所持
                    </div>
                  )}
                </div>

                {/* 情報 */}
                <div className="p-3 space-y-2">
                  {/* 名前 */}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">
                      {c.nameJp || c.name}
                    </p>
                    {c.nameJp && (
                      <p className="text-xs text-gray-500 truncate">{c.name}</p>
                    )}
                  </div>

                  {/* バッジ群 */}
                  <div className="flex flex-wrap gap-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${elementBadge(c.element)}`}>
                      {ELEMENT_EMOJI[c.element]} {elementMap[c.element.toLowerCase()] ?? c.element}
                    </span>
                    {weaponTypes.map((wt) => (
                      <span
                        key={wt}
                        className="text-xs px-1.5 py-0.5 rounded border bg-white/5 text-gray-400 border-white/10"
                      >
                        {weaponTypeMap[wt.toLowerCase()] ?? wt}
                      </span>
                    ))}
                  </div>

                  {/* シリーズ・カテゴリ */}
                  <div className="flex flex-wrap gap-1">
                    {c.series && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {seriesMap[c.series.toLowerCase()] ?? c.series}
                      </span>
                    )}
                    {c.category && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/10">
                        {charTypeMap[c.category.toLowerCase()] ?? c.category}
                      </span>
                    )}
                  </div>

                  {/* 操作 */}
                  <AddToInventoryButton
                    itemType="character"
                    itemId={c.id}
                    itemName={c.nameJp ?? c.name}
                    owned={ownedIds.has(c.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <Pagination current={page} total={totalPages} buildUrl={buildPageUrl} />
      )}
    </div>
  );
}

// FilterRow, FilterChip, Pagination は @/components/FilterBar から import
