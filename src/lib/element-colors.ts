/** GBF の属性カラーマッピング (ダークテーマ用) */
export const ELEMENT_COLORS: Record<string, string> = {
  Fire:  "bg-red-500/15 text-red-300 border-red-500/30",
  Water: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Earth: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  Wind:  "bg-green-500/15 text-green-300 border-green-500/30",
  Light: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Dark:  "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

export function elementBadge(element: string) {
  return ELEMENT_COLORS[element] ?? "bg-white/10 text-gray-300 border-white/20";
}

/** ホバー時のグローシャドウ */
export const ELEMENT_GLOW: Record<string, string> = {
  Fire:  "hover:shadow-[0_0_20px_var(--glow-fire)]",
  Water: "hover:shadow-[0_0_20px_var(--glow-water)]",
  Earth: "hover:shadow-[0_0_20px_var(--glow-earth)]",
  Wind:  "hover:shadow-[0_0_20px_var(--glow-wind)]",
  Light: "hover:shadow-[0_0_20px_var(--glow-light)]",
  Dark:  "hover:shadow-[0_0_20px_var(--glow-dark)]",
};

export function elementGlow(element: string) {
  return ELEMENT_GLOW[element] ?? "";
}

/** GBF の属性アイコン絵文字 */
export const ELEMENT_EMOJI: Record<string, string> = {
  Fire:  "🔥",
  Water: "💧",
  Earth: "🗻",
  Wind:  "🍃",
  Light: "✨",
  Dark:  "🌑",
};
