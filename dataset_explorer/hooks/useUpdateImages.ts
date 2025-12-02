"use client";

import { useState, useTransition } from "react";
import { deleteImagesAction } from "@lib/actions/dataset";
import { supabase } from "@lib/supabaseClient";
import { uploadWithProgress } from "@lib/uploadWithProgress";
import type { ImageThumbnail, OperationMessage } from "@lib/types";

interface ImageOperationsHandlers {
  onDeleteComplete?: () => void;
  onUploadComplete?: () => void;
}

export function useUpdateImages(handlers: ImageOperationsHandlers = {}) {
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [message, setMessage] = useState<OperationMessage>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingZip, setProcessingZip] = useState(false);

  const handleDeleteImages = async (
    imageIds: string[],
    storagePaths: string[],
    onOptimisticDelete: () => void,
  ) => {
    // Mark all as deleting
    setDeletingIds((prev) => [...prev, ...imageIds]);
    setMessage(null);

    startTransition(async () => {
      // Bulk delete — both arrays must match in length + order!
      const result = await deleteImagesAction(imageIds, storagePaths);

      if (result.error) {
        setMessage({
          message: `Delete error: ${result.error}`,
          type: "error",
        });
      } else {
        setMessage({
          message:
            imageIds.length > 1
              ? `${imageIds.length} images deleted`
              : "Image deleted",
          type: "success",
        });

        // Remove them from UI now
        onOptimisticDelete();

        handlers.onDeleteComplete?.();
      }

      // Remove all deleted IDs from the deleting state
      setDeletingIds((prev) => prev.filter((id) => !imageIds.includes(id)));
    });
  };

  const handleUploadFiles = async (
    files: FileList | null,
    datasetId: string,
    datasetName: string,
    userId: string,
    onOptimisticAdd: (thumbnails: ImageThumbnail[]) => void,
  ) => {
    if (!files || files.length === 0 || !userId || !datasetId) return;

    setUploading(true);
    setMessage(null);

    try {
      const file = files[0]; // only one file is supported currently (either single image or zip) TODO - improve this in future to support up to 15 files upload without zip
      setUploadProgress(0);

      const result = await uploadWithProgress({
        file,
        datasetId,
        datasetName,
        userId,
        onProgress: setUploadProgress,
      });

      if (!result.success) {
        setMessage({ message: `Upload error: ${result.error}`, type: "error" });
        return;
      }
      if (result.isZip) {
        setProcessingZip(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-zip`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify({
              datasetId,
              datasetName,
              userId,
              zipPath: result.zipPath,
            }),
          },
        );

        const fx = await res.json();
        setProcessingZip(false);

        if (!fx.success) {
          setMessage({
            message: "Processing error: " + fx.error,
            type: "error",
          });
          return;
        }

        setMessage({ message: "Upload complete", type: "success" });
        handlers.onUploadComplete?.();
        return;
      }

      const paths = result.thumbnails.map((t) => t.storage_path);

      const { data: signed } = await supabase.storage
        .from("datasets")
        .createSignedUrls(paths, 3600);

      // map back to original thumbnails
      const thumbWithUrl = result.thumbnails.map((t, i) => ({
        ...t,
        url: signed?.[i]?.signedUrl ?? "",
      }));

      onOptimisticAdd(thumbWithUrl);

      setMessage({ message: "Upload complete", type: "success" });
      handlers.onUploadComplete?.();
    } catch (err: any) {
      console.error(err);
      setMessage({
        message: "Upload error: " + (err?.message ?? String(err)),
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    deletingIds,
    message,
    setMessage,
    handleDeleteImages,
    handleUploadFiles,
    isPending,
    uploadProgress,
    setUploadProgress,
    processingZip,
    setProcessingZip,
  };
}
