"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../components/AuthProvider";
import { Button } from "../../components/ui/button";

export default function DatasetsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [datasets, setDatasets] = useState<Array<{ id: string; name: string; created_at?: string }>>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string>(""); // selected dataset id
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [imagesPage, setImagesPage] = useState(1);
  const [imagesPerPage] = useState(12);
  const [imagesTotal, setImagesTotal] = useState(0);
  const [thumbnails, setThumbnails] = useState<Array<{ id: string; url: string; storage_path: string }>>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetchDatasets();
  }, [user]);

  useEffect(() => {
    // whenever selected dataset or page changes, load thumbnails
    if (!selected) {
      setThumbnails([]);
      setImagesTotal(0);
      return;
    }
    fetchImagesForDataset(selected, imagesPage, imagesPerPage);
  }, [selected, imagesPage, imagesPerPage]);

  const fetchDatasets = async () => {
    setMessage(null);
    try {
      // Fetch datasets from DB table 'datasets' for this user
      const { data: dsData, error: dsError } = await supabase
        .from('datasets')
        .select('id,name,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (dsError) throw dsError;

      const countsMap: Record<string, number> = {};
      const dsList = (dsData ?? []).map((d: any) => ({ id: d.id, name: d.name, created_at: d.created_at }));

      // For each dataset, count images in images table
      for (const d of dsList) {
        try {
          const { count, error: countErr } = await supabase
            .from('images')
            .select('id', { count: 'exact', head: true })
            .eq('dataset_id', d.id);
          if (countErr) {
            countsMap[d.id] = 0;
          } else {
            countsMap[d.id] = count ?? 0;
          }
        } catch (e) {
          countsMap[d.id] = 0;
        }
      }

      setDatasets(dsList);
      setCounts(countsMap);
      if (!selected && dsList.length > 0) setSelected(dsList[0].id);
    } catch (err: any) {
      console.error(err);
      setMessage('Error fetching datasets: ' + (err?.message ?? String(err)));
    }
  };

  // Fetch images for a given dataset with pagination
  const fetchImagesForDataset = async (datasetId: string, page: number, perPage: number) => {
    try {
      setThumbnails([]);
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      const { data, error, count } = await supabase
        .from('images')
        .select('id,storage_path,created_at', { count: 'exact' })
        .eq('dataset_id', datasetId)
        .order('created_at', { ascending: false })
        .range(from, to as number);
      if (error) throw error;

      setImagesTotal(count ?? 0);

      if (!data || data.length === 0) {
        setThumbnails([]);
        return;
      }

      // For each image, create a signed URL (short-lived) for the thumbnail display
      const thumbs: Array<{ id: string; url: string; storage_path: string }> = [];
      for (const img of data) {
        try {
          // createSignedUrl returns data with signedUrl or signedURL depending on client version
          const path = img.storage_path;
          const signed = await supabase.storage.from('datasets').createSignedUrl(path, 60);
          let url = '';
          if ((signed as any).data?.signedUrl) url = (signed as any).data.signedUrl;
          else if ((signed as any).data?.signedURL) url = (signed as any).data.signedURL;
          else if ((signed as any).publicURL) url = (signed as any).publicURL;
          else if ((signed as any).data?.publicUrl) url = (signed as any).data.publicUrl;
          thumbs.push({ id: img.id, url, storage_path: path });
        } catch (e) {
          thumbs.push({ id: img.id, url: '', storage_path: img.storage_path });
        }
      }

      setThumbnails(thumbs);
    } catch (err: any) {
      console.error('Error fetching images for dataset', err);
      setMessage('Error loading images: ' + (err?.message ?? String(err)));
    }
  };

  const deleteImage = async (imageId: string, storagePath: string) => {
    if (!confirm('Delete this image? This will remove it from the dataset.')) return;
    setDeletingIds(prev => [...prev, imageId]);
    setMessage(null);
    try {
      // Delete DB record
      const { error: delErr } = await supabase.from('images').delete().eq('id', imageId);
      if (delErr) throw delErr;

      // Try to remove from storage as well
      try {
        const { error: rmErr } = await supabase.storage.from('datasets').remove([storagePath]);
        if (rmErr) {
          console.warn('Failed to remove storage object:', rmErr.message);
        }
      } catch (e) {
        console.warn('Storage remove error', e);
      }

      setMessage('Image deleted');
      // Refresh images and dataset counts
      await fetchImagesForDataset(selected, imagesPage, imagesPerPage);
      await fetchDatasets();
    } catch (err: any) {
      console.error('Error deleting image', err);
      setMessage('Delete error: ' + (err?.message ?? String(err)));
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== imageId));
    }
  };

  const createDataset = async () => {
    if (!newName || !user) return;
    setMessage(null);
    try {
      // Insert dataset record into DB
      const { data: insertData, error: insertError } = await supabase
        .from('datasets')
        .insert([{ name: newName, user_id: user.id }])
        .select()
        .single();
      if (insertError) throw insertError;
      setNewName("");
      await fetchDatasets();
      setMessage('Dataset created');
    } catch (err: any) {
      console.error(err);
      setMessage('Error creating dataset: ' + (err?.message ?? String(err)));
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user || !selected) return;
    setUploading(true);
    setMessage(null);
    try {
      // Find selected dataset
      const ds = datasets.find(d => d.id === selected);
      if (!ds) throw new Error('Selected dataset not found');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storagePath = `${user.id}/${ds.name}/${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('datasets').upload(storagePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        // Try to get image dimensions
        const getImageSize = (f: File) => new Promise<{ width: number; height: number }>((resolve) => {
          const url = URL.createObjectURL(f);
          const img = new Image();
          img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            URL.revokeObjectURL(url);
            resolve({ width: w, height: h });
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({ width: 0, height: 0 });
          };
          img.src = url;
        });

        const { width, height } = await getImageSize(file);

        // Insert image record in images table (schema: dataset_id, storage_path, width, height)
        const imageRecord = {
          dataset_id: ds.id,
          storage_path: storagePath,
          width: width || null,
          height: height || null
        };
        const { error: imgErr } = await supabase.from('images').insert([imageRecord]);
        if (imgErr) {
          console.warn('Uploaded to storage but failed to insert DB record', imgErr.message);
        }
      }
      setMessage('Upload complete');
      await fetchDatasets();
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
            <Button onClick={createDataset} className="bg-[#E82127]">Create</Button>
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
                      onClick={() => deleteImage(t.id, t.storage_path)}
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
