"use client";

import { useState } from "react";
import { ShareDialog } from "@/components/ShareDialog";

export function ShareButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 text-sm font-medium transition-colors"
      >
        🔗 共有
      </button>
      <ShareDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
