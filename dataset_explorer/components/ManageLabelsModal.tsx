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
  createLabel: (name: string) => Promise<void>;
  updateLabel: (id: string, updates: Partial<Label>) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  reorderLabels: (newOrder: string[]) => Promise<void>;
}

function SortableLabelRow({
  label,
  updateLabel,
  deleteLabel,
}: {
  label: Label;
  updateLabel: (id: string, updates: Partial<Label>) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: label.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [open, setOpen] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#141414] border border-[#262626]"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#555]"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Color Picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="w-5 h-5 rounded-full border border-[#333]"
            style={{ backgroundColor: label.color ?? "#ffffff" }}
          />
        </PopoverTrigger>

        <PopoverContent
          side="right"
          className="bg-[#0E0E0E] border border-[#1F1F1F] p-3 rounded-lg"
        >
          <HexColorPicker
            color={label.color ?? "#ffffff"}
            onChange={(newColor) => updateLabel(label.id, { color: newColor })}
            className="color-picker"
          />
        </PopoverContent>
      </Popover>

      {/* Editable name */}
      <Input
        value={label.name}
        onChange={(e) => updateLabel(label.id, { name: e.target.value })}
        className="flex-1 bg-[#0E0E0E] border-[#333] text-white"
      />

      {/* Delete button */}
      <button
        onClick={() => deleteLabel(label.id)}
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
  const [newLabelName, setNewLabelName] = useState("");
  const [localOrder, setLocalOrder] = useState(labels.map((l) => l.id));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 }}));

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return;
    await createLabel(newLabelName.trim());
    setNewLabelName("");
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localOrder.indexOf(active.id);
    const newIndex = localOrder.indexOf(over.id);

    const newOrder = arrayMove(localOrder, oldIndex, newIndex);
    setLocalOrder(newOrder);

    await reorderLabels(newOrder);
  };

  useEffect(() => {
    setLocalOrder(labels.map((l) => l.id));
    }, [labels]);


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0E0E0E] border border-[#1F1F1F] max-w-lg p-0 overflow-hidden">
        
        {/* Header (single close button now) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F1F]">
          <DialogTitle className="text-white text-lg font-medium">
            Manage Labels
          </DialogTitle>

          <button onClick={onClose} className="text-[#A3A3A3] hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-5 max-h-[65vh] overflow-y-auto">

          {/* Sortable Label List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {localOrder.map((id) => {
                  const label = labels.find((l) => l.id === id);
                  if (!label) return null;

                  return (
                    <SortableLabelRow
                      key={label.id}
                      label={label}
                      updateLabel={updateLabel}
                      deleteLabel={deleteLabel}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add new label */}
          <div className="flex gap-2 pt-3 border-t border-[#1F1F1F]">
            <Input
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="New label name"
              className="flex-1 bg-[#0E0E0E] text-white border-[#333]"
            />

            <Button
              onClick={handleAddLabel}
              className="bg-[#E82127] hover:bg-[#D01F25] text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
