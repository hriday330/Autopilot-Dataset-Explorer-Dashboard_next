"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useUser } from "@contexts/AuthContext";
import { useDataset } from "@contexts/DatasetContext";
import { useLoadImages } from "@hooks/useLoadImages";
import { useUpdateImages } from "@hooks/useUpdateImages";

import { DatasetControlsCard } from "./sections/DatasetControlsCard";
import { DatasetImagesCard } from "./sections/DatasetImagesCard";
import { DatasetActionsCard } from "./sections/DatasetActionsCard";
import { Dataset, ImageThumbnail } from "@lib/types";

export interface DatasetsContentProps {
  initialUser: any;
  initialDatasets: Dataset[];
  initialCounts: Record<string, number>;
  initialSelectedDatasetId: string | null;
  initialThumbnails: ImageThumbnail[];
  initialTotal: number;
}

export function DatasetsContent({
  initialUser,
  initialDatasets,
  initialCounts,
  initialSelectedDatasetId,
  initialThumbnails,
  initialTotal,
}: DatasetsContentProps) {
  const router = useRouter();
  const { user, loading } = useUser();

  const [newName, setNewName] = useState("");
  const [imagesPage, setImagesPage] = useState(1);
  const [imagesPerPage, setImagesPerPage] = useState(12);
  const [initialLoading, setInitialLoading] = useState(true);

  const {
    datasets,
    counts,
    selected,
    setSelected,
    loadDatasets,
    createDataset,
    setDatasets,
    setCounts,
    message: datasetMessage,
    setMessage: setDatasetMessage,
  } = useDataset();

  const {
    thumbnails,
    setThumbnails,
    imagesTotal,
    setImagesTotal,
    loadImagesForDataset,
    setMessage: setLoadImagesMessage,
    message: imageMessage,
    isPending: imagesLoading,
    cache,
  } = useLoadImages();

  const {
    uploading,
    deletingIds,
    handleDeleteImages: deleteImagesHandler,
    processingZip,
    handleUploadFiles,
    message: opMessage,
    setMessage: setUpdateImageMessage,
    uploadProgress,
  } = useUpdateImages({
    onDeleteComplete: () => {
      if (!user) return;
      loadDatasets(user.id);
    },
    onUploadComplete: () => {
      if (!selected || !user) return;
      cache.invalidate(selected);
      loadDatasets(user.id);
      loadImagesForDataset(selected, 1, imagesPerPage);
    },
  });

  const message = datasetMessage || imageMessage || opMessage;

  let dismissMessage: (() => void) | null = null;
  if (datasetMessage) dismissMessage = () => setDatasetMessage(null);
  else if (imageMessage) dismissMessage = () => setLoadImagesMessage(null);
  else if (opMessage) dismissMessage = () => setUpdateImageMessage(null);

  useEffect(() => {
    if (message?.type === "success") {
      toast.success(message.message);
    }
  }, [message]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    setDatasets(initialDatasets);
    setCounts(initialCounts);
    if (initialSelectedDatasetId) setSelected(initialSelectedDatasetId);
    setThumbnails(initialThumbnails);
    setImagesTotal(initialTotal);
  }, []);

  useEffect(() => {
    if (!user) return;

    if (initialLoading) {
      loadDatasets(user.id)?.finally(() => setInitialLoading(false));
    } else {
      loadDatasets(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!selected) {
      setThumbnails([]);
      setImagesTotal(0);
      return;
    }
    loadImagesForDataset(selected, imagesPage, imagesPerPage);
  }, [selected, imagesPage, imagesPerPage]);

  useEffect(() => {
    if (message?.type === "success") {
      dismissMessage?.();
    }
    if (message?.type === "error") {
      dismissMessage?.();
    }
  }, [message]);

  const handleDeleteImages = (imageIds: string[], storagePaths: string[]) => {
    deleteImagesHandler(imageIds, storagePaths, () => {
      setThumbnails((prev) => prev.filter((t) => !imageIds.includes(t.id)));
      setImagesTotal((prev) => Math.max(0, prev - imageIds.length));
      cache.invalidate(selected);
    });
  };
  const handlePageSizeChange = (size: number) => {
    setImagesPage(1);
    setImagesPerPage(size);
    cache.invalidate(selected);
  };

  const handleCreateDataset = () => {
    if (!newName || !user) return;
    createDataset(newName, user.id);
    setNewName("");
  };

  return (
    <div className="min-h-screen p-8 bg-[#0E0E0E]">
      <div className="max-w-4xl mx-auto space-y-6">
        <DatasetControlsCard
          datasets={datasets}
          counts={counts}
          selected={selected}
          setSelected={setSelected}
          newName={newName}
          setNewName={setNewName}
          handleCreateDataset={handleCreateDataset}
          handleUploadFiles={handleUploadFiles}
          uploading={uploading}
          uploadProgress={uploadProgress}
          processingZip={processingZip}
          user={user}
          message={message}
          dismissMessage={dismissMessage}
          setThumbnails={setThumbnails}
          setImagesTotal={setImagesTotal}
          cache={cache}
        />

        <DatasetImagesCard
          thumbnails={thumbnails}
          deletingIds={deletingIds}
          imagesPage={imagesPage}
          setImagesPage={setImagesPage}
          imagesTotal={imagesTotal}
          imagesPerPage={imagesPerPage}
          selected={selected}
          imagesLoading={imagesLoading}
          onPageSizeChange={handlePageSizeChange}
          handleDeleteImages={handleDeleteImages}
        />

        <DatasetActionsCard selected={selected} router={router} />
      </div>
    </div>
  );
}
