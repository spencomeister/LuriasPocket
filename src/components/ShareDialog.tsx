"use client";

import { useState } from "react";

const DURATIONS = [
  { key: "1h", label: "1時間" },
  { key: "24h", label: "24時間" },
  { key: "7d", label: "7日間" },
  { key: "30d", label: "30日間" },
] as const;

export function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [duration, setDuration] = useState("24h");
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: duration }),
      });
      if (res.ok) {
        const data = await res.json();
        setShareUrl(data.url);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent("GBF 所持一覧を共有しました！");
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const handleShareLine = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(`GBF 所持一覧を共有しました！\n${shareUrl}`);
    window.open(`https://line.me/R/msg/text/?${text}`, "_blank");
  };

  const handleShareDiscord = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShareUrl(null);
    setCopied(false);
    setDuration("24h");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={handleClose}>
      <div
        className="glass rounded-xl p-6 border border-white/10 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gradient mb-4">所持一覧を共有</h2>

        {!shareUrl ? (
          <>
            <p className="text-sm text-gray-400 mb-4">有効期限を選択してリンクを発行します。</p>
            <div className="flex gap-2 mb-6 flex-wrap">
              {DURATIONS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDuration(d.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    duration === d.key
                      ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "発行中..." : "共有リンクを発行"}
            </button>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">共有URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none truncate"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors shrink-0"
                >
                  {copied ? "✓" : "📋"}
                </button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <ShareButton onClick={handleShareTwitter} label="Twitter" color="bg-sky-500/20 text-sky-300 border-sky-500/40" />
              <ShareButton onClick={handleShareLine} label="LINE" color="bg-green-500/20 text-green-300 border-green-500/40" />
              <ShareButton onClick={handleShareDiscord} label="Discord" color="bg-violet-500/20 text-violet-300 border-violet-500/40" />
              <ShareButton onClick={handleCopy} label={copied ? "コピー済み" : "テキストコピー"} color="bg-white/5 text-gray-300 border-white/10" />
            </div>
          </>
        )}

        <button
          onClick={handleClose}
          className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-white transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

function ShareButton({
  onClick,
  label,
  color,
}: {
  onClick: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${color} hover:opacity-80`}
    >
      {label}
    </button>
  );
}
