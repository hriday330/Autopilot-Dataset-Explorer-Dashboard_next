import { supabase } from "./supabaseClient";


export function createProcessEntry({
  datasetId,
  datasetName,
  userId,
  totalFiles,
  onFileUploaded,
  onFileFailed,
  updateProgress,
  maxRetries = 3,
  retryDelay = 500, // ms
}: {
  datasetId: string;
  datasetName: string;
  userId: string;
  totalFiles: number;
  onFileUploaded: (paths: string[]) => void;
  onFileFailed: (entry: { name: string; blob: Blob, reason?: string }) => void;
  updateProgress: (percent: number) => void;
  maxRetries?: number;
  retryDelay?: number;
}) {
  let completed = 0;

  async function uploadWithRetry(storagePath: string, blob: Blob) {
    let attempts = 0;

    while (attempts < maxRetries) {
      const { error } = await supabase.storage
        .from("datasets")
        .upload(storagePath, blob);

      if (!error) {
        return true;
      }

      attempts++;

      // progressive delay
      await new Promise((res) =>
        setTimeout(res, retryDelay * Math.pow(2, attempts - 1))
      );
    }

    return false;
  }

  return async function processEntry(entry: { name: string; blob: Blob }) {
    const { name, blob } = entry;
    const filename = name.split("/").pop()!;
    const storagePath = `${userId}/${datasetName}/${filename}`;

    const success = await uploadWithRetry(storagePath, blob);

    if (!success) {
      onFileFailed({...entry, reason: "Upload failed after retries"}); // collect failed uploads for reporting or retrying
    } else {
      onFileUploaded([storagePath]);
    }

    completed++;
    updateProgress(Math.round((completed / totalFiles) * 100));
  };
}
