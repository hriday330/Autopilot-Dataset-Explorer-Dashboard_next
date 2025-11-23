"use client";

import { useState, useTransition } from "react";
import { deleteImageAction } from "@lib/actions/dataset";
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

  const handleDeleteImage = async (
    imageId: string,
    storagePath: string,
    onOptimisticDelete: () => void,
  ) => {
    setDeletingIds((prev) => [...prev, imageId]);
    setMessage(null);

    startTransition(async () => {
      const result = await deleteImageAction(imageId, storagePath);

      if (result.error) {
        setMessage({
          message: `Delete error: ${result.error}`,
          type: "error",
        });
      } else {
        setMessage({
          message: "Image deleted",
          type: "success",
        });
        onOptimisticDelete();
        handlers.onDeleteComplete?.();
      }

      setDeletingIds((prev) => prev.filter((id) => id !== imageId));
    });
  };

  const handleUploadFiles = async (
    files: FileList | null,
    datasetId: string,
    datasetName: string,
    userId: string,
    onOptimisticAdd: (thumbnails: ImageThumbnail[]) => void,
  ) => {
    if (!files || !userId || !datasetId) return;

    setUploading(true);
    setMessage(null);

    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));

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
        setMessage({
          message: `Upload error: ${json.error}`,
          type: "error",
        });
        return;
      }

      setMessage({
        message: "Upload complete",
        type: "success",
      });

      if (json.isZip) {
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
              zipPath: json.zipPath,
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

        handlers.onUploadComplete?.();
        return;
      }

      if (!json.isZip) {
        const newThumbnails = await Promise.all(
          json.thumbnails.map(async (t) => {
            const { data } = await supabase.storage
              .from("datasets")
              .createSignedUrl(t.storage_path, 3600);

            return {
              ...t,
              url: data?.signedUrl ?? t.url ?? "",
            };
          }),
        );

        onOptimisticAdd(newThumbnails);
      } else {
        handlers.onUploadComplete?.();
      }
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
    handleDeleteImage,
    handleUploadFiles,
    isPending,
    uploadProgress,
    setUploadProgress,
    processingZip,
    setProcessingZip,
  };
}
