"use client";

import DatasetImageGrid from "@components/DatasetsPage/DatasetImageGrid";
import type { ImageThumbnail } from "@lib/types";
import type { Dispatch, SetStateAction } from "react";
import { DatasetImagesSkeleton } from "@components/DatasetsPage/DatasetImagesSkeleton";

export function DatasetImagesCard({
  thumbnails,
  deletingIds,
  imagesPage,
  setImagesPage,
  imagesTotal,
  imagesPerPage,
  selected,
  imagesLoading,
  handleDeleteImages,
  onPageSizeChange,
}: DatasetImagesCardProps) {
  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
      <h3 className="text-xl text-white mb-4">Images in dataset</h3>

      {imagesLoading ? (
        <DatasetImagesSkeleton
          text="Loading your dataset..."
          perPage={imagesPerPage}
        />
      ) : !selected ? (
        <div className="text-sm text-[#6B6B6B]">
          Select a dataset to view images.
        </div>
      ) : (
        <DatasetImageGrid
          thumbnails={thumbnails}
          deletingIds={deletingIds}
          imagesPage={imagesPage}
          imagesTotal={imagesTotal}
          imagesPerPage={imagesPerPage}
          onDelete={handleDeleteImages}
          onPageSizeChange={onPageSizeChange}
          onPrevPage={() => setImagesPage((p: number) => Math.max(1, p - 1))}
          onNextPage={() => setImagesPage((p: number) => p + 1)}
        />
      )}
    </div>
  );
}

export interface DatasetImagesCardProps {
  thumbnails: ImageThumbnail[];
  deletingIds: string[];
  imagesPage: number;
  setImagesPage: Dispatch<SetStateAction<number>>;
  selected: string;
  imagesLoading: boolean;
  imagesTotal: number;
  imagesPerPage: number;
  handleDeleteImages: (imageId: string[], storagePath: string[]) => void;
  onPageSizeChange: (pageSize: number) => void;
}
