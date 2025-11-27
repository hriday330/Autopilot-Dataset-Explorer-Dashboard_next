"use client";

import { useEffect, useState } from "react";
import { useNetworkStatus } from "@hooks/useNetworkStatus";
import { cn } from "@components/ui/utils";

export function NetworkIndicator() {
  const online = useNetworkStatus();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (online) {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
    return;
  }, [online]);

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[9999]",
        "px-4 py-1.5 rounded-full text-sm font-medium select-none",
        "backdrop-blur-md shadow-lg border transition-all duration-300",
        "transform-gpu",
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
        online
          ? "bg-neutral-800/60 border-neutral-700 text-neutral-200"
          : "bg-red-600/80 border-red-700 text-white shadow-red-500/40"
      )}
    >
      {online ? "Connected" : "Offline"}
    </div>
  );
}
