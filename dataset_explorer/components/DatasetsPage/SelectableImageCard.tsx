"use client";

import React from "react";

interface Props {
  id: string;
  url: string | null;
  storagePath: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function SelectableImageCard({
  id,
  url,
  storagePath,
  selected,
  onSelect,
  disabled = false,
}: Props) {
  return (
    <div
      onClick={!disabled ? onSelect : undefined}
      className={`
        relative rounded-md overflow-hidden cursor-pointer border transition-all
        bg-[#0B0B0B]
        ${
          selected
            ? "border-[#E82127] ring-2 ring-[#E82127] shadow-lg"
            : "border-[#1F1F1F]"
        }
        ${
          disabled
            ? "opacity-50 pointer-events-none"
            : "hover:ring-1 hover:ring-[#E82127]/40"
        }
      `}
    >
      {selected && (
        <div className="absolute inset-0 bg-[#E82127]/20 z-10 pointer-events-none" />
      )}
      {selected && (
        <div
          className="
            absolute top-2 right-2 z-20 bg-[#E82127] text-white
            rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold
            shadow-[0_0_8px_rgba(232,33,39,0.7)]
          "
        >
          ✓
        </div>
      )}
      {url ? (
        <img
          src={url}
          alt={storagePath}
          className={`
            w-full h-32 object-cover select-none transition-all duration-200
            ${selected ? "opacity-70 blur-[1.5px]" : "opacity-100 blur-0"}
          `}
          draggable={false}
        />
      ) : (
        <div className="w-full h-32 flex items-center justify-center text-xs text-[#6B6B6B] bg-[#0B0B0B]">
          Preview not available
        </div>
      )}
    </div>
  );
}
