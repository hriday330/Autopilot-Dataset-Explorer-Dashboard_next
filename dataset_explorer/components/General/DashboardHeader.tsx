"use client";

import { User, Download, Trash2, Tag, BarChart3 } from "lucide-react";
import { Button } from "@components/ui/button";
import Link from "next/link";
import { useUser } from "@contexts/AuthContext";
import { DatasetPicker } from "./DatasetPicker";

interface DashboardHeaderProps {
  onExport: () => void;
  onClear: () => void;
  currentView: "labeling" | "analytics";
  onViewChange: (view: "labeling" | "analytics") => void;
}

export function DashboardHeader({
  onExport,
  onClear,
  currentView,
  onViewChange,
}: DashboardHeaderProps) {
  // Read auth state from context
  const { user, loading } = useUser();

  return (
    <header className="h-16 bg-[#121212] border-b border-[#1F1F1F] px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 min-w-[220px]">
          <div className="w-1 h-8 bg-[#E82127] rounded-full"></div>
          <h1 className="text-[#E5E5E5] tracking-tight">DataPilot</h1>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 bg-[#0E0E0E] border border-[#1F1F1F] rounded-lg p-1">
          <button
            onClick={() => onViewChange("labeling")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-sm ${
              currentView === "labeling"
                ? "bg-[#E82127] text-white"
                : "text-[#A3A3A3] hover:text-[#E5E5E5]"
            }`}
          >
            <Tag className="w-4 h-4" />
            Labeling
          </button>
          <button
            onClick={() => onViewChange("analytics")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-sm ${
              currentView === "analytics"
                ? "bg-[#E82127] text-white"
                : "text-[#A3A3A3] hover:text-[#E5E5E5]"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={onExport}
          className="bg-[#E82127] hover:bg-[#D01F25] text-white text-sm h-9 px-4"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Dataset
        </Button>

        <Button
          onClick={onClear}
          variant="outline"
          className="bg-transparent border-[#1F1F1F] hover:bg-[#1F1F1F] text-[#A3A3A3] hover:text-[#E5E5E5] text-sm h-9 px-4"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>

        <div className="w-px h-8 bg-[#1F1F1F]"></div>
        <DatasetPicker />
        {/* Profile: show sign-in button if not signed in */}
        {loading ? (
          <div className="p-2 bg-[#1F1F1F] rounded-lg w-9 h-9" />
        ) : !user ? (
          <Link href="/auth/login" className="text-sm">
            <Button className="bg-transparent border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#E5E5E5] h-9 px-3">
              Sign in
            </Button>
          </Link>
        ) : (
          <Link
            href="/profile"
            className="p-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] rounded-lg transition-colors"
          >
            <User className="w-5 h-5 text-[#E5E5E5]" />
          </Link>
        )}
      </div>
    </header>
  );
}
