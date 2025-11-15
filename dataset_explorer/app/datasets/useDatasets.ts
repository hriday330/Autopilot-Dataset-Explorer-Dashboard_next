"use client";

import { useState, useTransition } from "react";
import { fetchDatasetsAction, type Dataset } from "./actions";

export function useDatasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadDatasets = (userId: string, selectedId?: string, onSelect?: (id: string) => void) => {
    if (!userId) return;
    setMessage(null);
    startTransition(async () => {
      const result = await fetchDatasetsAction(userId);
      if (result.error) {
        setMessage(`Error: ${result.error}`);
        setDatasets([]);
        setCounts({});
      } else {
        setDatasets(result.datasets);
        setCounts(result.counts);
        if (!selectedId && result.datasets.length > 0 && onSelect) {
          onSelect(result.datasets[0].id);
        }
      }
    });
  };

  return {
    datasets,
    counts,
    message,
    setMessage,
    loadDatasets,
    isPending,
  };
}
