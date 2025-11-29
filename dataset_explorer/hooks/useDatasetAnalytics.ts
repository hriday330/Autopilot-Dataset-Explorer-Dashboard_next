"use client";

import { useEffect, useState } from "react";
import { DatasetAnalytics, getDatasetAnalytics } from "@lib/actions/analytics";

export function useDatasetAnalytics(datasetId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = () => {
    if (!datasetId) return;
    setLoading(true);

    getDatasetAnalytics(datasetId)
      .then(setData)
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchAnalytics();
  }, [datasetId]);

  return { data, loading, fetchAnalytics } as {
    data: DatasetAnalytics;
    loading: boolean;
    fetchAnalytics: () => void;
  };
}
