import { prisma } from "@/lib/prisma";
import { elementBadge, elementGlow, ELEMENT_EMOJI } from "@/lib/element-colors";
import { getTranslationMap } from "@/lib/series-names";
import { getWikiImageUrl, getGameAssetUrl } from "@/lib/image-url";
import { auth } from "@/lib/auth";
import { AddToInventoryButton } from "@/components/AddToInventoryButton";
import { FallbackImage } from "@/components/FallbackImage";
import { SearchBar } from "@/components/SearchBar";

export const metadata = {
  title: "召喚石一覧 | GBF Checker",
};

export default async function SummonsPage({
  searchParams,
}: {
  searchParams: Promise<{
    element?: string;
    category?: string;
    rarity?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const { element, category, rarity, q } = params;
  const page = Math.max(1, Number(params.page ?? "1"));
  const limit = 48;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (element) where.element = element;
  if (category) where.category = category;
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
  }
  if (notConditions.length > 0) where.NOT = notConditions;

  const [summons, total] = await Promise.all([
    prisma.summon.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
    prisma.summon.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const [elements, categories, rarities] = await Promise.all([
    prisma.summon.findMany({ select: { element: true }, distinct: ["element"] }),
    prisma.summon.findMany({ select: { category: true }, distinct: ["category"], where: { category: { not: null } } }),
    prisma.summon.findMany({ select: { rarity: true }, distinct: ["rarity"], where: { rarity: { not: null } } }),
  ]);
  const rarityValues = rarities.map((r) => r.rarity!).sort();

  const [seriesMap, elementMap] = await Promise.all([
    getTranslationMap("series"),
    getTranslationMap("element"),
  ]);

  const session = await auth();
  const ownedIds = new Set<number>();
  if (session?.user?.id) {
    const inv = await prisma.userInventory.findMany({
      where: { userId: session.user.id, itemType: "summon" },
      select: { itemId: true },
    });
    inv.forEach((i) => ownedIds.add(i.itemId));
  }

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { element, category, rarity, q, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const qs = p.toString();
    return `/summons${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gradient">召喚石一覧</h1>
          <span className="text-sm text-gray-500">{total} 件</span>
        </div>
        <SearchBar />
      </div>

      {/* フィルターバー */}
      <div className="glass rounded-xl p-4 space-y-3">
        <FilterRow label="レアリティ">
          <FilterChip href={buildUrl({ rarity: undefined })} active={!rarity}>全て</FilterChip>
          {rarityValues.map((r) => (
            <FilterChip key={r} href={buildUrl({ rarity: r })} active={rarity === r}>{r}</FilterChip>
          ))}
        </FilterRow>

        <FilterRow label="属性">
          <FilterChip href={buildUrl({ element: undefined })} active={!element}>全て</FilterChip>
          {elements.map((e) => (
            <FilterChip key={e.element} href={buildUrl({ element: e.element })} active={element === e.element}>
              {ELEMENT_EMOJI[e.element]} {elementMap[e.element.toLowerCase()] ?? e.element}
            </FilterChip>
          ))}
        </FilterRow>

        {categories.length > 0 && (
          <FilterRow label="カテゴリ">
            <FilterChip href={buildUrl({ category: undefined })} active={!category}>全て</FilterChip>
            {categories.map((c) => (
              <FilterChip key={c.category} href={buildUrl({ category: c.category ?? undefined })} active={category === c.category}>
                {seriesMap[(c.category ?? "").toLowerCase()] ?? c.category}
              </FilterChip>
            ))}
          </FilterRow>
        )}
      </div>

      {/* テーブル */}
      {summons.length === 0 ? (
        <div className="glass rounded-xl text-center py-16">
          <p className="text-gray-500">該当する召喚石が見つかりません。</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-[80px_1fr_80px_100px_1fr_48px] gap-3 px-4 py-2 text-xs font-medium text-gray-500 border-b border-white/5">
            <span />
            <span>名前</span>
            <span>属性</span>
            <span>カテゴリ</span>
            <span>加護</span>
            <span />
          </div>

          {summons.map((s, i) => {
            const wikiUrl = getWikiImageUrl(s.imageUrl);
            const assetUrl = getGameAssetUrl("summon", s.gameId);
            const hasImage = wikiUrl || assetUrl;

            return (
              <div
                key={s.id}
                style={{ "--stagger": i } as React.CSSProperties}
                className={`
                  animate-fade-slide-up
                  grid grid-cols-[80px_1fr_auto] sm:grid-cols-[80px_1fr_80px_100px_1fr_48px]
                  gap-3 items-center px-4 py-2
                  border-b border-white/5 last:border-b-0
                  glass-hover transition-all
                  ${elementGlow(s.element)}
                  ${ownedIds.has(s.id) ? "bg-indigo-500/5" : ""}
                `}
              >
                {/* サムネイル（横長） */}
                {hasImage ? (
                  <FallbackImage
                    src={wikiUrl}
                    fallbackSrc={assetUrl}
                    alt={s.nameJp ?? s.name}
                    className="w-20 h-11 rounded object-contain bg-white/5"
                    placeholderClassName="w-20 h-11 rounded bg-white/5 flex items-center justify-center text-lg"
                    placeholderEmoji={ELEMENT_EMOJI[s.element] ?? "⭐"}
                  />
                ) : (
                  <div className="w-20 h-11 rounded bg-white/5 flex items-center justify-center text-lg">
                    {ELEMENT_EMOJI[s.element] ?? "⭐"}
                  </div>
                )}

                {/* 名前（日本語主軸） */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">{s.nameJp || s.name}</p>
                    {ownedIds.has(s.id) && <span className="text-xs text-indigo-400">✓</span>}
                  </div>
                  {s.nameJp && <p className="text-xs text-gray-500 truncate">{s.name}</p>}
                </div>

                <span className={`text-xs px-1.5 py-0.5 rounded border w-fit ${elementBadge(s.element)}`}>
                  {ELEMENT_EMOJI[s.element]} {elementMap[s.element.toLowerCase()] ?? s.element}
                </span>

                <span className="hidden sm:block text-xs text-gray-500">
                  {s.category ? (seriesMap[s.category.toLowerCase()] ?? s.category) : "—"}
                </span>

                <div className="hidden sm:block min-w-0">
                  {s.mainAura && <p className="text-xs text-gray-400 truncate" title={s.mainAura}>主: {s.mainAura}</p>}
                  {s.subAura && <p className="text-xs text-gray-500 truncate" title={s.subAura}>副: {s.subAura}</p>}
                </div>

                <AddToInventoryButton itemType="summon" itemId={s.id} itemName={s.nameJp ?? s.name} owned={ownedIds.has(s.id)} />
              </div>
            );
          })}
        </div>
      )}

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

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`text-xs px-2 py-1 rounded border transition-colors ${
        active ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </a>
  );
}

function Pagination({ current, total, buildUrl }: { current: number; total: number; buildUrl: (p: number) => string }) {
  const pages = Array.from({ length: Math.min(total, 7) }, (_, i) => {
    if (total <= 7) return i + 1;
    if (current <= 4) return i + 1;
    if (current >= total - 3) return total - 6 + i;
    return current - 3 + i;
  });

  return (
    <div className="flex justify-center gap-2">
      {current > 1 && (
        <a href={buildUrl(current - 1)} className="px-3 py-1 rounded border border-white/10 hover:bg-white/10 text-sm text-gray-400 transition-colors">← 前へ</a>
      )}
      {pages.map((p) => (
        <a key={p} href={buildUrl(p)} className={`px-3 py-1 rounded border text-sm transition-colors ${p === current ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" : "border-white/10 text-gray-400 hover:bg-white/10"}`}>{p}</a>
      ))}
      {current < total && (
        <a href={buildUrl(current + 1)} className="px-3 py-1 rounded border border-white/10 hover:bg-white/10 text-sm text-gray-400 transition-colors">次へ →</a>
      )}
    </div>
  );
}
