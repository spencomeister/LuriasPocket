"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterRowConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

// ── FilterBar ────────────────────────────────────────────────────────────────

export function FilterBar({ rows }: { rows: FilterRowConfig[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (key: string, next: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.length === 0) {
        params.delete(key);
      } else {
        params.set(key, next.join(","));
      }
      params.delete("page"); // reset pagination
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      {rows.map((row) => {
        const raw = searchParams.get(row.key);
        const selected = raw ? raw.split(",").filter(Boolean) : [];

        return (
          <FilterRow key={row.key} label={row.label}>
            <FilterChip
              active={selected.length === 0}
              onClick={() => navigate(row.key, [])}
            >
              クリア
            </FilterChip>
            {row.options.map((opt) => {
              const isActive = selected.includes(opt.value);
              return (
                <FilterChip
                  key={opt.value}
                  active={isActive}
                  onClick={() => {
                    const next = isActive
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value];
                    navigate(row.key, next);
                  }}
                >
                  {opt.label}
                </FilterChip>
              );
            })}
          </FilterRow>
        );
      })}
    </div>
  );
}

// ── Internal Components ──────────────────────────────────────────────────────

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-gray-500 w-16 shrink-0">
        {label}:
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-2 py-1 rounded border transition-colors cursor-pointer ${
        active
          ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
          : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
