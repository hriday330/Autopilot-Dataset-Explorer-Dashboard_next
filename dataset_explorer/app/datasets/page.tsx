"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@components/AuthProvider";
import { Button } from "@components/ui/button";
import DatasetImageGrid from "@components/DatasetImageGrid";
import { useDatasets } from "@hooks/useDatasets";
import { useLoadImages } from "@hooks/useLoadImages";
import { useUpdateImages } from "@hooks/useUpdateImages";
import Spinner from "@components/ui/spinner";
import FileUploader from "@components/ui/file-uploader";
import { Alert, AlertDescription } from "@components/ui/alert";
import DatasetSelector from "@components/DatasetSelector";
import { Progress } from "@components/ui/progress";
import DatasetCreation from "@components/DatasetCreation";
import { toast } from "sonner";
import { X } from "lucide-react";

// TODO - refactor this entire page into smaller components
export default function DatasetsPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  const [newName, setNewName] = React.useState("");
  const [imagesPage, setImagesPage] = React.useState(1);
  const [imagesPerPage] = React.useState(12);
  const [initialLoading, setInitialLoading] = React.useState(true);

  const {
    datasets,
    counts,
    selected,
    setSelected,
    loadDatasets,
    createDataset,
    message: datasetMessage,
    setMessage: setDatasetMessage,
  } = useDatasets();

  const {
    thumbnails,
    setThumbnails,
    imagesTotal,
    setImagesTotal,
    loadImagesForDataset,
    setMessage: setLoadImagesMessage,
    message: imageMessage,
    isPending: imagesLoading,
    cache,
  } = useLoadImages();

  const {
    uploading,
    deletingIds,
    handleDeleteImage: deleteImageHandler,
    processingZip,
    handleUploadFiles,
    message: opMessage,
    setMessage: setUpdateImageMessage,
    uploadProgress,
  } = useUpdateImages({
    onDeleteComplete: () => {
      loadDatasets(user?.id || "", selected);
    },
    onUploadComplete: () => {
      cache.invalidate(selected);
      loadDatasets(user?.id || "", selected);
      loadImagesForDataset(selected, 1, imagesPerPage);
    },
  });

  const message = datasetMessage || imageMessage || opMessage;

  let dismissMessage: (() => void) | null = null;

  if (datasetMessage) dismissMessage = () => setDatasetMessage(null);
  else if (imageMessage) dismissMessage = () => setLoadImagesMessage(null);
  else if (opMessage) dismissMessage = () => setUpdateImageMessage(null);

  useEffect(() => {
    if (message?.type === "success") {
      toast.success(message.message);
    }
  }, [message, toast]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  // initial load of datasets
  useEffect(() => {
    if (!user) return;
    if (initialLoading) {
      loadDatasets(user.id, selected, setSelected)?.finally(() =>
        setInitialLoading(false),
      );
    } else {
      loadDatasets(user.id, selected, setSelected);
    }
  }, [user]);

  useEffect(() => {
    if (!selected) {
      setThumbnails([]);
      setImagesTotal(0);
      return;
    }
    loadImagesForDataset(selected, imagesPage, imagesPerPage);
  }, [selected, imagesPage, imagesPerPage]);

  const handleDeleteImage = (imageId: string, storagePath: string) => {
    deleteImageHandler(imageId, storagePath, () => {
      setThumbnails((prev) => prev.filter((t) => t.id !== imageId));
      setImagesTotal((prev) => Math.max(0, prev - 1));
      cache.invalidate(selected);
    });
  };

  const handleCreateDataset = () => {
    if (!newName || !user) return;
    createDataset(newName, user.id);
    setNewName("");
  };

  return (
    <div className="min-h-screen p-8 bg-[#0E0E0E]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* CARD 1 — DATASET CONTROLS */}
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
          <h2 className="text-2xl text-white mb-4">Your datasets</h2>

          {message && message.type !== "success" && (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
              className={`
                    relative mb-4
                    ${
                      message.type === "error"
                        ? "border-red-600/50 bg-red-950/40 text-red-300"
                        : "border-blue-600/50 bg-blue-950/40 text-blue-300"
                    }
                  `}
            >
              <Button
                onClick={() => dismissMessage?.()}
                variant="ghost"
                size="icon"
                className="
                      absolute right-2 top-2
                      h-6 w-6 p-0
                      text-[#9CA3AF] hover:text-white
                      bg-transparent hover:bg-transparent
                    "
              >
                <X size={14} />
              </Button>
              <AlertDescription className="pr-10">
                {message.message}
              </AlertDescription>
            </Alert>
          )}

          <DatasetSelector
            datasets={datasets}
            counts={counts}
            selected={selected}
            onSelect={setSelected}
          />

          <DatasetCreation
            newName={newName}
            setNewName={setNewName}
            onCreate={handleCreateDataset}
          />

          <FileUploader
            onSelect={async (files) => {
              const ds = datasets.find((d) => d.id === selected);
              if (!ds || !user) return;

              await handleUploadFiles(
                files,
                selected,
                ds.name,
                user.id,
                (newThumbnails) => {
                  setThumbnails((prev) => [...newThumbnails, ...prev]);
                  setImagesTotal((prev) => prev + newThumbnails.length);
                  cache.invalidate(selected);
                },
              );
            }}
            accept="image/*,.zip"
            maxFiles={1}
            allowZip={true}
            uploading={uploading}
            label="Upload Image or ZIP"
            description="Upload one image or a ZIP containing multiple images."
          />

          {uploading && (
            <Progress className="my-2" value={uploadProgress * 100} />
          )}

          {processingZip && (
            <div className="flex items-center gap-2 text-sm text-[#A3A3A3] my-4">
              <Spinner />
              <span>Processing ZIP file, this may take a moment...</span>
            </div>
          )}
        </div>

        {/* CARD 2 — IMAGES GRID */}
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
              onPrevPage={() => setImagesPage((p) => Math.max(1, p - 1))}
              onNextPage={() => setImagesPage((p) => p + 1)}
            />
          )}
        </div>

        {/* CARD 3 — ACTIONS */}
        {selected && (
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
        )}
      </div>
    </div>
  );
}
