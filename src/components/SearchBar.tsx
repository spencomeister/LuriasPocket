"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  // Keep a ref so the debounced effect always reads the latest params
  // without re-firing when other params (e.g. page) change.
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Sync URL → state (back/forward navigation)
  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Debounced push: only fires when `value` changes (user typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParamsRef.current;
      const currentQ = current.get("q") ?? "";
      const trimmed = value.trim();

      // Skip navigation when the URL already matches
      if (trimmed === currentQ) return;

      const params = new URLSearchParams(current.toString());
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      // ページをリセット
      params.delete("page");
      const q = params.toString();
      router.push(`${pathname}${q ? `?${q}` : ""}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, pathname, router]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="名前で検索..."
      className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-sky-500/50 transition-colors"
    />
  );
}
