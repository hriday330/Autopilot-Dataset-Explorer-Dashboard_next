"use client";

import { useState, useTransition } from "react";
import {
  createDatasetAction,
  deleteImageAction,
  type ImageThumbnail,
} from "@lib/actions/dataset";
import { supabase } from "@lib/supabaseClient";
import { uploadWithProgress } from "@lib/uploadWithProgress";

interface ImageOperationsHandlers {
  onDeleteComplete?: () => void;
  onUploadComplete?: () => void;
}

export function useUpdateImages(handlers: ImageOperationsHandlers = {}) {
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleDeleteImage = async (
    imageId: string,
    storagePath: string,
    onOptimisticDelete: () => void
  ) => {
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

    setUploadProgress(0);
    const json = await uploadWithProgress({
      url: "/api/upload",
      formData: fd,
      onProgress: setUploadProgress, 
    });

    if (!json.success) {
      setMessage(`Upload error: ${json.error}`);
      return;
    }

    setMessage("Upload complete");

    if (!json.isZip) {
      // Refresh signed URLs in parallel
      const newThumbnails = await Promise.all(
        json.thumbnails.map(async (t) => {
          const { data } = await supabase
            .storage
            .from("datasets")
            .createSignedUrl(t.storage_path, 3600);

          return {
            ...t,
            url: data?.signedUrl ?? t.url ?? "",
          };
        })
      );
      onOptimisticAdd(newThumbnails);
    } else {
      handlers.onUploadComplete?.();
    }

   
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
    uploadProgress, 
    setUploadProgress
  };
}
