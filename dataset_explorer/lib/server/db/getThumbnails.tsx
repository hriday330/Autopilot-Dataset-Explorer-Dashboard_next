import type { ImageThumbnail } from "@lib/types";
import { createSupabaseServerClient } from "@lib/server/supabaseClient";

interface ThumbnailsResult {
  data: ImageThumbnail[];
  count: number;
}

/**
 * Fetch paginated image thumbnails for a dataset.
 */
export async function getThumbnails(
  datasetId: string | undefined,
  page: number,
  pageSize: number
): Promise<ThumbnailsResult> {
  if (!datasetId) {
    return { data: [], count: 0 };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabaseServer = await createSupabaseServerClient();

  const { data, count, error } = await supabaseServer
    .from("images")
    .select("id, width, height, storage_path", { count: "exact" })
    .eq("dataset_id", datasetId)
    .range(from, to);

  if (error) {
    console.error("Error fetching thumbnails:", error.message);
    return { data: [], count: 0 };
  }

  const thumbnails: ImageThumbnail[] =
    data?.map((img: any) => ({
      id: img.id,
      url: img.url,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
      storage_path: img.storage_path,
    })) ?? [];

  return {
    data: thumbnails,
    count: count ?? 0,
  };
}
