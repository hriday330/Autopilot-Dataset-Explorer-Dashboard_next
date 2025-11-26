"use client";

import { EmptyMsg } from "./EmptyMsg";
import { TH, TD } from "./TablePrimitives";

export function LabelCoverageTable({
  labelFrequency,
  framesMissingLabel,
  totalFrames,
}: {
  labelFrequency?: { label: string; count: number }[];
  framesMissingLabel?: { label: string; frame_id: string }[];
  totalFrames: number;
}) {
  if (!labelFrequency?.length) {
    return (
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
        <h3 className="text-lg text-[#E5E5E5] mb-6">
          Label Coverage by Frame
        </h3>
        <EmptyMsg text="No label coverage data" />
      </div>
    );
  }

  const coverage = labelFrequency.map((lf) => {
    const missing = framesMissingLabel?.filter((f) => f.label === lf.label)
      .length ?? 0;
    const pct = totalFrames ? Math.round(((totalFrames - missing) / totalFrames) * 100) : 0;

    return {
      label: lf.label,
      total: lf.count ?? 0,
      missing,
      pct,
    };
  });

  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
      <h3 className="text-lg text-[#E5E5E5] mb-6">Label Coverage by Frame</h3>

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
            {coverage.map((l) => (
              <tr key={l.label} className="border-b border-[#1F1F1F]">
                <TD>{l.label}</TD>
                <TD>{l.total}</TD>
                <TD>{l.missing}</TD>
                <TD>{l.pct}%</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
