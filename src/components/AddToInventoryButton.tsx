"use client";

import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";
import { createPortal } from "react-dom";

type Props = {
  itemType: "character" | "summon" | "weapon";
  itemId: number;
  itemName: string;
  owned: boolean;
  currentQuantity?: number;
};

export function AddToInventoryButton({ itemType, itemId, itemName, owned, currentQuantity = 1 }: Props) {
  const { data: session } = useSession();
  const [isOwned, setIsOwned] = useState(owned);
  const [showDialog, setShowDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(currentQuantity);
  const [error, setError] = useState("");

  const isWeapon = itemType === "weapon";

  if (!session) {
    return <span className="w-6 h-6" />;
  }

  const handleToggle = () => {
    if (isOwned) {
      if (isWeapon) {
        // 武器は長押しで削除、クリックで編集
        setShowDialog(true);
        return;
      }
      // キャラ/召喚石は即削除
      startTransition(async () => {
        setError("");
        const res = await fetch("/api/user/inventory", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType, itemId }),
        });
        if (res.ok) {
          setIsOwned(false);
        } else {
          setError("削除に失敗しました");
        }
      });
    } else {
      if (isWeapon) {
        setQuantity(1);
        setShowDialog(true);
      } else {
        // キャラ/召喚石は即追加
        startTransition(async () => {
          setError("");
          const res = await fetch("/api/user/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemType, itemId, quantity: 1 }),
          });
          if (res.ok) {
            setIsOwned(true);
          } else {
            setError("追加に失敗しました");
          }
        });
      }
    }
  };

  const handleSaveWeapon = () => {
    startTransition(async () => {
      setError("");
      const res = await fetch("/api/user/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId, quantity }),
      });
      if (res.ok) {
        setIsOwned(true);
        setShowDialog(false);
      } else {
        setError("保存に失敗しました");
      }
    });
  };

  const handleRemoveWeapon = () => {
    startTransition(async () => {
      setError("");
      const res = await fetch("/api/user/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId }),
      });
      if (res.ok) {
        setIsOwned(false);
        setShowDialog(false);
      } else {
        setError("削除に失敗しました");
      }
    });
  };

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-all border ${
          isOwned
            ? "bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40"
            : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-300"
        } ${isPending ? "opacity-50" : ""}`}
        title={isOwned ? (isWeapon ? "本数を編集" : "所持リストから削除") : "所持リストに追加"}
      >
        {isOwned ? "✓" : "+"}
      </button>

      {/* 武器 本数設定ダイアログ — Portal で body 直下にレンダリング */}
      {showDialog && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDialog(false);
          }}
        >
          <div className="glass rounded-xl p-6 w-80 space-y-4 border border-white/10 shadow-2xl animate-fade-slide-up">
            <h3 className="text-sm font-bold text-gradient">
              {isOwned ? "武器の本数を編集" : "所持リストに追加"}
            </h3>
            <p className="text-xs text-gray-400 truncate">{itemName}</p>

            <div className="space-y-2">
              <label className="text-xs text-gray-500 block">
                所持本数 (1〜99)
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                className="w-full px-3 py-2 rounded border border-white/10 bg-white/5 text-sm text-gray-200 focus:outline-none focus:border-sky-500/40"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex justify-between">
              {isOwned && (
                <button
                  onClick={handleRemoveWeapon}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs rounded border border-red-500/40 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  削除
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-3 py-1.5 text-xs rounded border border-white/10 text-gray-400 hover:bg-white/10 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveWeapon}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-colors disabled:opacity-50"
                >
                  {isPending ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
