import { prisma } from "@/lib/prisma";
import { elementBadge, elementGlow, ELEMENT_EMOJI } from "@/lib/element-colors";
import { getWikiImageUrl, getGameAssetUrl } from "@/lib/image-url";
import { auth } from "@/lib/auth";
import { AddToInventoryButton } from "@/components/AddToInventoryButton";
import { FallbackImage } from "@/components/FallbackImage";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar, Pagination } from "@/components/FilterBar";
import type { FilterRowConfig } from "@/components/FilterBar";
import {
  getCachedTranslationMap,
  getCachedExclusions,
  getCachedWeaponFilters,
} from "@/lib/cached-queries";

export const metadata = {
  title: "武器一覧 | ルリアのぽけっと手帳",
};

export default async function WeaponsPage({
  searchParams,
}: {
  searchParams: Promise<{
    element?: string;
    weaponType?: string;
    category?: string;
    rarity?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const { q } = params;
  const elementArr = params.element?.split(",").filter(Boolean) ?? [];
  const weaponTypeArr = params.weaponType?.split(",").filter(Boolean) ?? [];
  const categoryArr = params.category?.split(",").filter(Boolean) ?? [];
  const rarityArr = params.rarity?.split(",").filter(Boolean) ?? [];
  const page = Math.max(1, Number(params.page ?? "1"));
  const limit = 48;
  const skip = (page - 1) * limit;

  // キャッシュから準静的データを並列取得
  const [exclusions, filters, weaponTypeMap, seriesMap, elementMap, session] =
    await Promise.all([
      getCachedExclusions(),
      getCachedWeaponFilters(),
      getCachedTranslationMap("weaponType"),
      getCachedTranslationMap("series"),
      getCachedTranslationMap("element"),
      auth(),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (elementArr.length > 0) where.element = elementArr.length === 1 ? elementArr[0] : { in: elementArr };
  if (weaponTypeArr.length > 0) where.weaponType = weaponTypeArr.length === 1 ? weaponTypeArr[0] : { in: weaponTypeArr };
  if (categoryArr.length > 0) where.category = categoryArr.length === 1 ? categoryArr[0] : { in: categoryArr };
  if (rarityArr.length > 0) where.rarity = rarityArr.length === 1 ? rarityArr[0] : { in: rarityArr };
  if (q) {
    where.OR = [
      { nameJp: { contains: q } },
      { name: { contains: q } },
    ];
  }

  // システム除外適用
  const notConditions: Record<string, string>[] = [];
  for (const ex of exclusions) {
    if (ex.type === "category") notConditions.push({ category: ex.value });
    if (ex.type === "weaponType") notConditions.push({ weaponType: ex.value });
    if (ex.type === "series") notConditions.push({ category: ex.value });
  }
  if (notConditions.length > 0) where.NOT = notConditions;

  // メインクエリ + 所持状態を並列取得
  const inventoryPromise = session?.user?.id
    ? prisma.userInventory.findMany({
        where: { userId: session.user.id, itemType: "weapon" },
        select: { itemId: true, quantity: true },
      })
    : Promise.resolve([] as { itemId: number; quantity: number }[]);

  const [weapons, total, inventory] = await Promise.all([
    prisma.weapon.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
    prisma.weapon.count({ where }),
    inventoryPromise,
  ]);

  const totalPages = Math.ceil(total / limit);
  const ownedIds = new Set(inventory.map((i) => i.itemId));
  const quantityMap = new Map(inventory.map((i) => [i.itemId, i.quantity]));

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
    ...(filters.weaponTypes.length > 0
      ? [
          {
            key: "weaponType",
            label: "武器種",
            options: filters.weaponTypes.map((w) => ({
              value: w,
              label: weaponTypeMap[w.toLowerCase()] ?? w,
            })),
          },
        ]
      : []),
    ...(filters.categories.length > 0
      ? [
          {
            key: "category",
            label: "カテゴリ",
            options: filters.categories.map((c) => ({
              value: c,
              label: seriesMap[c.toLowerCase()] ?? c,
            })),
          },
        ]
      : []),
  ];

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (params.element) sp.set("element", params.element);
    if (params.weaponType) sp.set("weaponType", params.weaponType);
    if (params.category) sp.set("category", params.category);
    if (params.rarity) sp.set("rarity", params.rarity);
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/weapons${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gradient">武器一覧</h1>
          <span className="text-sm text-gray-500">{total} 件</span>
        </div>
        <SearchBar />
      </div>

      {/* フィルターバー */}
      <FilterBar rows={filterRows} />

      {/* テーブル */}
      {weapons.length === 0 ? (
        <div className="glass rounded-xl text-center py-16">
          <p className="text-gray-500">該当する武器が見つかりません。</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-[80px_1fr_80px_80px_100px_1fr_48px] gap-3 px-4 py-2 text-xs font-medium text-gray-500 border-b border-white/5">
            <span />
            <span>名前</span>
            <span>属性</span>
            <span>武器種</span>
            <span>カテゴリ</span>
            <span>スキル</span>
            <span />
          </div>

          {weapons.map((w, i) => {
            const wikiUrl = getWikiImageUrl(w.imageUrl);
            const assetUrl = getGameAssetUrl("weapon", w.gameId);
            const hasImage = wikiUrl || assetUrl;
            const skills: string[] = (() => {
              try { return JSON.parse(w.skills ?? "[]"); } catch { return []; }
            })();

            return (
              <div
                key={w.id}
                style={{ "--stagger": i } as React.CSSProperties}
                className={`
                  animate-fade-slide-up
                  grid grid-cols-[80px_1fr_auto] sm:grid-cols-[80px_1fr_80px_80px_100px_1fr_48px]
                  gap-3 items-center px-4 py-2
                  border-b border-white/5 last:border-b-0
                  glass-hover transition-all
                  ${elementGlow(w.element)}
                  ${ownedIds.has(w.id) ? "bg-sky-500/5" : ""}
                `}
              >
                {/* サムネイル（横長） */}
                {hasImage ? (
                  <FallbackImage
                    src={wikiUrl}
                    fallbackSrc={assetUrl}
                    alt={w.nameJp ?? w.name}
                    className="w-20 h-11 rounded object-contain bg-white/5"
                    placeholderClassName="w-20 h-11 rounded bg-white/5 flex items-center justify-center text-lg"
                    placeholderEmoji={ELEMENT_EMOJI[w.element] ?? "🗡️"}
                  />
                ) : (
                  <div className="w-20 h-11 rounded bg-white/5 flex items-center justify-center text-lg">
                    {ELEMENT_EMOJI[w.element] ?? "🗡️"}
                  </div>
                )}

                {/* 名前（日本語主軸） */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">{w.nameJp || w.name}</p>
                    {ownedIds.has(w.id) && <span className="text-xs text-sky-400">✓</span>}
                    {(quantityMap.get(w.id) ?? 0) > 1 && (
                      <span className="text-xs text-sky-300 font-bold">×{quantityMap.get(w.id)}</span>
                    )}
                  </div>
                  {w.nameJp && <p className="text-xs text-gray-500 truncate">{w.name}</p>}
                </div>

                <span className={`text-xs px-1.5 py-0.5 rounded border w-fit ${elementBadge(w.element)}`}>
                  {ELEMENT_EMOJI[w.element]} {elementMap[w.element.toLowerCase()] ?? w.element}
                </span>

                <span className="hidden sm:block text-xs text-gray-400">
                  {weaponTypeMap[w.weaponType.toLowerCase()] ?? w.weaponType}
                </span>

                <span className="hidden sm:block text-xs text-gray-500">
                  {w.category ? (seriesMap[w.category.toLowerCase()] ?? w.category) : "—"}
                </span>

                <div className="hidden sm:block min-w-0">
                  {skills.length > 0 ? (
                    <p className="text-xs text-gray-400 truncate" title={skills.join(", ")}>{skills[0]}</p>
                  ) : (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                </div>

                <AddToInventoryButton itemType="weapon" itemId={w.id} itemName={w.nameJp ?? w.name} owned={ownedIds.has(w.id)} currentQuantity={quantityMap.get(w.id) ?? 1} />
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination current={page} total={totalPages} buildUrl={buildPageUrl} />
      )}
    </div>
  );
}

// FilterRow, FilterChip, Pagination は @/components/FilterBar から import
