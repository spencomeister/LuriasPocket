import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { elementBadge, ELEMENT_EMOJI } from "@/lib/element-colors";
import Link from "next/link";

export const metadata = {
  title: "マイ所持 | GBF Checker",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const inventory = await prisma.userInventory.findMany({
    where: { userId: session.user.id },
    orderBy: [{ itemType: "asc" }, { itemId: "asc" }],
  });

  const charIds = inventory.filter((i) => i.itemType === "character").map((i) => i.itemId);
  const summonIds = inventory.filter((i) => i.itemType === "summon").map((i) => i.itemId);
  const weaponIds = inventory.filter((i) => i.itemType === "weapon").map((i) => i.itemId);

  const [characters, summons, weapons] = await Promise.all([
    charIds.length ? prisma.character.findMany({ where: { id: { in: charIds } } }) : [],
    summonIds.length ? prisma.summon.findMany({ where: { id: { in: summonIds } } }) : [],
    weaponIds.length ? prisma.weapon.findMany({ where: { id: { in: weaponIds } } }) : [],
  ]);

  const charMap = Object.fromEntries(characters.map((c) => [c.id, c]));
  const summonMap = Object.fromEntries(summons.map((s) => [s.id, s]));
  const weaponMap = Object.fromEntries(weapons.map((w) => [w.id, w]));

  const myChars = inventory.filter((i) => i.itemType === "character");
  const mySummons = inventory.filter((i) => i.itemType === "summon");
  const myWeapons = inventory.filter((i) => i.itemType === "weapon");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">マイ所持チェッカー</h1>
        <p className="text-sm text-gray-500">
          {session.user.name ?? session.user.email} さんの所持アイテム
        </p>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="キャラクター" count={myChars.length} href="/characters" />
        <StatCard label="召喚石" count={mySummons.length} href="/summons" />
        <StatCard label="武器" count={myWeapons.length} href="/weapons" />
      </div>

      {inventory.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <p className="text-gray-400 mb-4">所持アイテムがまだ登録されていません。</p>
          <p className="text-sm text-gray-400">
            <Link href="/characters" className="text-indigo-600 underline">キャラクター</Link>・
            <Link href="/summons" className="text-indigo-600 underline">召喚石</Link>・
            <Link href="/weapons" className="text-indigo-600 underline">武器</Link>
            ページで所持を登録できます。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* キャラクター */}
          {myChars.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">⚔️ キャラクター ({myChars.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {myChars.map((inv) => {
                  const c = charMap[inv.itemId];
                  if (!c) return null;
                  return (
                    <InventoryCard
                      key={inv.id}
                      name={c.name}
                      nameJp={c.nameJp}
                      element={c.element}
                      imageUrl={c.imageUrl}
                      quantity={inv.quantity}
                      uncap={inv.uncap}
                      itemType="character"
                      itemId={inv.itemId}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* 召喚石 */}
          {mySummons.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">🌟 召喚石 ({mySummons.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {mySummons.map((inv) => {
                  const s = summonMap[inv.itemId];
                  if (!s) return null;
                  return (
                    <InventoryCard
                      key={inv.id}
                      name={s.name}
                      nameJp={s.nameJp}
                      element={s.element}
                      imageUrl={s.imageUrl}
                      quantity={inv.quantity}
                      uncap={inv.uncap}
                      itemType="summon"
                      itemId={inv.itemId}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* 武器 */}
          {myWeapons.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">🗡️ 武器 ({myWeapons.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {myWeapons.map((inv) => {
                  const w = weaponMap[inv.itemId];
                  if (!w) return null;
                  return (
                    <InventoryCard
                      key={inv.id}
                      name={w.name}
                      nameJp={w.nameJp}
                      element={w.element}
                      imageUrl={w.imageUrl}
                      quantity={inv.quantity}
                      uncap={inv.uncap}
                      itemType="weapon"
                      itemId={inv.itemId}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow"
    >
      <p className="text-3xl font-bold text-indigo-600">{count}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Link>
  );
}

function InventoryCard({
  name,
  nameJp,
  element,
  imageUrl,
  quantity,
  uncap,
}: {
  name: string;
  nameJp: string | null;
  element: string;
  imageUrl: string | null;
  quantity: number;
  uncap: number;
  itemType: string;
  itemId: number;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden relative">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="w-full aspect-square object-cover" loading="lazy" />
      ) : (
        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-2xl">
          {ELEMENT_EMOJI[element] ?? "❓"}
        </div>
      )}
      {/* 数量バッジ */}
      {quantity > 1 && (
        <div className="absolute top-1 right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {quantity}
        </div>
      )}
      {/* 上限解放バッジ */}
      {uncap > 0 && (
        <div className="absolute top-1 left-1 bg-amber-500 text-white text-xs rounded px-1 font-bold">
          ★{uncap}
        </div>
      )}
      <div className="p-1.5">
        <p className="text-xs truncate font-medium" title={name}>{name}</p>
        {nameJp && <p className="text-xs text-gray-400 truncate">{nameJp}</p>}
        <span className={`text-xs px-1 py-0.5 rounded border ${elementBadge(element)}`}>
          {element}
        </span>
      </div>
    </div>
  );
}
