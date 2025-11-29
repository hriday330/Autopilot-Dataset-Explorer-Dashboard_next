"use client";

import { useState } from "react";
import { Check, ChevronDown, FolderOpen, Plus } from "lucide-react";

import { cn } from "@components/ui/utils";
import { useDataset } from "@contexts/DatasetContext";
import { useUser } from "@contexts/AuthContext";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@components/ui/command";
import { useRouter } from "next/navigation";

export function DatasetPicker() {
  const [open, setOpen] = useState(false);

  const { user } = useUser();
  const { datasets, counts, selected, setSelected } = useDataset();

  const router = useRouter();
  const selectedDataset = datasets.find((d) => d.id === selected);

  const handleSelect = (id: string) => {
    setSelected(id);
    setOpen(false);
  };

  const handleCreateDataset = async () => {
    if (!user) return; // TODO - prompt user to sign in OR redirect to login page
    router.push("/datasets");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "h-9 px-3 py-2 text-sm flex items-center gap-2",
          "bg-[#1A1A1A] border-[#2A2A2A] text-[#D4D4D4]",
          "hover:bg-[#222]",
        )}
      >
        <FolderOpen className="w-4 h-4 text-[#D4D4D4]" />
        <span className="max-w-[140px] truncate">
          {selectedDataset ? selectedDataset.name : "Select dataset"}
        </span>
        <ChevronDown className="w-4 h-4 opacity-70" />
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-[260px] bg-[#0E0E0E] border border-[#2A2A2A]"
        align="end"
        sideOffset={8}
      >
        <Command className="bg-[#0E0E0E]">
          <CommandInput
            placeholder="Search datasets..."
            className="text-[#D4D4D4] placeholder:text-[#555]"
          />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-[#777]">
              No datasets found.
            </CommandEmpty>

            <CommandGroup
              heading="Datasets"
              className="max-h-[220px] overflow-y-auto"
            >
              {datasets.map((d) => (
                <CommandItem
                  key={d.id}
                  value={d.name}
                  onSelect={() => handleSelect(d.id)}
                  className="flex items-center justify-between px-3 py-2 text-[#D4D4D4] hover:bg-[#1A1A1A]"
                >
                  <span className="truncate">{d.name}</span>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#777]">
                      {counts[d.id] ?? 0}
                    </span>
                    {selected === d.id && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator className="bg-[#2A2A2A]" />

            <CommandGroup>
              <CommandItem
                onSelect={handleCreateDataset}
                className="flex items-center gap-2 px-3 py-2 text-[#D4D4D4] hover:bg-[#1A1A1A]"
              >
                <Plus className="w-4 h-4" />
                <span>Create new dataset</span>
              </CommandItem>
              <CommandItem
                onSelect={() => router.push("/datasets")}
                className="flex items-center gap-2 px-3 py-2 text-[#D4D4D4] hover:bg-[#1A1A1A]"
              >
                <Plus className="w-4 h-4" />
                <span>Manage your dataset</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
