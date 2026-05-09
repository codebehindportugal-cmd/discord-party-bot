"use client";

import { useState } from "react";

export function BrandLogo({
  className = "h-full w-full",
  alt = "MordFocas"
}: {
  className?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`${className} flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-500 to-red-700 text-lg font-black text-white`}>
        MF
      </span>
    );
  }

  return (
    <img
      src="/images/mordfocas-logo.png"
      alt={alt}
      className={`${className} object-cover`}
      onError={() => setFailed(true)}
    />
  );
}
