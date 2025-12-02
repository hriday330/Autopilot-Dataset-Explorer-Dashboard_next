"use client";

import { Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@components/ui/button";
import { useState, useRef, useEffect } from "react";
import type { BoundingBox, Label } from "@lib/types";
import { useBoundingBoxes } from "./hooks/useBoundingBoxes";
import { useSelectFrame } from "./hooks/useSelectFrame";
import { useAutoplayFrames } from "./hooks/useAutoplayFrames";

interface Frame {
  id: string;
  url: string;
  speed?: string;
  timestamp?: string;
  confidence?: string;
}

interface ImageViewerProps {
  frame: Frame;
  frameNumber: number;
  totalFrames: number;
  selectedLabel: string;
  labels: Label[];
  onPrevFrame: () => void;
  onNextFrame: () => void;
  onGoToFrame: (imageNum: number) => void;
  boxes: Record<string, BoundingBox[]>;
  setBoxes: React.Dispatch<React.SetStateAction<Record<string, BoundingBox[]>>>;
}

export function ImageViewer({
  frame,
  frameNumber,
  totalFrames,
  selectedLabel,
  onPrevFrame,
  onNextFrame,
  onGoToFrame,
  boxes,
  setBoxes,
  labels,
}: ImageViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawingDisabled, setDrawingDisabled] = useState(false);
  const {
    getBoundingBoxLabelColor,
    getBoundingBoxLabelName,
    currentBox,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    deleteBox,
    currentFrameBoxes,
  } = useBoundingBoxes(
    containerRef,
    selectedLabel,
    setBoxes,
    frame.id,
    labels,
    boxes,
  );

  const {
    frameInput,
    setFrameInput,
    handleInputChange: handleFrameInputChange,
    handleInputKeyDown,
    handleInputBlur,
    isValidFrame,
  } = useSelectFrame(frameNumber, totalFrames, onGoToFrame);

  
  useEffect(() => {
    // Sync displayed number when frame changes externally
    setFrameInput(frameNumber.toString());
  }, [frameNumber]);

  useAutoplayFrames(
    isPlaying,
    500, 
    onNextFrame,
    setDrawingDisabled,
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
      {/* Image Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl aspect-video bg-[#0E0E0E] border border-[#1F1F1F] rounded-lg overflow-hidden cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={frame.url}
          alt="Dataset frame"
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />

        {/* Metadata Overlay */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border border-[#1F1F1F] rounded-lg p-3 shadow-2xl pointer-events-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A3A3A3]">Speed:</span>
              <span className="text-sm text-[#E5E5E5]">{frame.speed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A3A3A3]">Timestamp:</span>
              <span className="text-sm text-[#E5E5E5]">{frame.timestamp}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A3A3A3]">Confidence:</span>
              <span className="text-sm text-[#E82127]">{frame.confidence}</span>
            </div>
          </div>
        </div>

        {/* Frame Counter */}
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm border border-[#1F1F1F] rounded-lg px-3 py-1.5 pointer-events-auto">
          <span className="text-sm text-[#A3A3A3]">Frame</span>
          <input
            type="text"
            value={frameInput}
            onChange={(e) => handleFrameInputChange(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className={`w-12 text-center rounded bg-transparent text-sm outline-none
              ${isValidFrame(frameInput) ? "text-[#E5E5E5]" : "text-red-400"}`}
          />
          <span className="text-sm text-[#A3A3A3]">/ {totalFrames}</span>
          {currentFrameBoxes.length > 0 && (
            <span className="ml-2 text-xs text-[#E82127]">
              ({currentFrameBoxes.length} labels)
            </span>
          )}
        </div>

        {/* Saved Bounding Boxes */}
        {currentFrameBoxes.map((box) => (
          <div
            key={box.id}
            className="absolute border-2 rounded group"
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
              borderColor: getBoundingBoxLabelColor(box.label),
            }}
          >
            <div
              className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs text-white flex items-center gap-1"
              style={{ backgroundColor: getBoundingBoxLabelColor(box.label) }}
            >
              {getBoundingBoxLabelName(box.label)}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBox(box.id);
                }}
                className="ml-1 hover:bg-white/20 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Current Drawing Box */}
        {!drawingDisabled && currentBox && (
          <div
            className="absolute border-2 border-dashed rounded pointer-events-none"
            style={{
              left: `${currentBox.x}%`,
              top: `${currentBox.y}%`,
              width: `${currentBox.width}%`,
              height: `${currentBox.height}%`,
              borderColor: getBoundingBoxLabelColor(selectedLabel),
            }}
          >
            <div
              className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs text-white"
              style={{
                backgroundColor: getBoundingBoxLabelColor(selectedLabel),
              }}
            >
              {getBoundingBoxLabelName(selectedLabel)}
            </div>
          </div>
        )}
      </div>

      {/* Info Text */}
      <div className="text-center">
        <p className="text-xs text-[#A3A3A3]">
          Click and drag to draw bounding boxes • Selected:{" "}
          <span className="text-[#E82127]">
            {getBoundingBoxLabelName(selectedLabel)}
          </span>
        </p>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="bg-transparent border-[#1F1F1F] hover:bg-[#1F1F1F] hover:border-[#E82127] text-[#E5E5E5]"
          onClick={onPrevFrame}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>

        <Button
          variant="default"
          className="bg-[#E82127] hover:bg-[#D01F25] text-white px-6"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          <Play className="w-4 h-4 mr-1" fill={isPlaying ? "white" : "none"} />
          {isPlaying ? "Pause" : "Play"}
        </Button>

        <Button
          variant="outline"
          className="bg-transparent border-[#1F1F1F] hover:bg-[#1F1F1F] hover:border-[#E82127] text-[#E5E5E5]"
          onClick={onNextFrame}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
