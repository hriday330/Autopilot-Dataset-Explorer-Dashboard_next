"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

interface DeleteConfirmDialogProps {
  children: React.ReactNode; // the delete icon/button
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export default function DeleteConfirmDialog({
  children,
  onConfirm,
  title = "Delete Image?",
  description = "This action cannot be undone. This will permanently delete the image from this dataset.",
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>

      <AlertDialogContent className="border-red-700/40 bg-[#1a0f0f]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-400">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-red-300/80">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-[#333] border-[#444] text-gray-200">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
