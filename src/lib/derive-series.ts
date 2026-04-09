/**
 * obtain フィールドからキャラクターのシリーズを推測する。
 * obtain 例: "premium,grand,flash" → "grand"
 *            "premium,zodiac" → "zodiac"
 *            "premium,swimsuit" → "swimsuit"
 *            "event" → "event"
 */

const SERIES_KEYWORDS = [
  "grand",
  "zodiac",
  "swimsuit",
  "valentine",
  "halloween",
  "christmas",
  "yukata",
  "style",
  "event",
  "main_quest",
] as const;

export function deriveSeriesFromObtain(
  obtain: string | null | undefined,
): string | null {
  if (!obtain) return null;
  const tags = obtain
    .toLowerCase()
    .split(",")
    .map((t) => t.trim());

  for (const keyword of SERIES_KEYWORDS) {
    if (tags.includes(keyword)) return keyword;
  }

  // premium のみの場合 → "normal" (恒常)
  if (tags.includes("premium") && tags.length <= 2) return "normal";

  return null;
}
