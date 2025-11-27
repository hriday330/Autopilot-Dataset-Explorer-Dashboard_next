"use client";

import { Alert, AlertDescription } from "@components/ui/alert";
import DatasetSelector from "@components/DatasetsPage/DatasetSelector";
import DatasetCreation from "@components/DatasetsPage/DatasetCreation";
import FileUploader from "@components/ui/file-uploader";
import Spinner from "@components/ui/spinner";
import { Progress } from "@components/ui/progress";
import { Button } from "@components/ui/button";
import { X } from "lucide-react";

export function DatasetControlsCard({
  datasets,
  counts,
  selected,
  setSelected,
  newName,
  setNewName,
  handleCreateDataset,
  handleUploadFiles,
  uploading,
  uploadProgress,
  processingZip,
  user,
  message,
  dismissMessage,
  setThumbnails,
  setImagesTotal,
  cache,
}: any) {
  return (
    <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
      <h2 className="text-2xl text-white mb-4">Your datasets</h2>

      {message && message.type !== "success" && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className={`
            relative mb-4
            ${
              message.type === "error"
                ? "border-red-600/50 bg-red-950/40 text-red-300"
                : "border-blue-600/50 bg-blue-950/40 text-blue-300"
            }
          `}
        >
          <Button
            onClick={dismissMessage}
            variant="ghost"
            size="icon"
            className="
              absolute right-2 top-2
              h-6 w-6 p-0
              text-[#9CA3AF] hover:text-white
              bg-transparent hover:bg-transparent
            "
          >
            <X size={14} />
          </Button>

          <AlertDescription className="pr-10">
            {message.message}
          </AlertDescription>
        </Alert>
      )}

      <DatasetSelector
        datasets={datasets}
        counts={counts}
        selected={selected}
        onSelect={setSelected}
      />

      <DatasetCreation
        newName={newName}
        setNewName={setNewName}
        onCreate={handleCreateDataset}
      />

      <FileUploader
        onSelect={async (files) => {
          const ds = datasets.find((d: any) => d.id === selected);
          if (!ds || !user) return;

          await handleUploadFiles(
            files,
            selected,
            ds.name,
            user.id,
            (newThumbnails: any[]) => {
              setThumbnails((prev: any[]) => [...newThumbnails, ...prev]);
              setImagesTotal((prev: number) => prev + newThumbnails.length);
              cache.invalidate(selected);
            }
          );
        }}
        accept="image/*,.zip"
        maxFiles={1}
        allowZip={true}
        uploading={uploading}
        label="Upload Image or ZIP"
        description="Upload one image or a ZIP containing multiple images."
      />

      {uploading && <Progress className="my-2" value={uploadProgress * 100} />}

      {processingZip && (
        <div className="flex items-center gap-2 text-sm text-[#A3A3A3] my-4">
          <Spinner />
          <span>Processing ZIP file, this may take a moment...</span>
        </div>
      )}
    </div>
  );
}
