"use client";

import React from "react";
import { Button } from "@components/ui/button";
import DeleteConfirmDialog from "@components/ui/delete-confirm-dialog";

export type ImageThumbnail = {
  id: string;
  url: string;
  storage_path: string;
};

type Props = {
  thumbnails: ImageThumbnail[];
  deletingIds: string[];
  imagesPage: number;
  imagesTotal: number;
  imagesPerPage: number;
  onDelete: (imageId: string, storagePath: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

function DatasetImageGrid({
  thumbnails,
  deletingIds,
  imagesPage,
  imagesTotal,
  imagesPerPage,
  onDelete,
  onPrevPage,
  onNextPage,
}: Props) {
  return (
    <div className="mb-6">
      {!thumbnails || thumbnails.length === 0 ? (
        <div className="text-sm text-[#6B6B6B]">No images in this dataset.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {thumbnails.map((t) => (
              <div
                key={t.id}
                className="relative bg-[#0B0B0B] border border-[#1F1F1F] rounded overflow-hidden"
              >
                <DeleteConfirmDialog
                  onConfirm={() => onDelete(t.id, t.storage_path)}
                >
                  <button
                    disabled={deletingIds.includes(t.id)}
                    className="absolute top-1 right-1 z-10 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    title="Delete image"
                  >
                    {deletingIds.includes(t.id) ? (
                      <span className="text-xs">…</span>
                    ) : (
                      <span className="text-xs">×</span>
                    )}
                  </button>
                </DeleteConfirmDialog>
                {t.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.url}
                    alt={t.storage_path}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center text-xs text-[#6B6B6B]">
                    Preview not available
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[#A3A3A3]">
              Showing page {imagesPage} — {imagesTotal} images
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-[#1F1F1F] text-[#A3A3A3]"
                onClick={onPrevPage}
                disabled={imagesPage === 1}
              >
                Prev
              </Button>
              <Button
                onClick={onNextPage}
                className="bg-[#E82127]"
                disabled={imagesPage * imagesPerPage >= imagesTotal}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const MemoizedDatasetImageGrid = React.memo(DatasetImageGrid);
MemoizedDatasetImageGrid.displayName = "DatasetImageGrid";
export default MemoizedDatasetImageGrid;
