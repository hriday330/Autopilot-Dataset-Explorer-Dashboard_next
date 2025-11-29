"use client";

import { DatasetAnalytics } from "@lib/actions/analytics";
import { StatCard } from "./StatCard";
import { LabelDistributionChart } from "./LabelDistributionChart";
import { Heatmap } from "./Heatmap";
import { BoxSizeDistributionTable } from "./BoxDistributionTable";
import { LabelCoverageTable } from "./LabelCoverageTable";
import { FrameSummaryTable } from "./FrameSummaryTable";

interface AnalyticsPanelProps {
  analytics?: DatasetAnalytics;
  loading?: boolean;
}

export function AnalyticsPanel({ analytics, loading }: AnalyticsPanelProps) {
  if (loading) {
    return (
      <div className="flex-1 p-8 text-center text-[#A3A3A3]">
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex-1 p-8 text-center text-[#A3A3A3]">
        No analytics available
      </div>
    );
  }

  const totalFrames = analytics.totalFrames ?? 0;
  const totalLabeledFrames = analytics.totalLabeledFrames ?? 0;
  const totalBoxes = analytics.totalBoxes ?? 0;

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Frames" value={totalFrames} />
          <StatCard
            label="Labeled Frames"
            value={`${totalLabeledFrames} / ${totalFrames}`}
          />
          <StatCard label="Total Labels" value={totalBoxes} />
          <StatCard
            label="Completion"
            value={
              totalFrames
                ? `${Math.round((totalLabeledFrames / totalFrames) * 100)}%`
                : "0%"
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <LabelDistributionChart
            labelFrequency={analytics.labelFrequency ?? undefined}
            totalBoxes={totalBoxes}
          />

          <Heatmap heatmap={analytics.heatmap ?? undefined} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <BoxSizeDistributionTable
            boxSizeDistribution={analytics.boxSizeDistribution ?? undefined}
          />

          <LabelCoverageTable
            labelFrequency={analytics.labelFrequency ?? undefined}
            framesMissingLabel={analytics.framesMissingLabel ?? undefined}
            totalFrames={totalFrames}
          />
        </div>

        <FrameSummaryTable
          labelsPerFrame={analytics.labelsPerFrame ?? undefined}
        />
      </div>
    </div>
  );
}
