"use client";

import { Skeleton } from "@components/ui/skeleton";

export interface DatasetImagesSkeletonProps {
  text?: string;
  perPage?: number;
};

export function DatasetImagesSkeleton({
  text = "Loading your dataset...",
  perPage = 24,
}: DatasetImagesSkeletonProps) {
  return (
    <div className="mb-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-sm text-[#A3A3A3]">{text}</div>

        <div className="flex gap-2">
          {/* Fake delete button */}
          <Skeleton className="h-9 w-28 bg-[#1F1F1F]" />
          {/* Fake clear button */}
          <Skeleton className="h-9 w-20 bg-[#1F1F1F]" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: perPage }).map((_, i) => (
          <div
            key={i}
            className="relative w-full overflow-hidden rounded-lg border border-[#1F1F1F] bg-[#0E0E0E]"
          >
            {/* Thumbnail rectangle */}
            <Skeleton className="aspect-[4/3] w-full bg-[#1F1F1F]" />

            {/* Footer area */}
            <div className="p-2 flex justify-between items-center">
              <Skeleton className="h-3 w-16 bg-[#1F1F1F]" />
              <Skeleton className="h-3 w-10 bg-[#1F1F1F]" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination area */}
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-44 bg-[#1F1F1F]" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16 border border-[#1F1F1F] bg-[#0E0E0E]" />
          <Skeleton className="h-9 w-16 bg-[#E82127]/60" />
        </div>
      </div>
    </div>
  );
}
