import { prisma } from "@/lib/prisma";
import { elementBadge, ELEMENT_EMOJI } from "@/lib/element-colors";

export const metadata = {
  title: "召喚石一覧 | GBF Checker",
};

export default async function SummonsPage({
  searchParams,
}: {
  searchParams: Promise<{ element?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const element = params.element;
  const category = params.category;
  const page = Math.max(1, Number(params.page ?? "1"));
  const limit = 48;
  const skip = (page - 1) * limit;

  const where = {
    ...(element ? { element } : {}),
    ...(category ? { category } : {}),
  };

  const [summons, total] = await Promise.all([
    prisma.summon.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
    prisma.summon.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const [elements, categories] = await Promise.all([
    prisma.summon.findMany({ select: { element: true }, distinct: ["element"] }),
    prisma.summon.findMany({
      select: { category: true },
      distinct: ["category"],
      where: { category: { not: null } },
    }),
  ]);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { element, category, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const q = p.toString();
    return `/summons${q ? `?${q}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🌟 召喚石一覧</h1>

      {/* フィルターバー */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">属性:</span>
          <a href={buildUrl({ element: undefined })} className={filterClass(!element)}>全て</a>
          {elements.map((e) => (
            <a key={e.element} href={buildUrl({ element: e.element })} className={filterClass(element === e.element)}>
              {ELEMENT_EMOJI[e.element]} {e.element}
            </a>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500">カテゴリ:</span>
            <a href={buildUrl({ category: undefined })} className={filterClass(!category)}>全て</a>
            {categories.map((c) => (
              <a key={c.category} href={buildUrl({ category: c.category ?? undefined })} className={filterClass(category === c.category)}>
                {c.category}
              </a>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {total} 件中 {skip + 1}〜{Math.min(skip + limit, total)} 件を表示
      </p>

      {summons.length === 0 ? (
        <p className="text-gray-400 text-center py-16">該当する召喚石が見つかりません。</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {summons.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.imageUrl} alt={s.name} className="w-full aspect-square object-cover" loading="lazy" />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-3xl">
                  {ELEMENT_EMOJI[s.element] ?? "⭐"}
                </div>
              )}
              <div className="p-2">
                <p className="font-medium text-xs truncate" title={s.name}>{s.name}</p>
                {s.nameJp && <p className="text-xs text-gray-400 truncate">{s.nameJp}</p>}
                <div className="mt-1 flex gap-1 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${elementBadge(s.element)}`}>
                    {s.element}
                  </span>
                  {s.category && (
                    <span className="text-xs px-1.5 py-0.5 rounded border bg-gray-50 text-gray-600 border-gray-200">
                      {s.category}
                    </span>
                  )}
                </div>
                {s.mainAura && (
                  <p className="text-xs text-gray-400 mt-1 truncate" title={s.mainAura}>
                    主: {s.mainAura}
                  </p>
                )}
                {s.subAura && (
                  <p className="text-xs text-gray-400 truncate" title={s.subAura}>
                    副: {s.subAura}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <SimplePagination current={page} total={totalPages} buildUrl={(p) => {
          const sp = new URLSearchParams();
          if (element) sp.set("element", element);
          if (category) sp.set("category", category);
          if (p > 1) sp.set("page", String(p));
          const q = sp.toString();
          return `/summons${q ? `?${q}` : ""}`;
        }} />
      )}
    </div>
  );
}

function filterClass(active: boolean) {
  return `text-xs px-2 py-1 rounded border ${
    active
      ? "bg-indigo-600 text-white border-indigo-600"
      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
  }`;
}

function SimplePagination({
  current,
  total,
  buildUrl,
}: {
  current: number;
  total: number;
  buildUrl: (p: number) => string;
}) {
  return (
    <div className="flex justify-center gap-2">
      {current > 1 && (
        <a href={buildUrl(current - 1)} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 text-sm">
          ← 前へ
        </a>
      )}
      {Array.from({ length: Math.min(total, 7) }, (_, i) => i + 1).map((p) => (
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
