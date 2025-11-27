import { useState } from "react";
import type { BoundingBox, Label } from "@lib/types";

export function useBoundingBoxes(
  containerRef: React.RefObject<HTMLDivElement>,
  selectedLabel: string,
  setBoxes: React.Dispatch<React.SetStateAction<Record<string, BoundingBox[]>>>,
  frameId: string,
  labels: Label[],
  boxes: Record<string, BoundingBox[]>,
) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);

  const currentFrameBoxes = boxes[frameId] || [];
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setStartPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCurrentBox({
      id: crypto.randomUUID(),
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(x - startPoint.x),
      height: Math.abs(y - startPoint.y),
      label: selectedLabel,
    });
  };

  const handleMouseUp = () => {
    if (currentBox && currentBox.width > 1 && currentBox.height > 1) {
      setBoxes((prev: any) => ({
        ...prev,
        [frameId]: [...(prev[frameId] || []), currentBox],
      }));
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentBox(null);
  };

  const getBoundingBoxLabelColor = (labelId: string) => {
    return labels.find((l) => l.id === labelId)?.color || "#E82127";
  };

  const getBoundingBoxLabelName = (labelId: string) => {
    return labels.find((l) => l.id === labelId)?.name || "Unknown";
  };

  const deleteBox = (boxId: string) => {
    setBoxes((prev) => ({
      ...prev,
      [frameId]: (prev[frameId] || []).filter((box) => box.id !== boxId),
    }));
  };

  return {
    isDrawing,
    startPoint,
    currentBox,
    currentFrameBoxes,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getBoundingBoxLabelColor,
    getBoundingBoxLabelName,
    deleteBox
  };
}
