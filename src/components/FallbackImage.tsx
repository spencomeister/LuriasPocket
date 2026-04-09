"use client";

import { useState } from "react";

type FallbackStage = "primary" | "fallback" | "placeholder";

interface FallbackImageProps {
  src: string | null | undefined;
  fallbackSrc: string | null | undefined;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  placeholderEmoji?: string;
}

export function FallbackImage({
  src,
  fallbackSrc,
  alt,
  className = "",
  placeholderClassName = "",
  placeholderEmoji = "❓",
}: FallbackImageProps) {
  const initial: FallbackStage = src ? "primary" : fallbackSrc ? "fallback" : "placeholder";
  const [stage, setStage] = useState<FallbackStage>(initial);

  const handleError = () => {
    if (stage === "primary" && fallbackSrc) {
      setStage("fallback");
    } else {
      setStage("placeholder");
    }
  };

  // Detect images that loaded but are too small (placeholder thumbnails,
  // ORB-blocked responses decoded as 0×0, etc.).
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth < 50 || img.naturalHeight < 50) {
      handleError();
    }
  };

  if (stage === "placeholder") {
    return (
      <div className={placeholderClassName || className}>
        <span>{placeholderEmoji}</span>
      </div>
    );
  }

  const currentSrc = stage === "primary" ? src! : fallbackSrc!;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
