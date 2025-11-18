"use client";

import { useState, useTransition } from "react";
import {
  createDatasetAction,
  deleteImageAction,
  type ImageThumbnail,
} from "./actions";

interface ImageOperationsHandlers {
  onDeleteComplete?: () => void;
  onUploadComplete?: () => void;
}

export function useUpdateImages(handlers: ImageOperationsHandlers = {}) {
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDeleteImage = async (
    imageId: string,
    storagePath: string,
    onOptimisticDelete: () => void
  ) => {
    if (!confirm("Delete this image? This will remove it from the dataset.")) return;
    setDeletingIds(prev => [...prev, imageId]);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteImageAction(imageId, storagePath);
      if (result.error) {
        setMessage(`Delete error: ${result.error}`);
      } else {
        setMessage("Image deleted");
        // Optimistic update: remove from current grid immediately
        onOptimisticDelete();
        handlers.onDeleteComplete?.();
      }
      setDeletingIds(prev => prev.filter(id => id !== imageId));
    });
  };

  const handleCreateDataset = async (name: string, userId: string) => {
    if (!name || !userId) return;
    setMessage(null);
    startTransition(async () => {
      const result = await createDatasetAction(name, userId);
      if (result.error) {
        setMessage(`Error: ${result.error}`);
      } else {
        setMessage("Dataset created");
        handlers.onUploadComplete?.();
      }
    });
  };

  const handleUploadFiles = async (
  files: FileList | null,
  datasetId: string,
  datasetName: string,
  userId: string,
  onOptimisticAdd: (thumbnails: ImageThumbnail[]) => void
) => {
  if (!files || !userId || !datasetId) return;

  setUploading(true);
  setMessage(null);

  try {
    const fd = new FormData();

    // append files (single OR multiple)
    Array.from(files).forEach((f) => fd.append("files", f));

    // required metadata
    fd.append("datasetId", datasetId);
    fd.append("datasetName", datasetName);
    fd.append("userId", userId);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: fd,
    });

    const json = await res.json();

    if (!json.success) {
      setMessage(`Upload error: ${json.error}`);
      return;
    }

    setMessage("Upload complete");

    // identical behavior to before
    if (json.thumbnails?.length > 0) {
      onOptimisticAdd(json.thumbnails);
    }

    handlers.onUploadComplete?.();
  } catch (err: any) {
    console.error(err);
    setMessage("Upload error: " + (err?.message ?? String(err)));
  } finally {
    setUploading(false);
  }
};

  return {
    uploading,
    deletingIds,
    message,
    setMessage,
    handleDeleteImage,
    handleCreateDataset,
    handleUploadFiles,
    isPending,
  };
}
