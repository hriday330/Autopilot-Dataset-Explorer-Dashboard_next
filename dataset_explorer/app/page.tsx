"use client";

import { DashboardHeader } from "@components/DashboardHeader";
import { Sidebar } from "@components/Sidebar";
import { ImageViewer } from "@components/ImageViewer";
import { AnalyticsPanel } from "@components/AnalyticsPanel";
import { DashboardFooter } from "@components/DashboardFooter";
import { useState, useEffect, Suspense, use } from "react";
import { useLoadImages } from "@hooks/useLoadImages";
import { useDatasets } from "@hooks/useDatasets";
import { useUser } from "@components/AuthProvider";
import { useSearchParams } from "next/navigation";
import type { BoundingBox } from "@lib/types";
import { useLoadAnnotations } from "@hooks/useLoadAnnotations";
import { useAutosaveAnnotations } from "@hooks/useAutosaveAnnotations";
import { useFrameNavigation } from "@hooks/useFrameNavigation";
import { useLabelClasses } from "@hooks/useLabelClasses";
import { ManageLabelsModal } from "@components/ManageLabelsModal";


const PAGE_SIZE = 12;

function DashboardContent() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selectedLabelId, setSelectedLabelId] = useState<string>("");
  const [boxes, setBoxes] = useState<Record<string, BoundingBox[]>>({});
  const [currentView, setCurrentView] = useState<"labeling" | "analytics">("labeling");

  const { user } = useUser();
  const { loadDatasets } = useDatasets();
  const { thumbnails, imagesTotal, loadImagesForDataset } = useLoadImages();

  const searchParams = useSearchParams();
  const datasetFromUrl = searchParams.get("dataset"); 
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showManageLabels, setShowManageLabels] = useState(false);

  const { 
    labels, 
    createLabel, 
    updateLabel, 
    reorderLabels, 
    deleteLabel
  }  = useLabelClasses(selectedDatasetId);

  useEffect(() => {
  if (labels.length > 0 && !selectedLabelId) {
    setSelectedLabelId(labels[0].id);
  }
}, [labels]);

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

  useLoadAnnotations(thumbnails, currentFrame, setBoxes);
  const { waitForSave } = useAutosaveAnnotations(thumbnails, currentFrame, boxes, user);

  const totalFrames = imagesTotal;

  const { handleNextFrame, handlePrevFrame } = useFrameNavigation({
    currentFrame,
    setCurrentFrame,
    currentPage,
    setCurrentPage,
    thumbnailsLength: thumbnails.length,
    pageSize: PAGE_SIZE,
  });

  const handleLocalDeleteLabel = (labelId: string) => {
  setBoxes(prev =>
    Object.fromEntries(
      Object.entries(prev).map(([imageId, arr]) => [
        imageId,
        arr.filter(box => box.label !== labelId),
      ])
    )
  );
};


  const handleExportData = async () => {

    await waitForSave();
    const payload = {
      thumbnails,
      boxes,
    };

    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("Export failed");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `autopilot-dataset-${new Date().toISOString().split("T")[0]}.json`;
    a.click();

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
          selectedLabelId={selectedLabelId}
          labels={labels}
          onLabelIdSelect={setSelectedLabelId}
          onManageLabelsClick={() => setShowManageLabels(true)}
        />

        {showManageLabels && (
          <ManageLabelsModal
            open={showManageLabels}
            onClose={() => setShowManageLabels(false)}
            labels={labels}
            createLabel={createLabel}
            updateLabel={updateLabel}
            deleteLabel={(labelId) => deleteLabel(labelId).then(() => handleLocalDeleteLabel(labelId))}
            reorderLabels={reorderLabels}
          />)}

        <div className="flex-1 flex flex-col overflow-auto">
          {currentView === "labeling" ? (
            thumbnails.length > 0 ? (
              <ImageViewer
                labels={labels}
                frame={thumbnails[currentFrame]}
                frameNumber={absoluteFrameNumber}
                totalFrames={totalFrames}
                selectedLabel={selectedLabelId}
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

export default function Page() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#0E0E0E]">
        <div className="text-[#A3A3A3]">Loading dashboard...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}