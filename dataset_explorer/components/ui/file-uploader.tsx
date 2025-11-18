"use client";

import { useState } from "react";
import { Button } from "./button";

interface FileUploaderProps {
  onSelect: (files: FileList) => void | Promise<void>;
  accept?: string;
  maxFiles?: number;
  allowZip?: boolean;
  uploading?: boolean;
  label?: string;
  description?: string;
}

export default function FileUploader({
  onSelect,
  accept = "*/*",
  maxFiles = 1,
  allowZip = false,
  uploading = false,
  label = "Upload File",
  description,
}: FileUploaderProps) {
  const [error, setError] = useState("");

  const handleChange = async (files: FileList | null) => {
    setError("");
    if (!files || files.length === 0) return;

    
    if (files.length > maxFiles) {
      setError(
        maxFiles === 1
          ? "Please select only one file."
          : `You can upload up to ${maxFiles} files.`
      );
      return;
    }

    const file = files[0];

    if (file.name.toLowerCase().endsWith(".zip") && !allowZip) {
      setError("ZIP files are not allowed here.");
      return;
    }

    await onSelect(files);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden input */}
      <input
        id="ui-file-uploader"
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => handleChange(e.target.files)}
      />

      {/* Main button */}
      <Button
        className="bg-[#E82127]"
        onClick={() => document.getElementById("ui-file-uploader")?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : label}
      </Button>

      {/* Description */}
      {description && (
        <div className="text-xs text-[#6B6B6B]">{description}</div>
      )}

      {/* Validation error */}
      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
}
