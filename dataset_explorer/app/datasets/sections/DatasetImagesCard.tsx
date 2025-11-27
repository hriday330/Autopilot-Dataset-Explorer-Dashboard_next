"use client";

import Spinner from "@components/ui/spinner";
import DatasetImageGrid from "@components/DatasetsPage/DatasetImageGrid";

export function DatasetImagesCard({
  thumbnails,
  deletingIds,
  imagesPage,
  setImagesPage,
  imagesTotal,
  imagesPerPage,
  selected,
  imagesLoading,
  handleDeleteImage,
}: any) {
  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
      <h3 className="text-xl text-white mb-4">Images in dataset</h3>

      {imagesLoading ? (
        <Spinner text="Loading your images" />
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
          onDelete={handleDeleteImage}
          onPrevPage={() => setImagesPage((p: number) => Math.max(1, p - 1))}
          onNextPage={() => setImagesPage((p: number) => p + 1)}
        />
      )}
    </div>
  );
}
