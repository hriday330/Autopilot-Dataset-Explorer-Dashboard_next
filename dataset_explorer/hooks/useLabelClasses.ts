import { supabase } from "@lib/supabaseClient";
import { Label } from "@lib/types";
import { useEffect, useState, useCallback } from "react";

export function useLabelClasses(datasetId: string | null) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLabels = useCallback(async () => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("label_classes")
      .select("*")
      .eq("dataset_id", datasetId)
      .order("order_index");

    if (error) {
      setError(error.message);
    } else {
      setLabels(data || []);
    }

    setLoading(false);
  }, [datasetId]);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  const createLabel = useCallback(
    async (name: string, color?: string) => {
      if (!datasetId) return;

      // Compute last index for ordering
      const maxIndex =
        labels.length > 0
          ? Math.max(...labels.map((l) => l.order_index ?? 0))
          : 0;

      const { error } = await supabase.from("label_classes").insert({
        dataset_id: datasetId,
        name,
        color,
        order_index: maxIndex + 1,
      });

      if (error) {
        setError(error.message);
        return;
      }

      loadLabels();
    },
    [datasetId, labels, loadLabels]
  );

  const updateLabel = useCallback(
    async (labelId: string, updates: Partial<Label>) => {
      const { error } = await supabase
        .from("label_classes")
        .update(updates)
        .eq("id", labelId);

      if (error) {
        setError(error.message);
        return;
      }

      loadLabels();
    },
    [loadLabels]
  );

  const deleteLabel = useCallback(
    async (labelId: string) => {
      const { error } = await supabase
        .from("label_classes")
        .delete()
        .eq("id", labelId);

      if (error) {
        setError(error.message);
        return;
      }

      loadLabels();
    },
    [loadLabels]
  );

  const reorderLabels = useCallback(
    async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        order_index: index,
      }));

      const { error } = await supabase.from("label_classes").upsert(updates);

      if (error) {
        setError(error.message);
        return;
      }

      loadLabels();
    },
    [loadLabels]
  );

  return {
    labels,
    loading,
    error,
    createLabel,
    updateLabel,
    deleteLabel,
    reorderLabels,
    reload: loadLabels,
  };
}
