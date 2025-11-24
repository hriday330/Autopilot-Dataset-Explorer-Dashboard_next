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


type AnalyticsHeatmapBucket = {
  x_bucket: number | null;
  y_bucket: number | null;
  count: number;
};

type BoxSizeDistributionItem = {
  label: string;
  avg_width: number | null;
  avg_height: number | null;
  min_width: number | null;
  min_height: number | null;
  max_width: number | null;
  max_height: number | null;
};

type LabelsPerFrameItem = {
  frame_id: string; // UUID as string
  total: number;
};

type LabelFrequencyItem = {
  label: string;
  count: number;
};

type FrameMissingLabelItem = {
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