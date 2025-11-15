"use client";

import React, { useEffect, useState, useTransition, useRef } from "react";
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
import DatasetImageGrid from "../../components/DatasetImageGrid";

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
  // Cache thumbnails and totals per dataset to avoid refetch/render delay when switching
  const thumbnailsCache = useRef<Record<string, ImageThumbnail[]>>({});
  const totalsCache = useRef<Record<string, number>>({});

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

    // If we have a cached first-page, show it immediately for snappy UI
    if (page === 1 && thumbnailsCache.current[datasetId]) {
      setThumbnails(thumbnailsCache.current[datasetId]);
      setImagesTotal(totalsCache.current[datasetId] ?? 0);

      // Refresh in background and update cache/state if different
      startTransition(async () => {
        const result = await fetchImagesForDatasetAction(datasetId, page, perPage);
        if (!result.error) {
          // Update cache and state only if data changed
          const cached = thumbnailsCache.current[datasetId] || [];
          const same = cached.length === result.thumbnails.length && cached.every((c, i) => c.id === result.thumbnails[i]?.id);
          thumbnailsCache.current[datasetId] = result.thumbnails;
          totalsCache.current[datasetId] = result.total;
          if (!same) {
            setThumbnails(result.thumbnails);
          }
          setImagesTotal(result.total);
        }
      });

      return;
    }

    setThumbnails([]);
    startTransition(async () => {
      const result = await fetchImagesForDatasetAction(datasetId, page, perPage);
      if (result.error) {
        setMessage(`Error loading images: ${result.error}`);
        setThumbnails([]);
        setImagesTotal(0);
      } else {
        setThumbnails(result.thumbnails);
        setImagesTotal(result.total);
        // Cache first page for snappy switching
        if (page === 1) {
          thumbnailsCache.current[datasetId] = result.thumbnails;
          totalsCache.current[datasetId] = result.total;
        }
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

        {/* Thumbnail Grid (extracted) */}
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
      </div>
    </div>
  );
}
