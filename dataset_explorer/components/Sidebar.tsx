"use client";

import { Box, Tag, Layers } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { useState } from "react";
import { Label } from "@lib/types";
interface SidebarProps {
  selectedLabelId: string;
  onLabelIdSelect: (label: string) => void;
  labels: Label[];
}

export function Sidebar({ selectedLabelId, onLabelIdSelect, labels }: SidebarProps) {
  const [activeLabels, setActiveLabels] = useState<string[]>(labels.map(l => l.id));
  const [activeTool, setActiveTool] = useState("Bounding Box");

  const labelingTools = [
    { name: "Bounding Box", icon: Box },
    { name: "Classification", icon: Tag },
    { name: "Bulk Label Mode", icon: Layers },
  ];

  const shortcuts = [
    { keys: ["←", "→"], description: "Navigate frames" },
    { keys: ["↑", "↓"], description: "Select labels" },
    { keys: ["1-9"], description: "Quick label" },
    { keys: ["Space"], description: "Play/Pause" },
  ];

  const toggleLabel = (id: string) => {
    setActiveLabels(prev =>
      prev.includes(id)
        ? prev.filter(l => l !== id)
        : [...prev, id]
    );
  };

  return (
    <aside className="w-[260px] bg-[#0E0E0E] border-r border-[#1F1F1F] flex flex-col">
      {/* Tools */}
      <div className="p-4 border-b border-[#1F1F1F]">
        <h3 className="text-xs uppercase tracking-wider text-[#A3A3A3] mb-3">Labeling Tools</h3>
        <div className="space-y-2">
          {labelingTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.name;
            return (
              <Button
                key={tool.name}
                variant={isActive ? "default" : "outline"}
                className={`w-full justify-start gap-2 ${
                  isActive
                    ? "bg-[#E82127] hover:bg-[#D01F25] text-white border-0"
                    : "bg-transparent hover:bg-[#1F1F1F] text-[#E5E5E5] border-[#1F1F1F]"
                }`}
                onClick={() => setActiveTool(tool.name)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tool.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div className="p-4 border-b border-[#1F1F1F]">
        <h3 className="text-xs uppercase tracking-wider text-[#A3A3A3] mb-3">Active Labels</h3>

        <div className="space-y-3">
          {labels.map((label) => {
            const isActive = activeLabels.includes(label.id);
            const isSelected = selectedLabelId === label.id;

            return (
              <div key={label.id} className="flex items-center gap-2">
                <Checkbox
                  id={label.id}
                  checked={isActive}
                  onCheckedChange={() => {
                    toggleLabel(label.id);
                    onLabelIdSelect(label.id);
                  }}
                  className={isActive ? "border-[#E82127] data-[state=checked]:bg-[#E82127]" : "border-[#1F1F1F]"}
                />

                <label
                  htmlFor={label.id}
                  className={`text-sm cursor-pointer ${
                    isSelected ? "text-[#E82127]" : isActive ? "text-[#E5E5E5]" : "text-[#A3A3A3]"
                  }`}
                >
                  {label.name}
                  {isSelected && " ●"}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shortcuts */}
      <div className="p-4 flex-1">
        <h3 className="text-xs uppercase tracking-wider text-[#A3A3A3] mb-3">Keyboard Shortcuts</h3>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-xs text-[#A3A3A3]">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, i) => (
                  <kbd
                    key={i}
                    className="px-2 py-0.5 bg-[#1F1F1F] border border-[#2A2A2A] rounded text-xs text-[#E5E5E5]"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}