"use client";

import { Button } from "@components/ui/button";

export function DatasetActionsCard({ selected, router }: any) {
  if (!selected) return null;

  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6 flex justify-between items-center">
      <div className="text-sm text-[#A3A3A3]">
        Ready to annotate this dataset?
      </div>

      <Button
        variant="outline"
        onClick={() => router.push(`/?dataset=${selected}`)}
        className="border-[#2A2A2A] bg-[#1A1A1A] text-[#D4D4D4] hover:bg-[#222]"
      >
        Annotate this dataset
      </Button>
    </div>
  );
}
