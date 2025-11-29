"use client";

import { Progress } from "@components/ui/progress";
import { Badge } from "@components/ui/badge";

interface DashboardFooterProps {
  labeledCount: number;
  totalCount: number;
}

export function DashboardFooter({
  labeledCount,
  totalCount,
}: DashboardFooterProps) {
  const progress = (labeledCount / totalCount) * 100;
  const lastUpdated = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <footer className="h-16 bg-[#121212] border-t border-[#1F1F1F] px-6 flex items-center justify-between">
      <div className="flex items-center gap-6 flex-1">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#A3A3A3]">Progress:</span>
          <div className="w-64">
            <Progress value={progress} className="h-2 bg-[#1F1F1F]" />
          </div>
          <span className="text-sm text-[#E5E5E5]">
            {labeledCount} / {totalCount} frames
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A3A3A3]">Last updated:</span>
          <span className="text-xs text-[#E5E5E5]">{lastUpdated}</span>
        </div>

        <Badge className="bg-[#E82127] hover:bg-[#E82127] text-white border-0 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
          Live
        </Badge>
      </div>
    </footer>
  );
}
