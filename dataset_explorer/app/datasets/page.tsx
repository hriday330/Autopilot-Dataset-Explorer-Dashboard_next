"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@components/AuthProvider";
import { useDataset } from "@contexts/DatasetContext";
import { useLoadImages } from "@hooks/useLoadImages";
import { useUpdateImages } from "@hooks/useUpdateImages";
import { toast } from "sonner";
import { DatasetControlsCard } from "./sections/DatasetControlsCard";
import { DatasetImagesCard } from "./sections/DatasetImagesCard";
import { DatasetActionsCard } from "./sections/DatasetActionsCard";

export default function DatasetsPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  const [newName, setNewName] = useState("");
  const [imagesPage, setImagesPage] = useState(1);
  const [imagesPerPage] = useState(12);
  const [initialLoading, setInitialLoading] = useState(true);

  const {
    datasets,
    counts,
    selected,
    setSelected,
    loadDatasets,
    createDataset,
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
    handleDeleteImage: deleteImageHandler,
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

  // TODO - refactor this so this hack is not needed
  useEffect(() => {
    if (message?.type === "success") {
      dismissMessage?.();
    }
    if (message?.type === "error") {
      dismissMessage?.();
    }
  }, [message]);

  const handleDeleteImage = (imageId: string, storagePath: string) => {
    deleteImageHandler(imageId, storagePath, () => {
      setThumbnails((prev) => prev.filter((t) => t.id !== imageId));
      setImagesTotal((prev) => Math.max(0, prev - 1));
      cache.invalidate(selected);
    });
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
          handleDeleteImage={handleDeleteImage}
        />

        <DatasetActionsCard selected={selected} router={router} />
      </div>
    </div>
  );
}
