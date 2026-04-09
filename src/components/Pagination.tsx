export function Pagination({
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
        <a
          href={buildUrl(current - 1)}
          className="px-3 py-1 rounded border border-white/10 hover:bg-white/10 text-sm text-gray-400 transition-colors"
        >
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
        <a
          href={buildUrl(current + 1)}
          className="px-3 py-1 rounded border border-white/10 hover:bg-white/10 text-sm text-gray-400 transition-colors"
        >
          次へ →
        </a>
      )}
    </div>
  );
}
