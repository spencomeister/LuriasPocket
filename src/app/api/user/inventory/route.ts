import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ItemType = "character" | "summon" | "weapon";

/** GET /api/user/inventory – ログインユーザーの所持アイテム一覧 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const inventory = await prisma.userInventory.findMany({
    where: { userId: session.user.id },
    orderBy: [{ itemType: "asc" }, { itemId: "asc" }],
  });

  // itemType ごとにグループ化して詳細を付与
  const charIds = inventory.filter((i) => i.itemType === "character").map((i) => i.itemId);
  const summonIds = inventory.filter((i) => i.itemType === "summon").map((i) => i.itemId);
  const weaponIds = inventory.filter((i) => i.itemType === "weapon").map((i) => i.itemId);

  const [characters, summons, weapons] = await Promise.all([
    charIds.length
      ? prisma.character.findMany({ where: { id: { in: charIds } } })
      : Promise.resolve([]),
    summonIds.length
      ? prisma.summon.findMany({ where: { id: { in: summonIds } } })
      : Promise.resolve([]),
    weaponIds.length
      ? prisma.weapon.findMany({ where: { id: { in: weaponIds } } })
      : Promise.resolve([]),
  ]);

  const charMap = Object.fromEntries(characters.map((c) => [c.id, c]));
  const summonMap = Object.fromEntries(summons.map((s) => [s.id, s]));
  const weaponMap = Object.fromEntries(weapons.map((w) => [w.id, w]));

  const enriched = inventory.map((item) => {
    let detail = null;
    if (item.itemType === "character") detail = charMap[item.itemId] ?? null;
    else if (item.itemType === "summon") detail = summonMap[item.itemId] ?? null;
    else if (item.itemType === "weapon") detail = weaponMap[item.itemId] ?? null;
    return { ...item, detail };
  });

  return Response.json({ inventory: enriched });
}

/** POST /api/user/inventory – アイテムを所持リストに追加 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const body = await request.json() as {
    itemType?: ItemType;
    itemId?: number;
    quantity?: number;
    uncap?: number;
  };

  const { itemType, itemId, quantity = 1, uncap = 0 } = body;

  if (!itemType || !["character", "summon", "weapon"].includes(itemType)) {
    return Response.json({ error: "itemType が無効です。" }, { status: 400 });
  }
  if (!itemId || typeof itemId !== "number") {
    return Response.json({ error: "itemId が無効です。" }, { status: 400 });
  }

  const record = await prisma.userInventory.upsert({
    where: {
      userId_itemType_itemId: {
        userId: session.user.id,
        itemType,
        itemId,
      },
    },
    create: {
      userId: session.user.id,
      itemType,
      itemId,
      quantity,
      uncap,
    },
    update: { quantity, uncap },
  });

  return Response.json({ inventory: record }, { status: 201 });
}

/** DELETE /api/user/inventory – アイテムを所持リストから削除 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { itemType, itemId } = await request.json() as {
    itemType?: ItemType;
    itemId?: number;
  };

  if (!itemType || !itemId) {
    return Response.json({ error: "itemType と itemId は必須です。" }, { status: 400 });
  }

  await prisma.userInventory.deleteMany({
    where: {
      userId: session.user.id,
      itemType,
      itemId,
    },
  });

  return Response.json({ ok: true });
}
