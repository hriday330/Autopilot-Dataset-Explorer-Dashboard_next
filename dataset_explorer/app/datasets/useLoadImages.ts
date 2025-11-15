"use client";

import { useState, useTransition } from "react";
import { fetchImagesForDatasetAction, type ImageThumbnail } from "./actions";
import { useDatasetImageCache } from "./useDatasetImageCache";

export function useLoadImages() {
  const [thumbnails, setThumbnails] = useState<ImageThumbnail[]>([]);
  const [imagesTotal, setImagesTotal] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const cache = useDatasetImageCache();

  const loadImagesForDataset = (datasetId: string, page: number, perPage: number) => {
    setMessage(null);

    // Show cached first page immediately when switching datasets
    const cached = cache.getCachedThumbnails(datasetId);
    if (page === 1 && cached) {
      setThumbnails(cached);
      setImagesTotal(cache.getCachedTotal(datasetId) ?? 0);
      return;
    }

    setThumbnails([]);
    startTransition(async () => {
      const result = await fetchImagesForDatasetAction(datasetId, page, perPage);
      if (result.error) {
        setMessage(`Error loading images: ${result.error}`);
        setThumbnails([]);
        setImagesTotal(0);
      } else {
        setThumbnails(result.thumbnails);
        setImagesTotal(result.total);
        // Cache first page only
        if (page === 1) {
          cache.setCached(datasetId, result.thumbnails, result.total);
        }
      }
    });
  };

  return {
    thumbnails,
    setThumbnails,
    imagesTotal,
    setImagesTotal,
    message,
    setMessage,
    loadImagesForDataset,
    isPending,
    cache,
  };
}
