export function uploadWithProgress({
  url,
  formData,
  onProgress,
}: {
  url: string;
  formData: FormData;
  onProgress?: (percent: number) => void;
}) {
  return new Promise<UploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch (err) {
        reject(err);
      }
    };

    xhr.onerror = reject;

    xhr.send(formData);
  });
}

type UploadResponse = {
  success: boolean;
  error?: string;
  thumbnails: { id: string; url: string; storage_path: string }[];
  isZip?: boolean;
  zipPath?: string;
};
