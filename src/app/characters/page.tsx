import { prisma } from "@/lib/prisma";
import { elementBadge, ELEMENT_EMOJI } from "@/lib/element-colors";

export const metadata = {
  title: "キャラクター一覧 | GBF Checker",
};

export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<{ element?: string; weapon?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const element = params.element;
  const weapon = params.weapon;
  const category = params.category;
  const page = Math.max(1, Number(params.page ?? "1"));
  const limit = 48;
  const skip = (page - 1) * limit;

  const where = {
    rarity: "SSR",
    ...(element ? { element } : {}),
    ...(weapon ? { weapon } : {}),
    ...(category ? { category } : {}),
  };

  const [characters, total] = await Promise.all([
    prisma.character.findMany({
      where,
      skip,
      take: limit,
      orderBy: { releaseDate: "desc" },
    }),
    prisma.character.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // フィルタ用ユニーク値
  const [elements, weapons, categories] = await Promise.all([
    prisma.character.findMany({ select: { element: true }, distinct: ["element"] }),
    prisma.character.findMany({ select: { weapon: true }, distinct: ["weapon"] }),
    prisma.character.findMany({
      select: { category: true },
      distinct: ["category"],
      where: { category: { not: null } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">⚔️ キャラクター一覧</h1>

      {/* フィルターバー */}
      <FilterBar
        currentElement={element}
        currentWeapon={weapon}
        currentCategory={category}
        elements={elements.map((e) => e.element)}
        weapons={weapons.map((w) => w.weapon)}
        categories={categories.map((c) => c.category).filter(Boolean) as string[]}
      />

      {/* 結果件数 */}
      <p className="text-sm text-gray-500">
        {total} 件中 {skip + 1}〜{Math.min(skip + limit, total)} 件を表示
      </p>

      {/* カードグリッド */}
      {characters.length === 0 ? (
        <p className="text-gray-400 text-center py-16">該当するキャラクターが見つかりません。</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {characters.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-3xl">
                  {ELEMENT_EMOJI[c.element] ?? "❓"}
                </div>
              )}
              <div className="p-2">
                <p className="font-medium text-xs truncate" title={c.name}>
                  {c.name}
                </p>
                {c.nameJp && (
                  <p className="text-xs text-gray-400 truncate">{c.nameJp}</p>
                )}
                <div className="mt-1 flex gap-1 flex-wrap">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded border ${elementBadge(c.element)}`}
                  >
                    {c.element}
                  </span>
                  {c.category && (
                    <span className="text-xs px-1.5 py-0.5 rounded border bg-gray-50 text-gray-600 border-gray-200">
                      {c.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{c.weapon}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <Pagination
          current={page}
          total={totalPages}
          base="/characters"
          params={{ element, weapon, category }}
        />
      )}
    </div>
  );
}

function FilterBar({
  currentElement,
  currentWeapon,
  currentCategory,
  elements,
  weapons,
  categories,
}: {
  currentElement?: string;
  currentWeapon?: string;
  currentCategory?: string;
  elements: string[];
  weapons: string[];
  categories: string[];
}) {
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = {
      element: currentElement,
      weapon: currentWeapon,
      category: currentCategory,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const q = p.toString();
    return `/characters${q ? `?${q}` : ""}`;
  };

  return (
    <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-200">
      {/* 属性 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500">属性:</span>
        <a
          href={buildUrl({ element: undefined })}
          className={`text-xs px-2 py-1 rounded border ${!currentElement ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
        >
          全て
        </a>
        {elements.map((e) => (
          <a
            key={e}
            href={buildUrl({ element: e })}
            className={`text-xs px-2 py-1 rounded border ${currentElement === e ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
          >
            {ELEMENT_EMOJI[e]} {e}
          </a>
        ))}
      </div>

      {/* 武器種 */}
      {weapons.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">武器:</span>
          <a
            href={buildUrl({ weapon: undefined })}
            className={`text-xs px-2 py-1 rounded border ${!currentWeapon ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
          >
            全て
          </a>
          {weapons.map((w) => (
            <a
              key={w}
              href={buildUrl({ weapon: w })}
              className={`text-xs px-2 py-1 rounded border ${currentWeapon === w ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
            >
              {w}
            </a>
          ))}
        </div>
      )}

      {/* カテゴリ */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">カテゴリ:</span>
          <a
            href={buildUrl({ category: undefined })}
            className={`text-xs px-2 py-1 rounded border ${!currentCategory ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
          >
            全て
          </a>
          {categories.map((cat) => (
            <a
              key={cat}
              href={buildUrl({ category: cat })}
              className={`text-xs px-2 py-1 rounded border ${currentCategory === cat ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
            >
              {cat}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Pagination({
  current,
  total,
  base,
  params,
}: {
  current: number;
  total: number;
  base: string;
  params: Record<string, string | undefined>;
}) {
  const buildUrl = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
    }
    if (p > 1) sp.set("page", String(p));
    const q = sp.toString();
    return `${base}${q ? `?${q}` : ""}`;
  };

  const pages = Array.from({ length: Math.min(total, 7) }, (_, i) => {
    if (total <= 7) return i + 1;
    if (current <= 4) return i + 1;
    if (current >= total - 3) return total - 6 + i;
    return current - 3 + i;
  });

  return (
    <div className="flex justify-center gap-2">
      {current > 1 && (
        <a href={buildUrl(current - 1)} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 text-sm">
          ← 前へ
        </a>
      )}
      {pages.map((p) => (
        <a
          key={p}
          href={buildUrl(p)}
          className={`px-3 py-1 rounded border text-sm ${p === current ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 hover:bg-gray-100"}`}
        >
          {p}
        </a>
      ))}
      {current < total && (
        <a href={buildUrl(current + 1)} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 text-sm">
          次へ →
        </a>
      )}
    </div>
  );
}
