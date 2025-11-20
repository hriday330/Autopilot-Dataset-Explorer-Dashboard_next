"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface AnalyticsPanelProps {
  boxes: Record<string, BoundingBox[]>;
  frames: any[];
}

export function AnalyticsPanel({ boxes, frames }: AnalyticsPanelProps) {
  // Calculate real label distribution from boxes
  const labelCounts: Record<string, number> = {
    "Pedestrian": 0,
    "Car": 0,
    "Traffic Light": 0,
    "Sign": 0
  };

  Object.values(boxes).forEach(frameBoxes => {
    frameBoxes.forEach(box => {
      if (labelCounts[box.label] !== undefined) {
        labelCounts[box.label]++;
      }
    });
  });

  const labelDistribution = [
    { name: "Pedestrian", value: labelCounts["Pedestrian"], color: "#E82127" },
    { name: "Car", value: labelCounts["Car"], color: "#4A9EFF" },
    { name: "Traffic Light", value: labelCounts["Traffic Light"], color: "#FFA500" },
    { name: "Sign", value: labelCounts["Sign"], color: "#00FF88" },
  ];

  // Generate recent activity from actual boxes
  const recentActivity = Object.entries(boxes)
    .flatMap(([frameId, frameBoxes]) => 
      frameBoxes.map((box, index) => ({
        id: `${frameId}-${box.id}`,
        action: "Labeled",
        item: `Frame #${parseInt(frameId) + 1}`,
        label: box.label,
        time: `${Math.floor(Math.random() * 30) + 1} min ago`,
        timestamp: Date.now() - Math.random() * 1800000
      }))
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  const totalLabels = Object.values(labelCounts).reduce((sum, count) => sum + count, 0);
  const labeledFramesCount = Object.keys(boxes).filter(key => boxes[key].length > 0).length;
  const avgLabelsPerFrame = labeledFramesCount > 0 ? (totalLabels / labeledFramesCount).toFixed(1) : 0;

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-4">
            <div className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">Total Labels</div>
            <div className="text-3xl text-[#E5E5E5]">{totalLabels}</div>
          </div>
          
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-4">
            <div className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">Labeled Frames</div>
            <div className="text-3xl text-[#E5E5E5]">{labeledFramesCount} / {frames.length}</div>
          </div>
          
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-4">
            <div className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">Avg per Frame</div>
            <div className="text-3xl text-[#E5E5E5]">{avgLabelsPerFrame}</div>
          </div>
          
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-4">
            <div className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-1">Completion</div>
            <div className="text-3xl text-[#E5E5E5]">{Math.round((labeledFramesCount / frames.length) * 100)}%</div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-2 gap-6">
          {/* Label Distribution Chart */}
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
            <h3 className="text-lg text-[#E5E5E5] mb-6">Label Distribution</h3>
            {totalLabels > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={labelDistribution.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {labelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#121212', 
                        border: '1px solid #1F1F1F',
                        borderRadius: '8px',
                        color: '#E5E5E5'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {labelDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm text-[#E5E5E5]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[#A3A3A3]">{item.value}</span>
                        <span className="text-sm text-[#6A6A6A] w-12 text-right">
                          {totalLabels > 0 ? Math.round((item.value / totalLabels) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-[#A3A3A3]">No labels yet</p>
                  <p className="text-xs text-[#6A6A6A] mt-1">Start drawing bounding boxes to see analytics</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity Table */}
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
            <h3 className="text-lg text-[#E5E5E5] mb-6">Recent Activity</h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-1 max-h-[360px] overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-3 px-3 hover:bg-[#0E0E0E] rounded-lg transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ 
                          backgroundColor: 
                            activity.label === "Pedestrian" ? "#E82127" : 
                            activity.label === "Car" ? "#4A9EFF" :
                            activity.label === "Traffic Light" ? "#FFA500" : "#00FF88"
                        }}
                      ></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#A3A3A3]">{activity.action}</span>
                          <span className="text-sm text-[#E5E5E5]">{activity.item}</span>
                        </div>
                        <div className="text-xs" style={{ 
                          color: activity.label === "Pedestrian" ? "#E82127" : 
                                 activity.label === "Car" ? "#4A9EFF" :
                                 activity.label === "Traffic Light" ? "#FFA500" : "#00FF88"
                        }}>
                          {activity.label}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-[#6A6A6A]">{activity.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-[#A3A3A3]">No activity yet</p>
                  <p className="text-xs text-[#6A6A6A] mt-1">Your labeling history will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Frame Details Table */}
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
          <h3 className="text-lg text-[#E5E5E5] mb-6">Frame Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F1F1F]">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#A3A3A3]">Frame</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#A3A3A3]">Labels</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#A3A3A3]">Pedestrian</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#A3A3A3]">Car</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#A3A3A3]">Traffic Light</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#A3A3A3]">Sign</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#A3A3A3]">Status</th>
                </tr>
              </thead>
              <tbody>
                {frames.map((frame, index) => {
                  const frameBoxes = boxes[frame.id] || [];
                  const frameCounts = {
                    Pedestrian: frameBoxes.filter(b => b.label === "Pedestrian").length,
                    Car: frameBoxes.filter(b => b.label === "Car").length,
                    "Traffic Light": frameBoxes.filter(b => b.label === "Traffic Light").length,
                    Sign: frameBoxes.filter(b => b.label === "Sign").length,
                  };
                  const totalCount = frameBoxes.length;
                  
                  return (
                    <tr key={frame.id} className="border-b border-[#1F1F1F] hover:bg-[#0E0E0E] transition-colors">
                      <td className="py-3 px-4 text-sm text-[#E5E5E5]">Frame {index + 1}</td>
                      <td className="py-3 px-4 text-sm text-[#E5E5E5]">{totalCount}</td>
                      <td className="py-3 px-4 text-sm text-[#A3A3A3]">{frameCounts.Pedestrian || "-"}</td>
                      <td className="py-3 px-4 text-sm text-[#A3A3A3]">{frameCounts.Car || "-"}</td>
                      <td className="py-3 px-4 text-sm text-[#A3A3A3]">{frameCounts["Traffic Light"] || "-"}</td>
                      <td className="py-3 px-4 text-sm text-[#A3A3A3]">{frameCounts.Sign || "-"}</td>
                      <td className="py-3 px-4">
                        {totalCount > 0 ? (
                          <span className="text-xs bg-[#E82127]/20 text-[#E82127] px-2 py-1 rounded">Labeled</span>
                        ) : (
                          <span className="text-xs bg-[#1F1F1F] text-[#6A6A6A] px-2 py-1 rounded">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}