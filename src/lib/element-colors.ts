/** GBF の属性カラーマッピング */
export const ELEMENT_COLORS: Record<string, string> = {
  Fire:  "bg-red-100 text-red-800 border-red-300",
  Water: "bg-blue-100 text-blue-800 border-blue-300",
  Earth: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Wind:  "bg-green-100 text-green-800 border-green-300",
  Light: "bg-amber-50 text-amber-700 border-amber-200",
  Dark:  "bg-purple-100 text-purple-800 border-purple-300",
};

export function elementBadge(element: string) {
  return ELEMENT_COLORS[element] ?? "bg-gray-100 text-gray-800 border-gray-300";
}

/** GBF の属性アイコン絵文字 */
export const ELEMENT_EMOJI: Record<string, string> = {
  Fire:  "🔥",
  Water: "💧",
  Earth: "🌿",
  Wind:  "🌀",
  Light: "✨",
  Dark:  "🌑",
};
