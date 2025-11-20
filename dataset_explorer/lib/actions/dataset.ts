"use server";
import { supabaseServer } from "@lib/supabaseServer";
import { revalidatePath } from "next/cache";
export interface Dataset {
  id: string;
  name: string;
  created_at?: string;
}

export interface ImageThumbnail {
  id: string;
  url: string;
  storage_path: string;
}

export interface FetchDatasetsResult {
  datasets: Dataset[];
  counts: Record<string, number>;
  error?: string;
}

export interface FetchImagesResult {
  thumbnails: ImageThumbnail[];
  total: number;
  error?: string;
}

// Create a new dataset
export async function createDatasetAction(name: string, userId: string) {
  try {
    const { error } = await supabaseServer
      .from('datasets')
      .insert([{ name, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/datasets");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

// Delete an image
export async function deleteImageAction(imageId: string, storagePath: string) {
  try {
    // Delete DB record
    const { error: delErr } = await supabaseServer.from('images').delete().eq('id', imageId);
    if (delErr) throw delErr;

    // Try to remove from storage
    try {
      await supabaseServer.storage.from('datasets').remove([storagePath]);
    } catch (e) {
      console.warn('Storage remove failed:', e);
    }

    revalidatePath("/datasets");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}