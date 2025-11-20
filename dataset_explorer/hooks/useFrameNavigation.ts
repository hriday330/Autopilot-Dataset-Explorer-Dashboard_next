"use client";

import { type Dispatch, type SetStateAction, useCallback } from "react";

interface UseFrameNavigationProps {
  currentFrame: number;
  setCurrentFrame: Dispatch<SetStateAction<number>>
  currentPage: number;
  setCurrentPage:  Dispatch<SetStateAction<number>>
  thumbnailsLength: number;
  pageSize: number;
}

export function useFrameNavigation({
  currentFrame,
  setCurrentFrame,
  currentPage,
  setCurrentPage,
  thumbnailsLength,
  pageSize,
}: UseFrameNavigationProps) {
  
  const handleNextFrame = useCallback(() => {
    if (currentFrame < thumbnailsLength - 1) {
      setCurrentFrame(currentFrame + 1);
    } else {
      setCurrentPage((prev) => prev + 1);
      setCurrentFrame(0);
    }
  }, [currentFrame, thumbnailsLength, setCurrentFrame, setCurrentPage]);

  const handlePrevFrame = useCallback(() => {
    if (currentFrame > 0) {
      setCurrentFrame(currentFrame - 1);
    } else if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      setCurrentFrame(pageSize - 1);
    }
  }, [currentFrame, currentPage, setCurrentFrame, setCurrentPage, pageSize]);

  return { handleNextFrame, handlePrevFrame };
}
