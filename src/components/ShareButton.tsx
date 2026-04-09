"use client";

import { useState } from "react";
import { ShareDialog } from "@/components/ShareDialog";

export function ShareButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 text-sm font-medium transition-colors"
      >
        🔗 共有
      </button>
      <ShareDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
