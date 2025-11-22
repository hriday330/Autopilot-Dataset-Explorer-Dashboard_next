"use client";

import { useEffect, useRef } from "react";
import type { BoundingBox } from "lib/types";

interface User {
  id: string;
}

interface Thumbnail {
  id: string;
  url: string;
  storage_path: string;
}

type BoxesState = Record<string, BoundingBox[]>;

export function useAutosaveAnnotations(
  thumbnails: Thumbnail[],
  currentFrame: number,
  boxes: BoxesState,
  user: User | null,
) {
  const pendingCount = useRef(0);

  async function waitForSave() {
    // Poll until all pending saves finish
    while (pendingCount.current > 0) {
      await new Promise((res) => setTimeout(res, 50));
    }
  }

  useEffect(() => {
    const img = thumbnails[currentFrame];
    if (!img || !user) return;

    const timer = setTimeout(async () => {
      try {
        pendingCount.current++;

        const payload = {
          boxes: boxes[img.id] || [],
          userId: user.id,
        };

        await fetch(`/api/annotations/${img.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Autosave error:", err);
      } finally {
        pendingCount.current--;
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [thumbnails, currentFrame, boxes, user]);

  return {
    isSaving: pendingCount.current > 0,
    waitForSave,
  };
}
