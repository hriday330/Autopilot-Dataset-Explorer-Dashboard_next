"use client";

import { DashboardHeader } from "@components/DashboardHeader";
import { Sidebar } from "@components/Sidebar";
import { ImageViewer } from "@components/ImageViewer";
import { AnalyticsPanel } from "@components/AnalyticsPanel";
import { DashboardFooter } from "@components/DashboardFooter";
import { useState, useEffect } from "react";

interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export default function Page() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState("Pedestrian");
  const [boxes, setBoxes] = useState<Record<number, BoundingBox[]>>({});
  const [currentView, setCurrentView] = useState<"labeling" | "analytics">("labeling");

  const frames = [
    {
      id: 0,
      url: "https://images.unsplash.com/photo-1693541684739-e714db2637e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjB2aWV3JTIwY2FtZXJhfGVufDF8fHx8MTc2MzA2NDc3MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      speed: "45 mph",
      timestamp: "2024-11-13 14:23:17",
      confidence: "94.7%"
    },
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1709441895333-072d26b103e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXNoY2FtJTIwY2l0eSUyMHN0cmVldHxlbnwxfHx8fDE3NjMwNjUxNjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      speed: "38 mph",
      timestamp: "2024-11-13 14:23:18",
      confidence: "91.2%"
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1677667402044-a1e5f5956124?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHRyYWZmaWMlMjByb2FkfGVufDF8fHx8MTc2MzA2NTE2MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      speed: "52 mph",
      timestamp: "2024-11-13 14:23:19",
      confidence: "96.3%"
    }
  ];

  // Load saved labels from localStorage on mount
  useEffect(() => {
    const savedLabels = localStorage.getItem('autopilot-labels');
    if (savedLabels) {
      try {
        setBoxes(JSON.parse(savedLabels));
      } catch (error) {
        console.error('Error loading saved labels:', error);
      }
    }
  }, []);

  // Save labels to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('autopilot-labels', JSON.stringify(boxes));
  }, [boxes]);

  const handlePrevFrame = () => {
    setCurrentFrame((prev) => (prev > 0 ? prev - 1 : frames.length - 1));
  };

  const handleNextFrame = () => {
    setCurrentFrame((prev) => (prev < frames.length - 1 ? prev + 1 : 0));
  };

  const handleExportData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalFrames: frames.length,
      labeledFrames: Object.keys(boxes).filter(key => boxes[parseInt(key)].length > 0).length,
      frames: frames.map(frame => ({
        frameId: frame.id,
        imageUrl: frame.url,
        metadata: {
          speed: frame.speed,
          timestamp: frame.timestamp,
          confidence: frame.confidence
        },
        annotations: boxes[frame.id] || []
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `autopilot-dataset-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all labels? This cannot be undone.')) {
      setBoxes({});
      localStorage.removeItem('autopilot-labels');
    }
  };

  const labeledFramesCount = Object.keys(boxes).filter(key => boxes[parseInt(key)].length > 0).length;

  return (
    <div className="h-screen flex flex-col bg-[#0E0E0E] overflow-hidden">
      <DashboardHeader 
        onExport={handleExportData} 
        onClear={handleClearData}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          selectedLabel={selectedLabel} 
          onLabelSelect={setSelectedLabel}
          frames={frames}
          boxes={boxes}
          currentFrame={currentFrame}
          onFrameSelect={setCurrentFrame}
        />
        
        <div className="flex-1 flex flex-col overflow-auto">
          {currentView === "labeling" ? (
            <ImageViewer 
              frame={frames[currentFrame]}
              frameNumber={currentFrame + 1}
              totalFrames={frames.length}
              selectedLabel={selectedLabel}
              onPrevFrame={handlePrevFrame}
              onNextFrame={handleNextFrame}
              boxes={boxes}
              setBoxes={setBoxes}
            />
          ) : (
            <AnalyticsPanel boxes={boxes} frames={frames} />
          )}
        </div>
      </div>
      
      <DashboardFooter 
        labeledCount={labeledFramesCount}
        totalCount={frames.length}
      />
    </div>
  );
}
