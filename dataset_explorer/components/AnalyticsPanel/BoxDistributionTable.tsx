"use client";

import { BoxSizeDistributionItem } from "@lib/actions/analytics";
import { EmptyMsg } from "./EmptyMsg";
import { TH, TD } from "./TablePrimitives";

export function BoxSizeDistributionTable({
  boxSizeDistribution,
}: {
  boxSizeDistribution?: BoxSizeDistributionItem[];
}) {
  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
      <h3 className="text-lg text-[#E5E5E5] mb-6">Box Size Distribution</h3>

      {boxSizeDistribution?.length ? (
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
              {boxSizeDistribution.map((b) => (
                <tr key={b.label} className="border-b border-[#1F1F1F]">
                  <TD>{b.label}</TD>
                  <TD>
                    {b.avg_width.toFixed(1)} × {b.avg_height.toFixed(1)}
                  </TD>
                  <TD>
                    {b.min_width.toFixed(1)} × {b.min_height.toFixed(1)}
                  </TD>
                  <TD>
                    {b.max_width.toFixed(1)} × {b.max_height.toFixed(1)}
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
  );
}
