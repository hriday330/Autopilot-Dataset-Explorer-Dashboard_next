"use client";

import { useEffect } from "react";

export function usePagedImagePreloader(
  currentPageUrls: string[] = [],
  nextPageUrls: string[] = []
) {
  useEffect(() => {
    if (!currentPageUrls || currentPageUrls.length === 0) return;

    // Preload images for the current page
    const currentImgs = currentPageUrls.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });

    // Preload next page silently for buttery-smooth navigation
    const nextImgs = nextPageUrls.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });

    // Cleanup references so browser can garbage collect
    return () => {
      currentImgs.length = 0;
      nextImgs.length = 0;
    };
  }, [currentPageUrls, nextPageUrls]);
}
