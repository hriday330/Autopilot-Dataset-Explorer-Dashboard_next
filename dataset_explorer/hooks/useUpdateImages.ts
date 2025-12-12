"use client";

import { useState, useTransition } from "react";
import { deleteImagesAction } from "@lib/actions/dataset";
import { supabase } from "@lib/supabaseClient";
import type { ImageThumbnail, OperationMessage } from "@lib/types";
import { extractImagesFromZip } from "@lib/zipUtils";
import { createProcessEntry } from "@lib/processEntry";

interface ImageOperationsHandlers {
  onDeleteComplete?: () => void;
  onUploadComplete?: () => void;
}

const CONCURRENCY = 8;

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

async function handleUploadFiles(
  files: FileList | null,
  datasetId: string,
  datasetName: string,
  userId: string,
  onOptimisticAdd: (thumbs: ImageThumbnail[]) => void
) {
  if (!files || !files.length) return;

  const file = files[0];
  const isZip = file.name.toLowerCase().endsWith(".zip");

  if (!isZip) {
    // Let your existing single-file code handle this
    return;
  }

  setUploading(true);
  setProcessingZip(true);

  // 1. Unzip
  const entries = await extractImagesFromZip(file);
  const totalFiles = entries.length;

  const uploadedPaths: string[] = [];

  // 2. Create processEntry
  const processEntry = createProcessEntry({
    datasetId,
    datasetName,
    userId,
    totalFiles,
    onFileUploaded: (paths) => {
      uploadedPaths.push(...paths);
    },
    updateProgress: setUploadProgress,
  });

  // 3. Concurrency pool
  const queue = [...entries];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const entry = queue.shift();
      if (entry) await processEntry(entry);
    }
  });

  await Promise.all(workers);

  const dbRes = await fetch("/api/bulk-insert", {
    method: "POST",
    body: JSON.stringify({
      datasetId,
      storagePaths: uploadedPaths,
    }),
  }).then((r) => r.json());

  if (!dbRes.success) {
    setMessage({ type: "error", message: dbRes.error });
    setProcessingZip(false);
    setUploading(false);
    return;
  }

  // 4. Fetch signed URLs
  const { data: signed } = await supabase.storage
    .from("datasets")
    .createSignedUrls(uploadedPaths, 3600);

  const finalThumbs: ImageThumbnail[] = uploadedPaths.map((path, i) => ({
    id: dbRes.insertedIds[i], // returned from bulk insert
    storage_path: path,
    url: signed?.[i]?.signedUrl ?? "",
  }));

  // Add to UI
  onOptimisticAdd(finalThumbs);

  setProcessingZip(false);
  setUploading(false);
  setMessage({ type: "success", message: "Upload complete" });
}

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
