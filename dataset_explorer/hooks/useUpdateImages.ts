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
  pageSize?: number;
}

const CONCURRENCY = 24;

export function useUpdateImages(options: ImageOperationsHandlers = {}) {
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
    
    setDeletingIds((prev) => [...prev, ...imageIds]);
    setMessage(null);

    startTransition(async () => {
      
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

        
        onOptimisticDelete();

        options.onDeleteComplete?.();
      }

      
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
    return;
  }

  setUploading(true);
  setProcessingZip(true);

  
  const entries = await extractImagesFromZip(file);
  const totalFiles = entries.length;

  const uploadedPaths: string[] = [];
  const failedUploads: { name: string; blob: Blob; reason?: string }[] = [];

  const processEntry = createProcessEntry({
    datasetId,
    datasetName,
    userId,
    totalFiles,
    onFileUploaded: (paths) => {
      uploadedPaths.push(...paths);
    },
    onFileFailed: (entry) => {
      failedUploads.push(entry);
    },
    updateProgress: setUploadProgress,
  });

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

  const pageSize = options.pageSize ?? 12;
  const firstPagePaths = uploadedPaths.slice(0, pageSize);
  const firstPageIds = dbRes.insertedIds.slice(0, pageSize);

  // sign first page
  const { data: signed } = await supabase.storage
    .from("datasets")
    .createSignedUrls(firstPagePaths, 3600);

  const firstPageThumbs: ImageThumbnail[] = firstPagePaths.map((path, i) => ({
    id: firstPageIds[i],
    storage_path: path,
    url: signed?.[i]?.signedUrl ?? "",
  }));

  onOptimisticAdd(firstPageThumbs);

  options?.onUploadComplete?.();
  setProcessingZip(false);
  setUploading(false);
  setMessage({ type: "success", message: `${uploadedPaths.length} images uploaded` });
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
