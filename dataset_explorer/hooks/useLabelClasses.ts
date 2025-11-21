import { supabase } from "@lib/supabaseClient";
import { Label } from "@lib/types";
import { useEffect, useState } from "react";

export function useLabelClasses(datasetId: string | null) {
  const [labels, setLabels] = useState<Label[]>([]);

  useEffect(() => {
    if (!datasetId) return;

    supabase
      .from("label_classes")
      .select("*")
      .eq("dataset_id", datasetId)
      .order("order_index")
      .then(({ data }) => setLabels(data || []));
  }, [datasetId]);

  return labels;
}
