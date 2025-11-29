import { Suspense } from "react";
import { DashboardContent } from "./DashboardContent";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#0E0E0E]">
          <div className="text-[#A3A3A3]">Loading dashboard...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
