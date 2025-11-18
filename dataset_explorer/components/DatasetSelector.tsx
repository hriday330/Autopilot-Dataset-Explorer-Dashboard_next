"use client";

import React from "react";

type Dataset = {
  id: string;
  name: string;
};

type Props = {
  datasets: Dataset[];
  counts: Record<string, number>;
  selected: string;
  onSelect: (id: string) => void;
};

export default function DatasetSelector({
  datasets,
  counts,
  selected,
  onSelect,
}: Props) {
  return (
    <div className="mb-6">
      <div className="text-sm text-[#A3A3A3] mb-2">Select an existing dataset</div>

      <div className="space-y-2">
        {datasets.length === 0 && (
          <div className="text-sm text-[#6B6B6B]">No datasets found.</div>
        )}

        {datasets.map((ds) => (
          <label key={ds.id} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="dataset"
              checked={selected === ds.id}
              onChange={() => onSelect(ds.id)}
            />
            <div className="text-sm text-[#E5E5E5]">{ds.name}</div>
            <div className="text-xs text-[#A3A3A3]">
              ({counts[ds.id] ?? 0} files)
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
