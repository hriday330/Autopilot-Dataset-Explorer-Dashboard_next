"use client";

import type { AnalyticsHeatmapBucket } from "@lib/actions/analytics";
import { EmptyMsg } from "./EmptyMsg";

export function Heatmap({
  heatmap,
}: {
  heatmap?: AnalyticsHeatmapBucket[];
}) {
  if (!heatmap?.length) {
    return (
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
        <h3 className="text-lg text-[#E5E5E5] mb-6">Bounding Box Heatmap</h3>
        <EmptyMsg text="No bounding boxes to visualize" />
      </div>
    );
  }

  const grid = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => 0),
  );

  heatmap.forEach((p) => {
    if (p.x_bucket < 10 && p.y_bucket < 10) {
      grid[p.y_bucket][p.x_bucket] = p.count;
    }
  });

  const maxBucket = Math.max(...heatmap.map((p) => p.count ?? 0));

  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
      <h3 className="text-lg text-[#E5E5E5] mb-6">Bounding Box Heatmap</h3>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-10 gap-[2px]">
          {grid.map((row, y) =>
            row.map((value, x) => {
              const intensity = maxBucket ? value / maxBucket : 0;

              return (
                <div
                  key={`${x}-${y}`}
                  style={{
                    backgroundColor: `rgba(232,33,39,${intensity})`,
                  }}
                  className="w-5 h-5 rounded-sm"
                />
              );
            }),
          )}
        </div>
        <span className="text-xs text-[#6A6A6A]">
          Hotter cells indicate areas with more bounding boxes.
        </span>
      </div>
    </div>
  );
}
