// processEntry.ts

import { supabase } from "./supabaseClient";
import { uploadWithProgress } from "./uploadWithProgress";
import type { ImageThumbnail } from "@lib/types";

export function createProcessEntry({
  datasetId,
  datasetName,
  userId,
  onFileUploaded,
  updateProgress,
  totalFiles,
}: {
  datasetId: string;
  datasetName: string;
  userId: string;
  totalFiles: number;
  onFileUploaded: (paths: string[]) => void;
  updateProgress: (percent: number) => void;
}) {
  let completed = 0;

  return async function processEntry(entry: { name: string; blob: Blob }) {
    const { name, blob } = entry;

    const filename = name.split("/").pop()!;
    const storagePath = `${userId}/${datasetName}/${filename}`;

    // Upload directly to Supabase Storage
    const { error } = await supabase.storage
      .from("datasets")
      .upload(storagePath, blob, { upsert: true });

    if (error) {
      throw new Error(error.message);
    }

    // Pass only storage path
    onFileUploaded([storagePath]);

    // Progress update
    completed++;
    updateProgress(Math.round((completed / totalFiles) * 100));
  };
}
