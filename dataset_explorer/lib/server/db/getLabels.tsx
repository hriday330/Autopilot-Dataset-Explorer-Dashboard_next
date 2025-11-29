import type { Label } from "@lib/types";
import { createSupabaseServerClient } from "../supabaseClient";

interface LabelsResult {
  data: Label[];
}

/**
 * Fetch all label classes for a given dataset.
 *
 * @param datasetId - The dataset ID
 */


export async function getLabels(
  datasetId: string | undefined
): Promise<LabelsResult> {
  if (!datasetId) {
    return { data: [] };
  }

  const supabaseServer = await createSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("labels")
    .select("*")
    .eq("dataset_id", datasetId);

  if (error) {
    console.error("Error fetching labels:", error);
    return { data: [] };
  }

  return { data: data ?? [] };
}
