import { prisma } from "@/lib/prisma";
import { elementBadge, elementGlow, ELEMENT_EMOJI } from "@/lib/element-colors";
import { getTranslationMap } from "@/lib/series-names";
import { getWikiImageUrl, getGameAssetUrl } from "@/lib/image-url";
import { auth } from "@/lib/auth";
import { AddToInventoryButton } from "@/components/AddToInventoryButton";
import { FallbackImage } from "@/components/FallbackImage";
import { SearchBar } from "@/components/SearchBar";

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
  const { element, weapon, category, series, rarity, q } = params;
  const page = Math.max(1, Number(params.page ?? "1"));
  const limit = 48;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (element) where.element = element;
  if (weapon) where.weapon = { contains: weapon };
  if (category) where.category = category;
  if (series) where.series = series;
  if (rarity) where.rarity = rarity;
  if (q) {
    where.OR = [
      { nameJp: { contains: q } },
      { name: { contains: q } },
    ];
  }

  // システム除外適用
  const exclusions = await prisma.systemExclusion.findMany();
  const notConditions: Record<string, string>[] = [];
  for (const ex of exclusions) {
    if (ex.type === "category") notConditions.push({ category: ex.value });
    if (ex.type === "series") notConditions.push({ series: ex.value });
  }
  if (notConditions.length > 0) where.NOT = notConditions;

  const [characters, total] = await Promise.all([
    prisma.character.findMany({ where, skip, take: limit, orderBy: { releaseDate: "desc" } }),
    prisma.character.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // フィルタ用ユニーク値
  const [elements, weapons, categories, seriesList] = await Promise.all([
    prisma.character.findMany({ select: { element: true }, distinct: ["element"] }),
    prisma.character.findMany({ select: { weapon: true }, distinct: ["weapon"] }),
    prisma.character.findMany({ select: { category: true }, distinct: ["category"], where: { category: { not: null } } }),
    prisma.character.findMany({ select: { series: true }, distinct: ["series"], where: { series: { not: null } } }),
  ]);

  // 武器種は個別の値をカンマ分割で抽出
  const weaponSet = new Set<string>();
  weapons.forEach((w) =>
    w.weapon
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((wt) => weaponSet.add(wt)),
  );
  const uniqueWeapons = [...weaponSet].sort();

  // レアリティdistinct
  const rarities = await prisma.character.findMany({ select: { rarity: true }, distinct: ["rarity"] });
  const rarityValues = rarities.map((r) => r.rarity).filter(Boolean).sort();

  // 翻訳マップ
  const [weaponTypeMap, seriesMap, charTypeMap, elementMap] = await Promise.all([
    getTranslationMap("weaponType"),
    getTranslationMap("series"),
    getTranslationMap("characterType"),
    getTranslationMap("element"),
  ]);

  // 所持状態
  const session = await auth();
  const ownedIds = new Set<number>();
  if (session?.user?.id) {
    const inv = await prisma.userInventory.findMany({
      where: { userId: session.user.id, itemType: "character" },
      select: { itemId: true },
    });
    inv.forEach((i) => ownedIds.add(i.itemId));
  }

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { element, weapon, category, series, rarity, q, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
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
      <div className="glass rounded-xl p-4 space-y-3">
        {/* レアリティ */}
        <FilterRow label="レアリティ">
          <FilterChip href={buildUrl({ rarity: undefined })} active={!rarity}>全て</FilterChip>
          {rarityValues.map((r) => (
            <FilterChip key={r} href={buildUrl({ rarity: r })} active={rarity === r}>{r}</FilterChip>
          ))}
        </FilterRow>

        {/* 属性 */}
        <FilterRow label="属性">
          <FilterChip href={buildUrl({ element: undefined })} active={!element}>全て</FilterChip>
          {elements.map((e) => (
            <FilterChip key={e.element} href={buildUrl({ element: e.element })} active={element === e.element}>
              {ELEMENT_EMOJI[e.element]} {elementMap[e.element.toLowerCase()] ?? e.element}
            </FilterChip>
          ))}
        </FilterRow>

        {/* 武器種 */}
        {uniqueWeapons.length > 0 && (
          <FilterRow label="武器種">
            <FilterChip href={buildUrl({ weapon: undefined })} active={!weapon}>全て</FilterChip>
            {uniqueWeapons.map((w) => (
              <FilterChip key={w} href={buildUrl({ weapon: w })} active={weapon === w}>
                {weaponTypeMap[w.toLowerCase()] ?? w}
              </FilterChip>
            ))}
          </FilterRow>
        )}

        {/* シリーズ */}
        {seriesList.length > 0 && (
          <FilterRow label="シリーズ">
            <FilterChip href={buildUrl({ series: undefined })} active={!series}>全て</FilterChip>
            {seriesList.map((s) => (
              <FilterChip key={s.series} href={buildUrl({ series: s.series ?? undefined })} active={series === s.series}>
                {seriesMap[(s.series ?? "").toLowerCase()] ?? s.series}
              </FilterChip>
            ))}
          </FilterRow>
        )}
      </div>

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
        <Pagination current={page} total={totalPages} buildUrl={(p) => buildUrl({ page: p > 1 ? String(p) : undefined })} />
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-gray-500 w-16 shrink-0">{label}:</span>
      {children}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`text-xs px-2 py-1 rounded border transition-colors ${
        active
          ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
          : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </a>
  );
}

function Pagination({
  current,
  total,
  buildUrl,
}: {
  current: number;
  total: number;
  buildUrl: (p: number) => string;
}) {
  const pages = Array.from({ length: Math.min(total, 7) }, (_, i) => {
    if (total <= 7) return i + 1;
    if (current <= 4) return i + 1;
    if (current >= total - 3) return total - 6 + i;
    return current - 3 + i;
  });

  return (
    <div className="flex justify-center gap-2">
      {current > 1 && (
        <a href={buildUrl(current - 1)} className="px-3 py-1 rounded border border-white/10 hover:bg-white/10 text-sm text-gray-400 transition-colors">
          ← 前へ
        </a>
      )}
      {pages.map((p) => (
        <a
          key={p}
          href={buildUrl(p)}
          className={`px-3 py-1 rounded border text-sm transition-colors ${
            p === current
              ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
              : "border-white/10 text-gray-400 hover:bg-white/10"
          }`}
        >
          {p}
        </a>
      ))}
      {current < total && (
        <a href={buildUrl(current + 1)} className="px-3 py-1 rounded border border-white/10 hover:bg-white/10 text-sm text-gray-400 transition-colors">
          次へ →
        </a>
      )}
    </div>
  );
}
