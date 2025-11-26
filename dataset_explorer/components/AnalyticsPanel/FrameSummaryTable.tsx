"use client";

import type { LabelsPerFrameItem } from "@lib/actions/analytics";
import { EmptyMsg } from "./EmptyMsg";
import { TH, TD } from "./TablePrimitives";

export function FrameSummaryTable({
  labelsPerFrame,
}: {
  labelsPerFrame?: LabelsPerFrameItem[];
}) {
  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
      <h3 className="text-lg text-[#E5E5E5] mb-6">Frame Summary</h3>

      {labelsPerFrame?.length ? (
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
              {labelsPerFrame.map((frame, idx) => (
                <tr key={frame.frame_id} className="border-b border-[#1F1F1F]">
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
      ) : (
        <EmptyMsg text="No frames yet" />
      )}
    </div>
  );
}
