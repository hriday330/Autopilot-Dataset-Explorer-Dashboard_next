"use client";

import { useEffect } from "react";

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface Thumbnail {
  id: string;
  url: string;
  storage_path: string;
}

type BoxesState = Record<string, BoundingBox[]>;

export function useLoadAnnotations(
  thumbnails: Thumbnail[],
  currentFrame: number,
  setBoxes: React.Dispatch<React.SetStateAction<BoxesState>>,
) {
  useEffect(() => {
    const img = thumbnails[currentFrame];
    if (!img) return;

    async function load() {
      try {
        const res = await fetch(`/api/annotations/${img.id}`, {
          cache: "no-store",
        });

        const data: { annotations?: BoundingBox[] } = await res.json();

        setBoxes((prev) => ({
          ...prev,
          [img.id]: data.annotations || [],
        }));
      } catch (err) {
        console.error("Error loading annotations:", err);
      }
    }

    load();
  }, [currentFrame, thumbnails, setBoxes]);
}
