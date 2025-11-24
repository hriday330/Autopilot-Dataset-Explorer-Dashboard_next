"use client";

import { useNetworkStatus } from "@hooks/useNetworkStatus";
import { cn } from "@components/ui/utils";

export function NetworkIndicator() {
  const online = useNetworkStatus();

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[9999]",
        "px-4 py-1.5 rounded-full text-xs font-medium",
        "backdrop-blur-sm border shadow-md transition-all duration-300",
        online
          ? "bg-emerald-600/90 border-emerald-700 text-white"
          : "bg-red-600/90 border-red-700 text-white"
      )}
    >
      {online ? "Online" : "Offline"}
    </div>
  );
}
