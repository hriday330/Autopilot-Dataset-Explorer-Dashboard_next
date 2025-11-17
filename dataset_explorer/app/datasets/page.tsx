"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../components/AuthProvider";
import { Button } from "../../components/ui/button";
import DatasetImageGrid from "../../components/DatasetImageGrid";
import { useDatasets } from "./useDatasets";
import { useLoadImages } from "./useLoadImages";
import { useUpdateImages } from "./useUpdateImages";
import Spinner from "../../components/ui/spinner";

export default function DatasetsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [selected, setSelected] = React.useState<string>("");
  const [newName, setNewName] = React.useState("");
  const [imagesPage, setImagesPage] = React.useState(1);
  const [imagesPerPage] = React.useState(12);
  const [ initialLoading, setInitialLoading] = React.useState(true); 

  // Dataset management
  const {
    datasets,
    counts,
    loadDatasets,
    setMessage: setDatasetMessage,
    message: datasetMessage,
    isPending,
  } = useDatasets();

  // Image loading with caching
  const {
    thumbnails,
    setThumbnails,
    imagesTotal,
    setImagesTotal,
    loadImagesForDataset,
    setMessage: setImageMessage,
    message: imageMessage,
    cache,
  } = useLoadImages();

  // Image operations (upload, delete, create)
  const {
    uploading,
    deletingIds,
    handleDeleteImage: deleteImageHandler,
    handleCreateDataset: createDatasetHandler,
    handleUploadFiles,
    setMessage: setOpMessage,
    message: opMessage,
  } = useUpdateImages({
    onDeleteComplete: () => {
      loadDatasets(user?.id || "", selected);
    },
    onUploadComplete: () => {
      loadDatasets(user?.id || "", selected);
    },
  });

  const message = datasetMessage || imageMessage || opMessage;

  // Redirect to login if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  // Load datasets on login
  useEffect(() => {
    if (!user) return;
    if(initialLoading){
      loadDatasets(user.id, selected, setSelected).finally(() => setInitialLoading(false));
    } else {
      loadDatasets(user.id, selected, setSelected);
    }
      
  }, [user]);

  // Load images whenever dataset or page changes
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

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user || !selected) return;
    const ds = datasets.find(d => d.id === selected);
    if (!ds) return;

    await handleUploadFiles(files, selected, ds.name, user.id, (newThumbnails) => {
      setThumbnails(prev => [...newThumbnails, ...prev]);
      setImagesTotal(prev => prev + newThumbnails.length);
      cache.invalidate(selected);
    });
  };

  return (
    <div className="min-h-screen p-8 bg-[#0E0E0E]">
      <div className="max-w-4xl mx-auto bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
        {initialLoading ? <Spinner text="Loading your datasets"/> : 
        <>
          <h2 className="text-2xl text-white mb-4">Your datasets</h2>
          {message && <div className="mb-4 p-2 bg-[#222] text-[#E5E5E5]">{message}</div>}

        {/* Dataset Selector */}
        <div className="mb-6">
          <div className="text-sm text-[#A3A3A3] mb-2">Select an existing dataset</div>
          <div className="space-y-2">
            {datasets.length === 0 && <div className="text-sm text-[#6B6B6B]">No datasets found.</div>}
            {datasets.map(ds => (
              <label key={ds.id} className="flex items-center gap-3">
                <input type="radio" name="dataset" checked={selected === ds.id} onChange={() => setSelected(ds.id)} />
                <div className="text-sm text-[#E5E5E5]">{ds.name}</div>
                <div className="text-xs text-[#A3A3A3]">({counts[ds.id] ?? 0} files)</div>
              </label>
            ))}
          </div>
        </div>


        {/* Create Dataset */}
        <div className="mb-6">
          <div className="text-sm text-[#A3A3A3] mb-2">Create a new dataset</div>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="dataset-name"
              className="bg-transparent border border-[#1F1F1F] px-3 py-2 rounded text-white"
            />
            <Button onClick={handleCreateDataset} className="bg-[#E82127]">Create</Button>
          </div>
        </div>

        {/* Upload Files */}
        <div className="mb-6">
          <div className="text-sm text-[#A3A3A3] mb-2">Upload files to selected dataset</div>
          <div className="flex items-center gap-3">
            {/** TODO: Create a file uploader component */}
            <input type="file" multiple onChange={e => handleFiles(e.target.files)} className="text-white"/>
            <Button className="bg-[#E82127]" onClick={() => document.getElementById('file-input')?.click()}>Choose files</Button>
            <input id="file-input" type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            {uploading && <div className="text-sm text-white">Uploading…</div>}
          </div>
        </div>

        {/* Thumbnail Grid */}
        {(!selected) ? (
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
