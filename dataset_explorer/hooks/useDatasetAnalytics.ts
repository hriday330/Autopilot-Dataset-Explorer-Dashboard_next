"use client";

import { useEffect, useState } from "react";
import { DatasetAnalytics, getDatasetAnalytics } from "@lib/actions/analytics"

export function useDatasetAnalytics(datasetId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);

    getDatasetAnalytics(datasetId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [datasetId]);

  return { data, loading } as { data: DatasetAnalytics, loading: boolean};
}
