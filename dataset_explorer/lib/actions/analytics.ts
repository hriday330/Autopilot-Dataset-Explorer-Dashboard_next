import { supabase } from "@lib/supabaseClient";

export async function getDatasetAnalytics(datasetId: string | null) {
  if (!datasetId) {
    return { data: null, error: "No dataset selected" };
  }

  const { data, error } = await supabase.rpc("get_dataset_analytics", {
    p_dataset_id: datasetId,
  });

  if (error) {
    console.error("Analytics RPC error:", error);
    throw error;
  }

  return data as DatasetAnalytics;
}


export interface DatasetAnalytics {
  totalFrames: number;
  totalLabeledFrames: number;
  totalBoxes: number;

  labelsPerFrame: {
    frame_id: string;
    frame_index: number;
    total: number;
  }[];

  labelFrequency: {
    label: string;
    count: number;
  }[];

  framesMissingLabel: {
    label: string;
    frame_id: string;
    frame_index: number;
  }[];

  boxSizeDistribution: {
    label: string;
    avg_width: number;
    avg_height: number;
    min_width: number;
    min_height: number;
    max_width: number;
    max_height: number;
  }[];

  heatmap: {
    x_bucket: number;
    y_bucket: number;
    count: number;
  }[];
}
