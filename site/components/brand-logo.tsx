"use client";

import { useState } from "react";

const logoSources = ["/images/mordsfocas-logo.png", "/images/mordfocas-logo.png"];

export function BrandLogo({
  className = "h-full w-full",
  alt = "MordsFocas"
}: {
  className?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  if (failed) {
    return (
      <span className={`${className} flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-500 to-red-700 text-lg font-black text-white`}>
        MF
      </span>
    );
  }

  return (
    <img
      src={logoSources[sourceIndex]}
      alt={alt}
      className={`${className} object-cover`}
      onError={() => {
        if (sourceIndex < logoSources.length - 1) {
          setSourceIndex((current) => current + 1);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
