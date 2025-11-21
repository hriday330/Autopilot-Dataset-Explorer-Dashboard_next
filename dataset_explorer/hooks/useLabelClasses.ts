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

      const tempId = crypto.randomUUID();

      // 1) Compute next index based on current labels
      const nextIndex =
        labels.length > 0
          ? Math.max(...labels.map((l) => l.order_index ?? 0)) + 1
          : 0;

      const optimistic: Label = {
        id: tempId,
        dataset_id: datasetId,
        name,
        color: color ?? "#ffffff",
        order_index: nextIndex,
        created_at: new Date().toISOString(),
      };

      // 2) Optimistically add to state
      setLabels((prev) => [...prev, optimistic]);

      // 3) Persist to Supabase and get real row back
      const { data, error } = await supabase
        .from("label_classes")
        .insert({
          dataset_id: datasetId,
          name,
          color,
          order_index: nextIndex,
        })
        .select("*")
        .single();

      if (error) {
        // 4a) Roll back optimistic label
        setError(error.message);
        setLabels((prev) => prev.filter((l) => l.id !== tempId));
        return;
      }

      // 4b) Replace temp label with real DB row
      setLabels((prev) =>
        prev.map((l) => (l.id === tempId ? (data as Label) : l)),
      );
    },
    [datasetId, labels],
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
    [loadLabels],
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
    [loadLabels],
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
    [loadLabels],
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
