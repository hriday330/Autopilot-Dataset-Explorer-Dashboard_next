"use client";

import { useEffect } from "react";
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
  user: User|null
) {
  useEffect(() => {
    const img = thumbnails[currentFrame];
    if (!img || !user) return;

    async function save() {
      try {
        const payload = {
          boxes: boxes[img.id] || [],
          userId: user?.id,
        };

        await fetch(`/api/annotations/${img.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Autosave error:", err);
      }
    }
    const timer = setTimeout(save, 300);
    return () => clearTimeout(timer);
  }, [thumbnails, currentFrame, boxes, user]);
}
