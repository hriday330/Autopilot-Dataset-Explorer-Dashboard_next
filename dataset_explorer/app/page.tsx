"use client";

import { DashboardHeader } from "@components/DashboardHeader";
import { Sidebar } from "@components/Sidebar";
import { ImageViewer } from "@components/ImageViewer";
import { AnalyticsPanel } from "@components/AnalyticsPanel";
import { DashboardFooter } from "@components/DashboardFooter";
import { useState, useEffect, Suspense } from "react";
import { useLoadImages } from "@hooks/useLoadImages";
import { useUser } from "@components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import type { BoundingBox } from "@lib/types";
import { useLoadAnnotations } from "@hooks/useLoadAnnotations";
import { useAutosaveAnnotations } from "@hooks/useAutosaveAnnotations";
import { useFrameNavigation } from "@hooks/useFrameNavigation";
import { useLabelClasses } from "@hooks/useLabelClasses";
import { ManageLabelsModal } from "@components/ManageLabelsModal";
import Spinner from "@components/ui/spinner";
import { useDatasetAnalytics } from "@hooks/useDatasetAnalytics";
import { useDataset } from "@contexts/DatasetContext";
import { Button } from "@components/ui/button";

const PAGE_SIZE = 12;

function DashboardContent() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selectedLabelId, setSelectedLabelId] = useState<string>("");
  const [boxes, setBoxes] = useState<Record<string, BoundingBox[]>>({});
  const [currentView, setCurrentView] = useState<"labeling" | "analytics">(
    "labeling",
  );
  const router = useRouter();

  const { user } = useUser();

  const {
    selected: datasetId,
    setSelected,
    loadDatasets,
    isPending: isDatasetsPending,
  } = useDataset();

  const {
    thumbnails,
    imagesTotal,
    loadImagesForDataset,
    isPending: isImagesPending,
  } = useLoadImages();

  const searchParams = useSearchParams();
  const datasetFromUrl = searchParams.get("dataset");

  const [currentPage, setCurrentPage] = useState(1);
  const [showManageLabels, setShowManageLabels] = useState(false);

  // Load labels & analytics based on global datasetId
  const { labels, createLabel, updateLabel, reorderLabels, deleteLabel } =
    useLabelClasses(datasetId);

  const {
    data: analytics,
    loading,
    fetchAnalytics,
  } = useDatasetAnalytics(datasetId);

  // ------------ Label auto-select ------------
  useEffect(() => {
    if (labels.length > 0 && !selectedLabelId) {
      setSelectedLabelId(labels[0].id);
    }
  }, [labels]);

  useEffect(() => {
    if (labels.length === 1 && selectedLabelId !== labels[0].id) {
      setSelectedLabelId(labels[0].id);
    }
  }, [labels, selectedLabelId]);

  // ------------ NEW: Load datasets globally ------------
  useEffect(() => {
    if (!user) return;

    loadDatasets(user.id).then(() => {
      // If URL has dataset override, apply it
      if (datasetFromUrl) {
        setSelected(datasetFromUrl);
      }
    });
  }, [user]);

  // ------------ Load images after dataset loads ------------
  useEffect(() => {
    if (!datasetId) return;
    loadImagesForDataset(datasetId, currentPage, PAGE_SIZE);
  }, [datasetId, currentPage]);

  // Load annotations
  useLoadAnnotations(thumbnails, currentFrame, setBoxes);

  const { waitForSave } = useAutosaveAnnotations(
    thumbnails,
    currentFrame,
    boxes,
    user,
    fetchAnalytics,
  );

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
    setBoxes((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([imageId, arr]) => [
          imageId,
          arr.filter((box) => box.label !== labelId),
        ]),
      ),
    );
  };

  const handleExportData = async () => {
    await waitForSave();
    const payload = { datasetId };

    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return console.error("Export failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `datapilot-dataset-${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm("Clear all labels? This cannot be undone.")) {
      setBoxes({});
    }
  };

  const labeledFramesCount = analytics?.totalLabeledFrames ?? 0;
  const absoluteFrameNumber =
    (currentPage - 1) * PAGE_SIZE + (currentFrame + 1);

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
            deleteLabel={(labelId) =>
              deleteLabel(labelId).then(() => handleLocalDeleteLabel(labelId))
            }
            reorderLabels={reorderLabels}
          />
        )}

        <div className="flex-1 flex flex-col overflow-auto">
          {currentView === "labeling" ? (
            labels.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#A3A3A3]">
                You must create at least one label before annotating.
              </div>
            ) : thumbnails.length > 0 ? (
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
            ) : isImagesPending || isDatasetsPending ? (
              <div className="text-center text-[#A3A3A3] mt-20">
                <Spinner text="Loading your dataset..." />
              </div>
            ) : (
              <div className="text-center text-[#A3A3A3] mt-20 space-x-3">
                <span>No images in this dataset</span>
                <Button
                  className="border-[#2A2A2A] bg-[#1A1A1A] text-[#D4D4D4] hover:bg-[#222]"
                  onClick={() => router.push("/datasets")}
                >
                  Upload images
                </Button>
              </div>
            )
          ) : (
            <AnalyticsPanel analytics={analytics} loading={loading} />
          )}
        </div>
      </div>

      <DashboardFooter
        labeledCount={labeledFramesCount}
        totalCount={totalFrames}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#0E0E0E]">
          <div className="text-[#A3A3A3]">Loading dashboard...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
