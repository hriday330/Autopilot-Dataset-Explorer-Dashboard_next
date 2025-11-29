"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { fetchDatasetsAction, createDatasetAction } from "@lib/actions/dataset";

import type { Dataset, OperationMessage } from "@lib/types";

export type DatasetContextValue = {
  datasets: Dataset[];
  counts: Record<string, number>;
  selected: string;
  setSelected: (id: string) => void;
  message: OperationMessage;
  setMessage: (msg: OperationMessage) => void;
  loadDatasets: (userId: string) => Promise<void>;
  setDatasets: (datasets: Dataset[]) => void;
  createDataset: (name: string, userId: string) => Promise<void>;
  setCounts: (counts: Record<string, number>) => void;
  isPending: boolean;
};

const DatasetContext = createContext<DatasetContextValue | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string>("");
  const [message, setMessage] = useState<OperationMessage>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  const loadDatasets = async (userId: string): Promise<void> => {
    if (!userId) return;

    setIsPending(true);
    const result = await fetchDatasetsAction(userId);
    setIsPending(false);

    if (result.error) {
      setMessage({ type: "error", message: result.error });
      setDatasets([]);
      setCounts({});
      return;
    }

    setDatasets(result.datasets);
    setCounts(result.counts);

    if (!selected && result.datasets.length > 0) {
      const saved = localStorage.getItem("selectedDatasetId");

      if (saved && result.datasets.some((d) => d.id === saved)) {
        setSelected(saved);
      } else {
        setSelected(result.datasets[0].id);
      }
    }
  };

  const createDataset = async (name: string, userId: string): Promise<void> => {
    if (!name || !userId) return;

    const result = await createDatasetAction(name, userId);

    if (result.error) {
      setMessage({ type: "error", message: result.error });
      return;
    }

    setMessage({ type: "success", message: "Dataset created" });

    setSelected(result.dataset.id);
    await loadDatasets(userId);
  };

  useEffect(() => {
    if (!selected) return;

    document.cookie = `selectedDatasetId=${selected}; path=/; max-age=${
      60 * 60 * 24 * 30
    }`;
  }, [selected]);

  const value: DatasetContextValue = useMemo(
    () => ({
      datasets,
      setDatasets,
      counts,
      selected,
      setSelected,
      message,
      setMessage,
      loadDatasets,
      createDataset,
      setCounts,
      isPending,
    }),
    [datasets, counts, selected, message, isPending],
  );

  return (
    <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
  );
}

export function useDataset(): DatasetContextValue {
  const ctx = useContext(DatasetContext);

  if (!ctx) {
    throw new Error("useDataset must be used within a DatasetProvider");
  }

  return ctx;
}
