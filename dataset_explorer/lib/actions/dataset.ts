"use server";

import { supabaseServer } from "@lib/supabaseServer"; // This is all server actions so supabaseServer MUST be used here
import { revalidatePath } from "next/cache";
import type { Dataset, ImageThumbnail } from "@lib/types";
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

// Fetch all datasets for a user
export async function fetchDatasetsAction(
  userId: string,
): Promise<FetchDatasetsResult> {
  try {
    const { data: dsData, error: dsError } = await supabaseServer
      .from("datasets")
      .select("id,name,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (dsError) throw dsError;

    const countsMap: Record<string, number> = {};
    const dsList = (dsData ?? []).map((d: any) => ({
      id: d.id,
      name: d.name,
      created_at: d.created_at,
    }));

    // For each dataset, count images
    for (const d of dsList) {
      try {
        const { count, error: countErr } = await supabaseServer
          .from("images")
          .select("id", { count: "exact", head: true })
          .eq("dataset_id", d.id);
        countsMap[d.id] = countErr ? 0 : (count ?? 0);
      } catch (e) {
        countsMap[d.id] = 0;
      }
    }

    return { datasets: dsList, counts: countsMap };
  } catch (err: any) {
    return { datasets: [], counts: {}, error: err?.message ?? String(err) };
  }
}

// Fetch paginated images for a dataset
export async function fetchImagesForDatasetAction(
  datasetId: string,
  page: number,
  perPage: number,
): Promise<FetchImagesResult> {
  try {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await supabaseServer
      .from("images")
      .select("id,storage_path,created_at", { count: "exact" })
      .eq("dataset_id", datasetId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { thumbnails: [], total: count ?? 0 };
    }

    const paths = data.map((img) => img.storage_path);
    const { data: signedURLs, error: signError } =
      await supabaseServer.storage
        .from("datasets")
        .createSignedUrls(paths, 3600);

    if (signError) throw signError;
    const thumbs: ImageThumbnail[] = data.map((img, i) => ({
      id: img.id,
      storage_path: img.storage_path,
      url: signedURLs?.[i]?.signedUrl ?? "",
    }));

    return { thumbnails: thumbs, total: count ?? 0 };

  } catch (err: any) {
    return { thumbnails: [], total: 0, error: err?.message ?? String(err) };
  }
}

// Create a new dataset
export async function createDatasetAction(name: string, userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from("datasets")
      .insert([{ name, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/datasets");
    return { success: true, dataset: data };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

// Delete an image
export async function deleteImageAction(imageId: string, storagePath: string) {
  try {
    // Delete DB record
    const { error: delErr } = await supabaseServer
      .from("images")
      .delete()
      .eq("id", imageId);
    if (delErr) throw delErr;

    // Try to remove from storage
    try {
      await supabaseServer.storage.from("datasets").remove([storagePath]);
    } catch (e) {
      console.warn("Storage remove failed:", e);
    }

    revalidatePath("/datasets");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

export async function deleteImagesAction(
  imageIds: string[],
  storagePaths: string[],
) {
  try {
    // 1. Delete DB records in one query
    const { error: dbErr } = await supabaseServer
      .from("images")
      .delete()
      .in("id", imageIds);

    if (dbErr) {
      return { success: false, error: dbErr.message };
    }

    // 2. Delete storage files in one operation
    const { error: storageErr } = await supabaseServer.storage
      .from("datasets")
      .remove(storagePaths);

    if (storageErr) {
      console.warn("Storage delete failed:", storageErr.message);
    }
    revalidatePath("/datasets");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}
