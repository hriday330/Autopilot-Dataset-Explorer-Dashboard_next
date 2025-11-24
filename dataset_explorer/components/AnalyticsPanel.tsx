"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { DatasetAnalytics } from "@lib/actions/analytics";

interface AnalyticsPanelProps {
  analytics?: DatasetAnalytics
  loading?: boolean;
}

const COLORS = [
  "#E82127",
  "#4A9EFF",
  "#FFA500",
  "#00FF88",
  "#A855F7",
  "#22C55E",
  "#F97316",
  "#06B6D4",
];

// TODO - split into multiple components
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

  /* ------------------------------------
   * LABEL DISTRIBUTION (dynamic)
   * ------------------------------------ */
  const labelDistribution =
    analytics.labelFrequency?.map((lf, idx) => ({
      name: lf.label,
      value: lf.count ?? 0,
      color: COLORS[idx % COLORS.length],
    })) ?? [];

  /* ------------------------------------
   * HEATMAP (10x10 grid)
   * ------------------------------------ */
  const grid = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => 0),
  );

  analytics.heatmap?.forEach((p) => {
    const xb = p.x_bucket ?? 0;
    const yb = p.y_bucket ?? 0;
    if (xb < 10 && yb < 10 && xb >= 0 && yb >= 0) {
      grid[yb][xb] = p.count ?? 0;
    }
  });

  // TODO - support customizable heatmap bucket size
  const maxBucket = Math.max(
    ...(analytics.heatmap?.map((p) => p.count ?? 0) ?? [0]),
  );

  /* ------------------------------------
   * LABEL COVERAGE PER CLASS
   * ------------------------------------ */
  const perLabelCoverage =
    analytics.labelFrequency?.map((lf) => {
      const missingCount =
        analytics.framesMissingLabel?.filter(
          (f) => f.label === lf.label,
        ).length ?? 0;
      const coveredFrames = totalFrames - missingCount;
      const coveragePct =
        totalFrames > 0
          ? Math.round((coveredFrames / totalFrames) * 100)
          : 0;
      return {
        label: lf.label,
        total: lf.count ?? 0,
        missingFrames: missingCount,
        coveragePct,
      };
    }) ?? [];

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ======= STATS CARDS ======= */}
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

        {/* ======= CHARTS ROW ======= */}
        <div className="grid grid-cols-2 gap-6">
          {/* Label distribution */}
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
            <h3 className="text-lg text-[#E5E5E5] mb-6">Label Distribution</h3>

            {totalBoxes > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={labelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {labelDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#121212",
                        border: "1px solid #1F1F1F",
                        color: "#E5E5E5",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2 mt-4">
                  {labelDistribution.map((item) => (
                    <div key={item.name} className="flex justify-between">
                      <div className="flex gap-2 items-center">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-[#E5E5E5]">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm text-[#A3A3A3]">
                        {item.value} (
                        {totalBoxes > 0
                          ? Math.round((item.value / totalBoxes) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyMsg text="No labels yet" />
            )}
          </div>

          {/* Heatmap */}
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
            <h3 className="text-lg text-[#E5E5E5] mb-6">
              Bounding Box Heatmap
            </h3>

            {analytics.heatmap?.length ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-10 gap-[2px]">
                  {grid.map((row, y) =>
                    row.map((value, x) => {
                      const intensity = maxBucket
                        ? value / maxBucket
                        : 0;

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
                  Hotter cells indicate regions with more bounding boxes.
                </span>
              </div>
            ) : (
              <EmptyMsg text="No bounding boxes to visualize" />
            )}
          </div>
        </div>

        {/* ======= BOX SIZE + COVERAGE ======= */}
        <div className="grid grid-cols-2 gap-6">
          {/* Box size distribution */}
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
            <h3 className="text-lg text-[#E5E5E5] mb-6">
              Box Size Distribution
            </h3>
            {analytics.boxSizeDistribution?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1F1F1F]">
                      <TH>Label</TH>
                      <TH>Avg (W × H)</TH>
                      <TH>Min (W × H)</TH>
                      <TH>Max (W × H)</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.boxSizeDistribution.map((b) => (
                      <tr
                        key={b.label}
                        className="border-b border-[#1F1F1F] hover:bg-[#0E0E0E]"
                      >
                        <TD>{b.label}</TD>
                        <TD>
                          {b.avg_width?.toFixed(1)} ×{" "}
                          {b.avg_height?.toFixed(1)}
                        </TD>
                        <TD>
                          {b.min_width?.toFixed(1)} ×{" "}
                          {b.min_height?.toFixed(1)}
                        </TD>
                        <TD>
                          {b.max_width?.toFixed(1)} ×{" "}
                          {b.max_height?.toFixed(1)}
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyMsg text="No box size stats yet" />
            )}
          </div>

          {/* Per-label coverage */}
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
            <h3 className="text-lg text-[#E5E5E5] mb-6">
              Label Coverage by Frame
            </h3>
            {perLabelCoverage.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1F1F1F]">
                      <TH>Label</TH>
                      <TH>Total Boxes</TH>
                      <TH>Frames Missing</TH>
                      <TH>Coverage</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {perLabelCoverage.map((l) => (
                      <tr
                        key={l.label}
                        className="border-b border-[#1F1F1F] hover:bg-[#0E0E0E]"
                      >
                        <TD>{l.label}</TD>
                        <TD>{l.total}</TD>
                        <TD>{l.missingFrames}</TD>
                        <TD>{l.coveragePct}%</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyMsg text="No label coverage data" />
            )}
          </div>
        </div>

        {/* ======= FRAME SUMMARY (optional simple view) ======= */}
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
          <h3 className="text-lg text-[#E5E5E5] mb-6">Frame Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1F1F1F]">
                  <TH>Frame</TH>
                  <TH>Total Labels</TH>
                  <TH>Status</TH>
                </tr>
              </thead>
              <tbody>
                {analytics.labelsPerFrame?.map((frame, idx) => (
                  <tr
                    key={frame.frame_id}
                    className="border-b border-[#1F1F1F] hover:bg-[#0E0E0E]"
                  >
                    <TD>Frame {idx + 1}</TD>
                    <TD>{frame.total ?? 0}</TD>
                    <TD>
                      {frame.total && frame.total > 0 ? (
                        <span className="text-xs bg-[#E82127]/20 text-[#E82127] px-2 py-1 rounded">
                          Labeled
                        </span>
                      ) : (
                        <span className="text-xs bg-[#1F1F1F] text-[#6A6A6A] px-2 py-1 rounded">
                          Pending
                        </span>
                      )}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------
 * SMALL HELPERS
 * --------------------------------------- */

const StatCard = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-4">
    <div className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">
      {label}
    </div>
    <div className="text-3xl text-[#E5E5E5]">{value}</div>
  </div>
);

const EmptyMsg = ({ text = "No data yet" }) => (
  <div className="h-[260px] flex items-center justify-center text-[#A3A3A3]">
    {text}
  </div>
);

const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-[#A3A3A3]">
    {children}
  </th>
);

const TD = ({ children }: { children: React.ReactNode }) => (
  <td className="py-2 px-3 text-sm text-[#E5E5E5]">{children}</td>
);
