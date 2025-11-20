"use client";

import { DashboardHeader } from "@components/DashboardHeader";
import { Sidebar } from "@components/Sidebar";
import { ImageViewer } from "@components/ImageViewer";
import { AnalyticsPanel } from "@components/AnalyticsPanel";
import { DashboardFooter } from "@components/DashboardFooter";
import { useState, useEffect } from "react";
import { useLoadImages } from "@hooks/useLoadImages";
import { useDatasets } from "@hooks/useDatasets";
import { useUser } from "@components/AuthProvider";
import { useSearchParams } from "next/navigation";

interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

const PAGE_SIZE = 12;

export default function Page() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState("Pedestrian");
  const [boxes, setBoxes] = useState<Record<string, BoundingBox[]>>({});
  const [currentView, setCurrentView] = useState<"labeling" | "analytics">("labeling");

  const {user} = useUser();
  const { datasets, loadDatasets } = useDatasets();
  const { thumbnails, imagesTotal, loadImagesForDataset } = useLoadImages();

  const searchParams = useSearchParams();
  const datasetFromUrl = searchParams.get("dataset"); 
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
  if (!user) return;

  // If URL provided dataset, use it 
  if (datasetFromUrl) {
    setSelectedDatasetId(datasetFromUrl);
    loadDatasets(user.id); // still load all datasets
    return;
  }

  // Else auto-select first dataset
  loadDatasets(user.id, undefined, (firstId) => {
    setSelectedDatasetId(firstId);
  });
}, [user]);


  useEffect(() => {
    if (!selectedDatasetId) return;
    loadImagesForDataset(selectedDatasetId, currentPage, PAGE_SIZE);
  }, [selectedDatasetId, currentPage]);

  useEffect(() => {
    const img = thumbnails[currentFrame];
    if (!img) return;

    async function loadAnnotations() {
      try {
        const res = await fetch(`/api/annotations/${img.id}`, { cache: "no-store" });
        const data = await res.json();

        setBoxes((prev) => ({
          ...prev,
          [img.id]: data.annotations || [],
        }));
      } catch (err) {
        console.error("Error loading annotations:", err);
      }
    }

    loadAnnotations();
  }, [currentFrame, thumbnails]);

  useEffect(() => {
  const img = thumbnails[currentFrame];
  if (!img || !user) return;

  async function save() {
    const payload = {
      boxes: boxes[img.id] || [],
      userId: user?.id,
    };

    try {
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
}, [boxes, currentFrame, thumbnails, user]);


  const totalFrames = imagesTotal;

  const handleNextFrame = () => {
  if (currentFrame < thumbnails.length - 1) {
    setCurrentFrame(currentFrame + 1);
  } else {
    // reached end of this page → load next page
    setCurrentPage((prev) => prev + 1);
    setCurrentFrame(0);
  }
};

  const handlePrevFrame = () => {
    if (currentFrame > 0) {
      setCurrentFrame(currentFrame - 1);
    } else if (currentPage > 1) {
      // go to previous page’s last frame
      setCurrentPage((prev) => prev - 1);
      setCurrentFrame(PAGE_SIZE - 1);
    }
  };

  const handleExportData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalFrames,
      labeledFrames: Object.keys(boxes).filter((key) => boxes[key].length > 0).length,
      frames: thumbnails.map((img, index) => ({
        frameId: index,
        imageUrl: img.url,
        metadata: {}, // TODO: add metadata later if needed
        annotations: boxes[index] || [],
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `autopilot-dataset-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all labels? This cannot be undone.")) {
      setBoxes({});
    }
  };

  const labeledFramesCount = Object.keys(boxes).filter((key) => boxes[key].length > 0).length;

  const absoluteFrameNumber = (currentPage - 1) * PAGE_SIZE + (currentFrame + 1);

  return (
    <div className="h-screen flex flex-col bg-[#0E0E0E] overflow-hidden">
      <DashboardHeader
        onExport={handleExportData}
        onClear={handleClearData}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          selectedLabel={selectedLabel}
          onLabelSelect={setSelectedLabel}
        />

        <div className="flex-1 flex flex-col overflow-auto">
          {currentView === "labeling" ? (
            thumbnails.length > 0 ? (
              <ImageViewer
                frame={thumbnails[currentFrame]} // 🔥 replaced static frame
                frameNumber={absoluteFrameNumber}
                totalFrames={totalFrames}
                selectedLabel={selectedLabel}
                onPrevFrame={handlePrevFrame}
                onNextFrame={handleNextFrame}
                boxes={boxes}
                setBoxes={setBoxes}
              />
            ) : (
              <div className="text-center text-[#A3A3A3] mt-20">No images in this dataset</div>
            )
          ) : (
            <AnalyticsPanel boxes={boxes} frames={thumbnails} />
          )}
        </div>
      </div>

      <DashboardFooter labeledCount={labeledFramesCount} totalCount={totalFrames} />
    </div>
  );
}
