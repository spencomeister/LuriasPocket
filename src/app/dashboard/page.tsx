import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { elementBadge, ELEMENT_EMOJI } from "@/lib/element-colors";
import { getWikiImageUrl, getGameAssetUrl } from "@/lib/image-url";
import { getTranslationMap } from "@/lib/series-names";
import { FallbackImage } from "@/components/FallbackImage";
import { ShareButton } from "@/components/ShareButton";
import Link from "next/link";

export const metadata = {
  title: "マイ所持 | ルリアのぽけっと手帳",
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

  const invMap = Object.fromEntries(inventory.map((i) => [`${i.itemType}:${i.itemId}`, i]));

  const elementMap = await getTranslationMap("element");

  const myChars = inventory.filter((i) => i.itemType === "character");
  const mySummons = inventory.filter((i) => i.itemType === "summon");
  const myWeapons = inventory.filter((i) => i.itemType === "weapon");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">マイ所持チェッカー</h1>
        <div className="flex items-center gap-3">
          <ShareButton />
          <p className="text-sm text-gray-500">
            {session.user.name} さんの所持アイテム
          </p>
        </div>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="キャラクター" count={myChars.length} href="/characters" />
        <StatCard label="召喚石" count={mySummons.length} href="/summons" />
        <StatCard label="武器" count={myWeapons.length} href="/weapons" />
      </div>

      {inventory.length === 0 ? (
        <div className="glass rounded-xl text-center py-16">
          <p className="text-gray-500 mb-4">所持アイテムがまだ登録されていません。</p>
          <p className="text-sm text-gray-500">
            <Link href="/characters" className="text-sky-400 underline">キャラクター</Link>・
            <Link href="/summons" className="text-sky-400 underline">召喚石</Link>・
            <Link href="/weapons" className="text-sky-400 underline">武器</Link>
            ページで所持を登録できます。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {myChars.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">⚔️ キャラクター ({myChars.length})</h2>
              <div className="glass rounded-xl overflow-hidden">
                {myChars.map((inv, i) => {
                  const c = charMap[inv.itemId];
                  if (!c) return null;
                  return (
                    <InventoryRow key={inv.id} i={i} name={c.name} nameJp={c.nameJp} element={c.element} imageUrl={c.imageUrl} gameId={c.gameId} itemType="character" elementMap={elementMap} />
                  );
                })}
              </div>
            </section>
          )}

          {mySummons.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">🌟 召喚石 ({mySummons.length})</h2>
              <div className="glass rounded-xl overflow-hidden">
                {mySummons.map((inv, i) => {
                  const s = summonMap[inv.itemId];
                  if (!s) return null;
                  return (
                    <InventoryRow key={inv.id} i={i} name={s.name} nameJp={s.nameJp} element={s.element} imageUrl={s.imageUrl} gameId={s.gameId} itemType="summon" elementMap={elementMap} />
                  );
                })}
              </div>
            </section>
          )}

          {myWeapons.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">🗡️ 武器 ({myWeapons.length})</h2>
              <div className="glass rounded-xl overflow-hidden">
                {myWeapons.map((inv, i) => {
                  const w = weaponMap[inv.itemId];
                  if (!w) return null;
                  return (
                    <InventoryRow key={inv.id} i={i} name={w.name} nameJp={w.nameJp} element={w.element} imageUrl={w.imageUrl} gameId={w.gameId} itemType="weapon" quantity={inv.quantity} elementMap={elementMap} />
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
      className="glass glass-hover rounded-xl p-4 text-center border border-white/10 transition-all"
    >
      <p className="text-3xl font-bold text-sky-400">{count}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Link>
  );
}

function InventoryRow({
  i,
  name,
  nameJp,
  element,
  imageUrl,
  gameId,
  itemType,
  quantity,
  elementMap,
}: {
  i: number;
  name: string;
  nameJp: string | null;
  element: string;
  imageUrl: string | null;
  gameId: string | null;
  itemType: "character" | "summon" | "weapon";
  quantity?: number;
  elementMap: Record<string, string>;
}) {
  const imgUrl = getWikiImageUrl(imageUrl);
  const assetUrl = getGameAssetUrl(itemType, gameId);
  const hasImage = imgUrl || assetUrl;
  const isWide = itemType === "summon" || itemType === "weapon";

  return (
    <div
      style={{ "--stagger": i } as React.CSSProperties}
      className="animate-fade-slide-up grid grid-cols-[auto_1fr_80px_80px] gap-3 items-center px-4 py-2 border-b border-white/5 last:border-b-0 glass-hover transition-all"
    >
      {hasImage ? (
        <FallbackImage
          src={imgUrl}
          fallbackSrc={assetUrl}
          alt={nameJp ?? name}
          className={`rounded object-contain ${isWide ? "w-20 h-11 bg-white/5" : "w-10 h-10 object-cover"}`}
          placeholderClassName={`rounded bg-white/5 flex items-center justify-center text-lg ${isWide ? "w-20 h-11" : "w-10 h-10"}`}
          placeholderEmoji={ELEMENT_EMOJI[element] ?? "❓"}
        />
      ) : (
        <div className={`rounded bg-white/5 flex items-center justify-center text-lg ${isWide ? "w-20 h-11" : "w-10 h-10"}`}>
          {ELEMENT_EMOJI[element] ?? "❓"}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-bold truncate">{nameJp || name}</p>
        {nameJp && <p className="text-xs text-gray-500 truncate">{name}</p>}
      </div>
      <span className={`text-xs px-1.5 py-0.5 rounded border w-fit ${elementBadge(element)}`}>
        {ELEMENT_EMOJI[element]} {elementMap[element.toLowerCase()] ?? element}
      </span>
      {quantity && quantity > 1 ? (
        <span className="text-xs text-sky-300 font-bold">×{quantity}</span>
      ) : (
        <span className="text-xs text-gray-600">—</span>
      )}
    </div>
  );
}
