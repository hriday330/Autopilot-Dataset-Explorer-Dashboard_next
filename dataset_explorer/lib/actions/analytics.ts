import { supabase } from "@lib/supabaseClient";

export async function getDatasetAnalytics(datasetId: string | null) {
  if (!datasetId) {
    return { data: null, error: "No dataset selected" };
  }

  let { data, error } = await supabase
    .rpc('dataset_analytics', {
        datasetid: datasetId
    })
    if (error) console.error(error)
    else console.log(data)


  if (error) {
    console.error("Analytics RPC error:", error);
    throw error;
  }

  return data as DatasetAnalytics;
}


export type AnalyticsHeatmapBucket = {
  x_bucket: number;
  y_bucket: number;
  count: number;
};

export type BoxSizeDistributionItem = {
  label: string;
  avg_width: number;
  avg_height: number;
  min_width: number;
  min_height: number;
  max_width: number;
  max_height: number;
};

export type LabelsPerFrameItem = {
  frame_id: string; // UUID as string
  total: number;
};

export type LabelFrequencyItem = {
  label: string;
  count: number;
};

export type FrameMissingLabelItem = {
  label: string;
  frame_id: string; // UUID as string
};

export type DatasetAnalytics = {
  totalFrames: number;
  totalLabeledFrames: number;
  totalBoxes: number;
  labelsPerFrame: LabelsPerFrameItem[] | null;
  labelFrequency: LabelFrequencyItem[] | null;
  framesMissingLabel: FrameMissingLabelItem[] | null;
  boxSizeDistribution: BoxSizeDistributionItem[] | null;
  heatmap: AnalyticsHeatmapBucket[] | null;
};