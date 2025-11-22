"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@components/ui/command";
import { Button } from "@components/ui/button";

type Dataset = {
  id: string;
  name: string;
};

type Props = {
  datasets: Dataset[];
  counts: Record<string, number>;
  selected: string;
  onSelect: (id: string) => void;
};

export default function DatasetSelector({
  datasets,
  counts,
  selected,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedDataset = useMemo(
    () => datasets.find((d) => d.id === selected) ?? null,
    [datasets, selected],
  );

  return (
    <div className="mb-6">
      <div className="text-sm text-[#A3A3A3] mb-2">
        Select an existing dataset
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-[#1A1A1A] border-[#333] text-[#E5E5E5]"
          >
            {selectedDataset
              ? `${selectedDataset.name} (${counts[selectedDataset.id] ?? 0} files)`
              : "Select a dataset"}
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-[#111] border border-[#333] text-[#E5E5E5] max-w-md">
          <DialogHeader>
            <DialogTitle>Select a dataset</DialogTitle>
          </DialogHeader>

          <Command className="bg-[#111] text-[#E5E5E5] mt-4">
            <CommandInput
              placeholder="Search datasets..."
              className="
                bg-[#111] 
                text-[#E5E5E5] 
                placeholder:text-[#666] 
                border border-[#333]
              "
            />

            <CommandList className="max-h-80 overflow-y-auto bg-[#111]">
              <CommandEmpty>No dataset found.</CommandEmpty>

              <CommandGroup>
                {datasets.map((ds) => (
                  <CommandItem
                    key={ds.id}
                    onSelect={() => {
                      onSelect(ds.id);
                      setOpen(false);
                    }}
                    className="
                      flex justify-between items-center
                      hover:bg-[#222]
                      cursor-pointer
                    "
                  >
                    <span>{ds.name}</span>
                    <span className="text-xs text-[#A3A3A3]">
                      {counts[ds.id] ?? 0} files
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
