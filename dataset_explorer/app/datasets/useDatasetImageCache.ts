"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { ImageThumbnail } from "./actions";

type CacheEntry = {
  thumbnails: ImageThumbnail[];
  total: number;
};

export function useDatasetImageCache() {
  const queryClient = useQueryClient();

  const key = (datasetId: string, page: number) =>
    ["datasetImageCache", datasetId, page] as const;

  const getCachedThumbnails = (datasetId: string, page: number): CacheEntry | null => {
    return queryClient.getQueryData<CacheEntry>(key(datasetId, page)) ?? null;
  };

  const hasPage = (datasetId: string, page: number): boolean => {
    return queryClient.getQueryData<CacheEntry>(key(datasetId, page)) != null;
  };

  const setCachedPage = (
    datasetId: string,
    page: number,
    thumbnails: ImageThumbnail[],
    total: number
  ) => {
    queryClient.setQueryData<CacheEntry>(key(datasetId, page), {
      thumbnails,
      total,
    });
  };

  const invalidate = (datasetId: string) => {
    queryClient.removeQueries({
      queryKey: ["datasetImageCache", datasetId],
      exact: false,
    });
  };

  return {
    getCachedThumbnails,
    hasPage,
    setCachedPage,
    invalidate,
  };
}
