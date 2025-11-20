"use client";

import { useState, useTransition } from "react";
import { fetchImagesForDatasetAction } from "@lib/actions/dataset";
import { useDatasetImageCache } from "./useDatasetImageCache";
import { ImageThumbnail } from "@lib/types";

export function useLoadImages() {
  const [thumbnails, setThumbnails] = useState<ImageThumbnail[]>([]);
  const [imagesTotal, setImagesTotal] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const cache = useDatasetImageCache();

  const prefetchPage = async (
    datasetId: string,
    page: number,
    perPage: number
  ) => {
    if (page < 1) return;
    if (cache.hasPage(datasetId, page)) return; 

    try {
      const result = await fetchImagesForDatasetAction(
        datasetId,
        page,
        perPage
      );

      if (!result.error) {
        cache.setCachedPage(datasetId, page, result.thumbnails, result.total);
      }
    } catch {
      // prefetch errors should be silent
    }
  };

  const loadImagesForDataset = (datasetId: string, page: number, perPage: number) => {
    setMessage(null);
    const cached = cache.getCachedThumbnails(datasetId, page);

    if (cached) {
      setThumbnails(cached.thumbnails);
      setImagesTotal(cached.total);

      // Prefetch neighbors in background
      prefetchPage(datasetId, page + 1, perPage);
      prefetchPage(datasetId, page - 1, perPage);

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

        // Cache this page
        cache.setCachedPage(datasetId, page, result.thumbnails, result.total);

        // Prefetch neighbors in the background
        prefetchPage(datasetId, page + 1, perPage);
        prefetchPage(datasetId, page - 1, perPage);
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
