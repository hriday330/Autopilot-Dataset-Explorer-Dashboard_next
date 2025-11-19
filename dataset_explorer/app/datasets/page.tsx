"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@components/AuthProvider";
import { Button } from "@components/ui/button";
import DatasetImageGrid from "@components/DatasetImageGrid";
import { useDatasets } from "@hooks/useDatasets";
import { useLoadImages } from "@hooks/useLoadImages";
import { useUpdateImages } from "@hooks/useUpdateImages";
import Spinner from "@components/ui/spinner";
import FileUploader from "@components/ui/file-uploader";
import { Alert, AlertDescription } from "@components/ui/alert";
import DatasetSelector from "@components/DatasetSelector";
import { Progress } from "@components/ui/progress";
import DatasetCreation from "@components/DatasetCreation";

export default function DatasetsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [selected, setSelected] = React.useState<string>("");
  const [newName, setNewName] = React.useState("");
  const [imagesPage, setImagesPage] = React.useState(1);
  const [imagesPerPage] = React.useState(12);
  const [ initialLoading, setInitialLoading] = React.useState(true); 

  const {
    datasets,
    counts,
    loadDatasets,
    setMessage: setDatasetMessage,
    message: datasetMessage,
  } = useDatasets();

  const {
    thumbnails,
    setThumbnails,
    imagesTotal,
    setImagesTotal,
    loadImagesForDataset,
    setMessage: setImageMessage,
    message: imageMessage,
    isPending: imagesLoading,
    cache,
  } = useLoadImages();

  const {
    uploading,
    deletingIds,
    handleDeleteImage: deleteImageHandler,
    handleCreateDataset: createDatasetHandler,
    handleUploadFiles,
    message: opMessage,
    uploadProgress,
  } = useUpdateImages({
    onDeleteComplete: () => {
      loadDatasets(user?.id || "", selected);
    },
    onUploadComplete: () => {
      loadDatasets(user?.id || "", selected);
      loadImagesForDataset(selected, 1, imagesPerPage);
    },
  });

  const message = datasetMessage || imageMessage || opMessage;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    if(initialLoading){
      loadDatasets(user.id, selected, setSelected)?.finally(() => setInitialLoading(false));
    } else {
      loadDatasets(user.id, selected, setSelected);
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

  const handleDeleteImage = (imageId: string, storagePath: string) => {
    deleteImageHandler(imageId, storagePath, () => {
      setThumbnails(prev => prev.filter(t => t.id !== imageId));
      setImagesTotal(prev => Math.max(0, prev - 1));
      cache.invalidate(selected);
    });
  };

  const handleCreateDataset = () => {
    if (!newName || !user) return;
    createDatasetHandler(newName, user.id);
    setNewName("");
  };


  return (
    <div className="min-h-screen p-8 bg-[#0E0E0E]">
      <div className="max-w-4xl mx-auto bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
        {initialLoading ? <Spinner text="Loading your datasets"/> : 
        <>
          <h2 className="text-2xl text-white mb-4">Your datasets</h2>
          {message && (
            <Alert variant="destructive" className="mb-4 border-red-600/50 bg-red-950/40 text-red-300">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

        <DatasetSelector
          datasets={datasets}
          counts={counts}
          selected={selected}
          onSelect={setSelected}
        />

        <DatasetCreation
          newName={newName}
          setNewName={setNewName}
          onCreate={handleCreateDataset}
        />

        <FileUploader
          onSelect={async (files) => {
            const ds = datasets.find((d) => d.id === selected);
            if (!ds || !user) return;
            await handleUploadFiles(
              files,
              selected,
              ds.name,
              user.id,
              (newThumbnails) => {
                setThumbnails((prev) => [...newThumbnails, ...prev]);
                setImagesTotal((prev) => prev + newThumbnails.length);
                cache.invalidate(selected);
              }
            );
          }}
          accept="image/*,.zip"
          maxFiles={1}
          allowZip={true}
          uploading={uploading}
          label="Upload Image or ZIP"
          description="Upload one image or a ZIP containing multiple images."
        />

        {uploading && <Progress className="my-2" value={uploadProgress*100} />}
        
        {/* Thumbnail Grid */}
        {imagesLoading 
          ? <Spinner text="Loading your images"/> 
          : (!selected) 
          ? (
          <div className="mb-6">
            <div className="text-sm text-[#A3A3A3] mb-2">Images in selected dataset</div>
            <div className="text-sm text-[#6B6B6B]">Select a dataset to view images.</div>
          </div>
        ) : (
          <DatasetImageGrid
            thumbnails={thumbnails}
            deletingIds={deletingIds}
            imagesPage={imagesPage}
            imagesTotal={imagesTotal}
            imagesPerPage={imagesPerPage}
            onDelete={handleDeleteImage}
            onPrevPage={() => setImagesPage(p => Math.max(1, p - 1))}
            onNextPage={() => setImagesPage(p => p + 1)}
          />
        )}

        <div className="mt-6">
          <Button variant="outline" className="border-[#1F1F1F] text-[#A3A3A3]" onClick={() => router.push('/')}>Back to dashboard</Button>
        </div>
        </>}
      </div>
    </div>
  );
}
