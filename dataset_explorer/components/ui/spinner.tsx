"use client";

import { Loader2 } from "lucide-react";

interface SpinnerProps {
  text?: string;
  size?: number;      // icon size in px
  center?: boolean;   // center absolutely
}

export default function Spinner({ text, size = 28, center = false }: SpinnerProps) {
  const wrapperClass = center
    ? "absolute inset-0 flex flex-col items-center justify-center"
    : "flex flex-col items-center justify-center";

  return (
    <div className={wrapperClass}>
      <Loader2
        className="animate-spin text-gray-300"
        style={{ width: size, height: size }}
      />
      {text && (
        <div className="mt-2 text-sm text-gray-400">
          {text}
        </div>
      )}
    </div>
  );
}

