"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { Dialog, DialogContent, DialogTitle } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@lib/types";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { HexColorPicker } from "react-colorful";

interface ManageLabelsModalProps {
  open: boolean;
  onClose: () => void;

  labels: Label[];
  createLabel: (name: string) => Promise<Label | void>;
  updateLabel: (id: string, updates: Partial<Label>) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  reorderLabels: (newOrder: string[]) => Promise<void>;
}

function SortableLabelRow({
  draft,
  setDraft,
  deleteLabel,
}: {
  draft: Label;
  setDraft: (updates: Partial<Label>) => void;
  deleteLabel: (id: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: draft.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [colorOpen, setColorOpen] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#141414] border border-[#262626]"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-[#555]">
        <GripVertical className="w-4 h-4" />
      </button>

      <Popover open={colorOpen} onOpenChange={setColorOpen}>
        <PopoverTrigger asChild>
          <button
            className="w-5 h-5 rounded-full border border-[#333]"
            style={{ backgroundColor: draft.color }}
          />
        </PopoverTrigger>

        <PopoverContent className="bg-[#0E0E0E] border border-[#1F1F1F] p-3 rounded-lg">
          <HexColorPicker
            color={draft?.color ?? "#E82127"}
            onChange={(newColor) => setDraft({ color: newColor })}
          />
        </PopoverContent>
      </Popover>

      <Input
        value={draft.name}
        onChange={(e) => setDraft({ name: e.target.value })}
        className="flex-1 bg-[#0E0E0E] border-[#333] text-white"
      />

      <button
        onClick={() => deleteLabel(draft.id)}
        className="p-1 text-red-400 hover:text-red-300"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}


export function ManageLabelsModal({
  open,
  onClose,
  labels,
  createLabel,
  updateLabel,
  deleteLabel,
  reorderLabels,
}: ManageLabelsModalProps) {
  const [localLabels, setLocalLabels] = useState<Label[]>(labels);
  const [localOrder, setLocalOrder] = useState<string[]>(
    labels.map((l) => l.id),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Sync when modal opens / labels change
  useEffect(() => {
    if (open) {
      setLocalLabels(labels);
      setLocalOrder(labels.map((l) => l.id));
    }
  }, [open, labels]);

  const updateLocal = (id: string, updates: Partial<Label>) => {
    setLocalLabels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );
  };

  const addLabel = async (name: string) => {
    const newLabel = await createLabel(name);
    if (newLabel) {
      setLocalLabels((prev) => [...prev, newLabel]);
      setLocalOrder((prev) => [...prev, newLabel.id]);
    }
  };

  const handleDragEnd = ({ active, over }: any) => {
    if (!over || active.id === over.id) return;

    const oldIndex = localOrder.indexOf(active.id);
    const newIndex = localOrder.indexOf(over.id);

    setLocalOrder((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const handleSaveAll = async () => {
    // 1) Apply label edits
    const updates = localLabels.filter((local) => {
      const original = labels.find((l) => l.id === local.id);
      return (
        original &&
        (original.name !== local.name || original.color !== local.color)
      );
    });

    // batch update individually
    for (const u of updates) {
      await updateLabel(u.id, { name: u.name, color: u.color });
    }

    // 2) Apply ordering
    await reorderLabels(localOrder);

    // 3) Close modal
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0E0E0E] border border-[#1F1F1F] max-w-lg p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F1F]">
          <DialogTitle className="text-white text-lg font-medium">
            Manage Labels
          </DialogTitle>
          <button onClick={onClose} className="text-[#A3A3A3] hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-5 max-h-[65vh] overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localOrder}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localOrder.map((id) => {
                  const draft = localLabels.find((l) => l.id === id);
                  if (!draft) return null;

                  return (
                    <SortableLabelRow
                      key={id}
                      draft={draft}
                      setDraft={(updates) => updateLocal(id, updates)}
                      deleteLabel={deleteLabel}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add label */}
          <AddLabelRow onAdd={addLabel} />
        </div>

        <div className="flex justify-end p-4 border-t border-[#1F1F1F]">
          <Button
            onClick={handleSaveAll}
            className="bg-[#E82127] hover:bg-[#D01F25] text-white"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddLabelRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="flex gap-2 pt-3 border-t border-[#1F1F1F]">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New label name"
        className="flex-1 bg-[#0E0E0E] text-white border-[#333]"
      />

      <Button
        onClick={() => {
          if (name.trim()) onAdd(name.trim());
          setName("");
        }}
        className="bg-[#E82127] hover:bg-[#D01F25] text-white"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
