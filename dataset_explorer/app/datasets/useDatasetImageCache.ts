"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { ImageThumbnail } from "./actions";

type CacheEntry = {
  thumbnails: ImageThumbnail[];
  total: number;
};

export function useDatasetImageCache() {
  const queryClient = useQueryClient();

  // Keep query keys consistent.
  const key = (datasetId: string) => ["datasetImageCache", datasetId] as const;

  const getCachedThumbnails = (datasetId: string) => {
    const data = queryClient.getQueryData<CacheEntry>(key(datasetId));
    return data?.thumbnails;
  };

  const getCachedTotal = (datasetId: string) => {
    const data = queryClient.getQueryData<CacheEntry>(key(datasetId));
    return data?.total;
  };

  const setCached = (datasetId: string, thumbnails: ImageThumbnail[], total: number) => {
    queryClient.setQueryData<CacheEntry>(key(datasetId), {
      thumbnails,
      total,
    });
  };

  const invalidate = (datasetId: string) => {
    queryClient.removeQueries({ queryKey: key(datasetId) });
  };

  return {
    getCachedThumbnails,
    getCachedTotal,
    setCached,
    invalidate,
  };
}
