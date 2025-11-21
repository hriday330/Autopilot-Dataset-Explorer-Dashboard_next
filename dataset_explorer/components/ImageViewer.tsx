"use client";

import { Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import type { BoundingBox, Label } from "@lib/types";
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
  boxes: Record<string, BoundingBox[]>;
  setBoxes: React.Dispatch<React.SetStateAction<Record<string, BoundingBox[]>>>;
}

export function ImageViewer({ frame, frameNumber, totalFrames, selectedLabel, onPrevFrame, onNextFrame, boxes, setBoxes, labels }: ImageViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-play frames
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        onNextFrame();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, onNextFrame]);

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
    
    const width = x - startPoint.x;
    const height = y - startPoint.y;
    
    setCurrentBox({
      id: selectedLabel,
      x: width > 0 ? startPoint.x : x,
      y: height > 0 ? startPoint.y : y,
      width: Math.abs(width),
      height: Math.abs(height),
      label: selectedLabel
      
    });
  };

  const handleMouseUp = () => {
    if (currentBox && currentBox.width > 1 && currentBox.height > 1) {
      setBoxes(prev => ({
        ...prev,
        [frame.id]: [...(prev[frame.id] || []), currentBox]
      }));
    }
    setIsDrawing(false);
    setCurrentBox(null);
    setStartPoint(null);
  };

  const deleteBox = (boxId: string) => {
    setBoxes(prev => ({
      ...prev,
      [frame.id]: (prev[frame.id] || []).filter(box => box.id !== boxId)
    }));
  };

  const currentFrameBoxes = boxes[frame.id] || [];

  // Get label color
  const getLabelColor = (labelId: string) => {
    return labels.find(l => l.id === labelId)?.color || "#E82127";
  };

  const getLabelName = (labelId: string) => {
    return labels.find(l => l.id === labelId)?.name || "Unknown";
  }

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
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm border border-[#1F1F1F] rounded-lg px-3 py-1.5 pointer-events-none">
          <span className="text-sm text-[#E5E5E5]">Frame {frameNumber} / {totalFrames}</span>
          {currentFrameBoxes.length > 0 && (
            <span className="ml-2 text-xs text-[#E82127]">({currentFrameBoxes.length} labels)</span>
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
              borderColor: getLabelColor(box.label)
            }}
          >
            <div 
              className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs text-white flex items-center gap-1"
              style={{ backgroundColor: getLabelColor(box.label) }}
            >
              {getLabelName(box.label)}
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
        {currentBox && (
          <div
            className="absolute border-2 border-dashed rounded pointer-events-none"
            style={{
              left: `${currentBox.x}%`,
              top: `${currentBox.y}%`,
              width: `${currentBox.width}%`,
              height: `${currentBox.height}%`,
              borderColor: getLabelColor(selectedLabel)
            }}
          >
            <div 
              className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs text-white"
              style={{ backgroundColor: getLabelColor(selectedLabel) }}
            >
              {getLabelName(selectedLabel)}
            </div>
          </div>
        )}
      </div>

      {/* Info Text */}
      <div className="text-center">
        <p className="text-xs text-[#A3A3A3]">
          Click and drag to draw bounding boxes • Selected: <span className="text-[#E82127]">{getLabelName(selectedLabel)}</span>
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