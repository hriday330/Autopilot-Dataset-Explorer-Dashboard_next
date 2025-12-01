"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import DeleteConfirmDialog from "@components/ui/delete-confirm-dialog";
import { SelectableImageCard } from "./SelectableImageCard";

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
  onDelete: (imageId: string[], storagePath: string[]) => void;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const clearSelection = () => setSelectedIds([]);


  useEffect(() => {
    setSelectedIds([]);
}, [imagesPage]);

  return (
    <div className="mb-6">
      {!thumbnails || thumbnails.length === 0 ? (
        <div className="text-sm text-[#6B6B6B]">No images in this dataset.</div>
      ) : (
        <>
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-sm text-[#A3A3A3]">
                {selectedIds.length} selected
              </div>

              <div className="flex gap-2">
                <DeleteConfirmDialog
                  onConfirm={() => {
                    const ids = selectedIds;
                    const paths = thumbnails
                      .filter((t) => selectedIds.includes(t.id))
                      .map((t) => t.storage_path);

                    onDelete(ids, paths);
                    clearSelection();
                  }}
                >
                  <Button className="bg-[#E82127] hover:bg-red-700">
                    Delete Selected
                  </Button>
                </DeleteConfirmDialog>

                <Button
                  variant="outline"
                  className="border-[#1F1F1F] text-[#A3A3A3] hover:bg-[#1F1F1F]"
                  onClick={clearSelection}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
          `
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {thumbnails.map((t) => (
              <SelectableImageCard
                key={t.id}
                id={t.id}
                url={t.url}
                storagePath={t.storage_path}
                selected={selectedIds.includes(t.id)}
                onSelect={() => toggleSelect(t.id)}
                disabled={deletingIds.includes(t.id)}
              />
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
