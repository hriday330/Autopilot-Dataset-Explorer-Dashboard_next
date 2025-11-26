"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { EmptyMsg } from "./EmptyMsg";
import { LabelFrequencyItem } from "@lib/actions/analytics";

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

export function LabelDistributionChart({
  labelFrequency,
  totalBoxes,
}: {
  labelFrequency?: LabelFrequencyItem[];
  totalBoxes: number;
}) {
  const data =
    labelFrequency?.map((lf, idx) => ({
      name: lf.label,
      value: lf.count ?? 0,
      color: COLORS[idx % COLORS.length],
    })) ?? [];

  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
      <h3 className="text-lg text-[#E5E5E5] mb-6">Label Distribution</h3>

      {totalBoxes > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry) => (
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
            {data.map((item) => (
              <div key={item.name} className="flex justify-between">
                <div className="flex gap-2 items-center">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-[#E5E5E5]">{item.name}</span>
                </div>
                <span className="text-sm text-[#A3A3A3]">
                  {item.value} ({Math.round((item.value / totalBoxes) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyMsg text="No labels yet" />
      )}
    </div>
  );
}
