import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter });

const translations: { category: string; key: string; valueJp: string }[] = [
  // 武器種
  { category: "weaponType", key: "Sabre", valueJp: "剣" },
  { category: "weaponType", key: "Dagger", valueJp: "短剣" },
  { category: "weaponType", key: "Spear", valueJp: "槍" },
  { category: "weaponType", key: "Axe", valueJp: "斧" },
  { category: "weaponType", key: "Staff", valueJp: "杖" },
  { category: "weaponType", key: "Gun", valueJp: "銃" },
  { category: "weaponType", key: "Melee", valueJp: "格闘" },
  { category: "weaponType", key: "Bow", valueJp: "弓" },
  { category: "weaponType", key: "Harp", valueJp: "楽器" },
  { category: "weaponType", key: "Katana", valueJp: "刀" },

  // キャラタイプ
  { category: "characterType", key: "Attack", valueJp: "攻撃" },
  { category: "characterType", key: "Defense", valueJp: "防御" },
  { category: "characterType", key: "Heal", valueJp: "回復" },
  { category: "characterType", key: "Balance", valueJp: "バランス" },
  { category: "characterType", key: "Special", valueJp: "特殊" },

  // 属性
  { category: "element", key: "Fire", valueJp: "火" },
  { category: "element", key: "Water", valueJp: "水" },
  { category: "element", key: "Earth", valueJp: "土" },
  { category: "element", key: "Wind", valueJp: "風" },
  { category: "element", key: "Light", valueJp: "光" },
  { category: "element", key: "Dark", valueJp: "闇" },

  // シリーズ (obtain ベース)
  { category: "series", key: "grand", valueJp: "リミテッド" },
  { category: "series", key: "zodiac", valueJp: "十二神将" },
  { category: "series", key: "swimsuit", valueJp: "水着" },
  { category: "series", key: "valentine", valueJp: "バレンタイン" },
  { category: "series", key: "halloween", valueJp: "ハロウィン" },
  { category: "series", key: "christmas", valueJp: "クリスマス" },
  { category: "series", key: "yukata", valueJp: "浴衣" },
  { category: "series", key: "flash", valueJp: "フラッシュフェス" },
  { category: "series", key: "normal", valueJp: "恒常" },
  { category: "series", key: "event", valueJp: "イベント" },
  { category: "series", key: "main_quest", valueJp: "メインクエスト" },
  { category: "series", key: "style", valueJp: "スタイル" },
  { category: "series", key: "premium", valueJp: "プレミアム" },

  // 武器シリーズ
  { category: "series", key: "omega", valueJp: "マグナ" },
  { category: "series", key: "omega2", valueJp: "マグナII" },
  { category: "series", key: "primal", valueJp: "神石" },
  { category: "series", key: "olden primal", valueJp: "オールド" },
  { category: "series", key: "olden", valueJp: "オールド" },
  { category: "series", key: "regalia", valueJp: "レガリア" },
  { category: "series", key: "ennead", valueJp: "エネアド" },
  { category: "series", key: "epic", valueJp: "エピック" },
  { category: "series", key: "menace", valueJp: "メナス" },
  { category: "series", key: "illustrious", valueJp: "イラストリアス" },
  { category: "series", key: "celestial", valueJp: "天星器" },
  { category: "series", key: "superlative", valueJp: "超越武器" },
  { category: "series", key: "militis", valueJp: "ミーレス" },
  { category: "series", key: "revans", valueJp: "レヴァンス" },
  { category: "series", key: "draconic", valueJp: "ドラゴニック" },
  { category: "series", key: "astral", valueJp: "アストラル" },
  { category: "series", key: "beast", valueJp: "四象" },
  { category: "series", key: "xeno", valueJp: "ゼノ" },
  { category: "series", key: "seraphic", valueJp: "セラフィック" },
  { category: "series", key: "bahamut", valueJp: "バハムート" },
  { category: "series", key: "ultima", valueJp: "アルティマ" },
  { category: "series", key: "ccw", valueJp: "ジョブ専用武器" },
  { category: "series", key: "class", valueJp: "クラス武器" },
  { category: "series", key: "replica", valueJp: "レプリカ" },
  { category: "series", key: "relic", valueJp: "依代" },
  { category: "series", key: "collab", valueJp: "コラボ" },
  { category: "series", key: "upgrader", valueJp: "強化素材" },
  { category: "series", key: "rusted", valueJp: "朽ち果てた武器" },
  { category: "series", key: "vintage", valueJp: "ヴィンテージ" },
  { category: "series", key: "cosmos", valueJp: "コスモス" },
  { category: "series", key: "special", valueJp: "特殊" },
  { category: "series", key: "story", valueJp: "ストーリー" },
  { category: "series", key: "seasonal", valueJp: "季節限定" },
  { category: "series", key: "classic", valueJp: "クラシック" },
  { category: "series", key: "classic2", valueJp: "クラシックII" },
  { category: "series", key: "classic3", valueJp: "クラシックIII" },
  { category: "series", key: "moon100", valueJp: "ムーン100" },

  // レアリティ
  { category: "rarity", key: "SSR", valueJp: "SSR" },
  { category: "rarity", key: "SR", valueJp: "SR" },
  { category: "rarity", key: "R", valueJp: "R" },
  { category: "rarity", key: "N", valueJp: "N" },
];

async function main() {
  console.log("Seeding translations...");
  for (const t of translations) {
    await prisma.translation.upsert({
      where: {
        category_key: { category: t.category, key: t.key },
      },
      create: t,
      update: { valueJp: t.valueJp },
    });
  }
  console.log(`Seeded ${translations.length} translations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
