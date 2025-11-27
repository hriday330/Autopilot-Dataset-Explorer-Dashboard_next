import type { Metadata } from "next";
import "@styles/globals.css";
import { AuthProvider } from "@contexts/AuthContext";
import { ReactQueryProvider } from "@contexts/ReactQueryContext";
import { Toaster } from "sonner";
import { NetworkIndicator } from "@components/General/NetworkIndicator";
import { DatasetProvider } from "@contexts/DatasetContext";

export const metadata: Metadata = {
  title: "DataPilot",
  description:
    "All-in-one dataset labeling tool with interactive bounding box annotation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DatasetProvider>
          <ReactQueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster position="top-right" richColors closeButton />
            <NetworkIndicator/>
          </ReactQueryProvider>
        </DatasetProvider>
      </body>
    </html>
  );
}
