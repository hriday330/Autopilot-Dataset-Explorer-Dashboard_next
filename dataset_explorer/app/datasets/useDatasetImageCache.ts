"use client";

import { useRef, useEffect } from "react";
import type { ImageThumbnail } from "./actions";

const CACHE_KEY = "datasetImageCache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheData {
  thumbnails: Record<string, ImageThumbnail[]>;
  totals: Record<string, number>;
  timestamp: number;
}

export function useDatasetImageCache() {
  const thumbnailsCache = useRef<Record<string, ImageThumbnail[]>>({});
  const totalsCache = useRef<Record<string, number>>({});

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { thumbnails, totals, timestamp } = JSON.parse(cached) as CacheData;
        const now = Date.now();
        // Only use cache if less than TTL old
        if (now - timestamp < CACHE_TTL_MS) {
          thumbnailsCache.current = thumbnails || {};
          totalsCache.current = totals || {};
        } else {
          // Cache expired, clear it
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (e) {
      console.warn("Failed to load image cache from localStorage", e);
    }
  }, []);

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          thumbnails: thumbnailsCache.current,
          totals: totalsCache.current,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn("Failed to save image cache to localStorage", e);
    }
  };

  const getCachedThumbnails = (datasetId: string) => {
    return thumbnailsCache.current[datasetId];
  };

  const getCachedTotal = (datasetId: string) => {
    return totalsCache.current[datasetId];
  };

  const setCached = (datasetId: string, thumbnails: ImageThumbnail[], total: number) => {
    thumbnailsCache.current[datasetId] = thumbnails;
    totalsCache.current[datasetId] = total;
    saveToLocalStorage();
  };

  const invalidate = (datasetId: string) => {
    delete thumbnailsCache.current[datasetId];
    delete totalsCache.current[datasetId];
    saveToLocalStorage();
  };

  return {
    getCachedThumbnails,
    getCachedTotal,
    setCached,
    invalidate,
  };
}
