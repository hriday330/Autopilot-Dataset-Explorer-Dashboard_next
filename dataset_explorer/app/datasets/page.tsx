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

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetchDatasets();
  }, [user]);

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

        <div className="mt-6">
          <Button variant="outline" className="border-[#1F1F1F] text-[#A3A3A3]" onClick={() => router.push('/')}>Back to dashboard</Button>
        </div>
      </div>
    </div>
  );
}
