"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../components/AuthProvider";
import { Button } from "../../components/ui/button";
import {
  fetchDatasetsAction,
  fetchImagesForDatasetAction,
  createDatasetAction,
  uploadImagesAction,
  deleteImageAction,
  type Dataset,
  type ImageThumbnail,
} from "./actions";

export default function DatasetsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [isPending, startTransition] = useTransition();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [imagesPage, setImagesPage] = useState(1);
  const [imagesPerPage] = useState(12);
  const [imagesTotal, setImagesTotal] = useState(0);
  const [thumbnails, setThumbnails] = useState<ImageThumbnail[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    loadDatasets();
  }, [user]);

  useEffect(() => {
    if (!selected) {
      setThumbnails([]);
      setImagesTotal(0);
      return;
    }
    loadImagesForDataset(selected, imagesPage, imagesPerPage);
  }, [selected, imagesPage, imagesPerPage]);

  const loadDatasets = () => {
    if (!user) return;
    setMessage(null);
    startTransition(async () => {
      const result = await fetchDatasetsAction(user.id);
      if (result.error) {
        setMessage(`Error: ${result.error}`);
        setDatasets([]);
        setCounts({});
      } else {
        setDatasets(result.datasets);
        setCounts(result.counts);
        if (!selected && result.datasets.length > 0) {
          setSelected(result.datasets[0].id);
        }
      }
    });
  };

  const loadImagesForDataset = (datasetId: string, page: number, perPage: number) => {
    setMessage(null);
    startTransition(async () => {
      const result = await fetchImagesForDatasetAction(datasetId, page, perPage);
      if (result.error) {
        setMessage(`Error loading images: ${result.error}`);
        setThumbnails([]);
        setImagesTotal(0);
      } else {
        setThumbnails(result.thumbnails);
        setImagesTotal(result.total);
      }
    });
  };

  const handleDeleteImage = (imageId: string, storagePath: string) => {
    if (!confirm('Delete this image? This will remove it from the dataset.')) return;
    setDeletingIds(prev => [...prev, imageId]);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteImageAction(imageId, storagePath);
      if (result.error) {
        setMessage(`Delete error: ${result.error}`);
      } else {
        setMessage('Image deleted');
        await loadImagesForDataset(selected, imagesPage, imagesPerPage);
        await loadDatasets();
      }
      setDeletingIds(prev => prev.filter(id => id !== imageId));
    });
  };

  const handleCreateDataset = () => {
    if (!newName || !user) return;
    setMessage(null);
    startTransition(async () => {
      const result = await createDatasetAction(newName, user.id);
      if (result.error) {
        setMessage(`Error: ${result.error}`);
      } else {
        setNewName("");
        setMessage('Dataset created');
        await loadDatasets();
      }
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user || !selected) return;
    setUploading(true);
    setMessage(null);
    try {
      const ds = datasets.find(d => d.id === selected);
      if (!ds) throw new Error('Selected dataset not found');
        const fileArray = Array.from(files);
        const fd = new FormData();
        fileArray.forEach(f => fd.append("files", f));
        fd.append("datasetId", ds.id);

      const result = await uploadImagesAction(selected, ds.name, user.id, fd);
      if (result.error) {
        setMessage(`Upload error: ${result.error}`);
      } else {
        setMessage('Upload complete');
        await loadDatasets();
        await loadImagesForDataset(selected, 1, imagesPerPage);
        setImagesPage(1);
      }
    } catch (err: any) {
      console.error(err);
      setMessage('Upload error: ' + (err?.message ?? String(err)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-[#0E0E0E]">
      <div className="max-w-4xl mx-auto bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
        <h2 className="text-2xl text-white mb-4">Your datasets</h2>
        {message && <div className="mb-4 p-2 bg-[#222] text-[#E5E5E5]">{message}</div>}

        <div className="mb-6">
          <div className="text-sm text-[#A3A3A3] mb-2">Select an existing dataset</div>
          <div className="space-y-2">
            {datasets.length === 0 && <div className="text-sm text-[#6B6B6B]">No datasets found.</div>}
            {datasets.map(ds => (
              <label key={ds.id} className="flex items-center gap-3">
                <input type="radio" name="dataset" checked={selected===ds.id} onChange={() => setSelected(ds.id)} />
                <div className="text-sm text-[#E5E5E5]">{ds.name}</div>
                <div className="text-xs text-[#A3A3A3]">({counts[ds.id] ?? 0} files)</div>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-sm text-[#A3A3A3] mb-2">Create a new dataset</div>
          <div className="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="dataset-name" className="bg-transparent border border-[#1F1F1F] px-3 py-2 rounded text-white" />
            <Button onClick={handleCreateDataset} className="bg-[#E82127]">Create</Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-sm text-[#A3A3A3] mb-2">Upload files to selected dataset</div>
          <div className="flex items-center gap-3">
            <input type="file" multiple onChange={e => handleFiles(e.target.files)} />
            <Button onClick={() => document.getElementById('file-input')?.click()} className="bg-[#E82127]">Choose files</Button>
            <input id="file-input" type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            {uploading && <div className="text-sm text-[#A3A3A3]">Uploading…</div>}
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="mb-6">
          <div className="text-sm text-[#A3A3A3] mb-2">Images in selected dataset</div>
          {!selected && <div className="text-sm text-[#6B6B6B]">Select a dataset to view images.</div>}
          {selected && thumbnails.length === 0 && <div className="text-sm text-[#6B6B6B]">No images in this dataset.</div>}

          {thumbnails.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {thumbnails.map(t => (
                  <div key={t.id} className="relative bg-[#0B0B0B] border border-[#1F1F1F] rounded overflow-hidden">
                    <button
                      onClick={() => handleDeleteImage(t.id, t.storage_path)}
                      disabled={deletingIds.includes(t.id)}
                      className="absolute top-1 right-1 z-10 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      title="Delete image"
                    >
                      {deletingIds.includes(t.id) ? (
                        <span className="text-xs">…</span>
                      ) : (
                        <span className="text-xs">×</span>
                      )}
                    </button>
                    {t.url ? (
                      <img src={t.url} alt={t.storage_path} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center text-xs text-[#6B6B6B]">Preview not available</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-[#A3A3A3]">Showing page {imagesPage} — {imagesTotal} images</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-[#1F1F1F] text-[#A3A3A3]"
                    onClick={() => setImagesPage(p => Math.max(1, p - 1))}
                    disabled={imagesPage === 1}
                  >
                    Prev
                  </Button>
                  <Button
                    onClick={() => setImagesPage(p => p + 1)}
                    className="bg-[#E82127]"
                    disabled={imagesPage * imagesPerPage >= imagesTotal}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6">
          <Button variant="outline" className="border-[#1F1F1F] text-[#A3A3A3]" onClick={() => router.push('/')}>Back to dashboard</Button>
        </div>
      </div>
    </div>
  );
}
