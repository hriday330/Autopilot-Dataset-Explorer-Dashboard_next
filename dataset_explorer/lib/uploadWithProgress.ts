export async function uploadWithProgress({
  file,
  datasetId,
  datasetName,
  userId,
  onProgress,
}: {
  file: File;
  datasetId: string;
  datasetName: string;
  userId: string;
  onProgress?: (percent: number) => void;
}) {
  
  const { uploadUrl, storagePath } = await fetch("/api/upload-url", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      userId,
      datasetName,
    }),
  }).then((r) => r.json());

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => resolve();
    xhr.onerror = reject;

    xhr.send(file);
  });

  const result = await fetch("/api/upload-finish", {
    method: "POST",
    body: JSON.stringify({
      datasetId,
      storagePath,
      isZip: false, // TODO: remove this server-side 
    }),
  }).then((r) => r.json());

  return result as {
    success: boolean;
    error?: string;
    thumbnails: { id: string; url: string; storage_path: string }[];
  };
}

type UploadResponse = {
  success: boolean;
  error?: string;
  thumbnails: { id: string; url: string; storage_path: string }[];
  isZip?: boolean;
  zipPath?: string;
};
