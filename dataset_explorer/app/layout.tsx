import type { Metadata } from "next";
import "../styles/globals.css";
import { AuthProvider } from "@components/AuthProvider";
import { ReactQueryProvider } from "../lib/tanstackQueryProvider";

export const metadata: Metadata = {
  title: "Autopilot Dataset Explorer",
  description: "AI-powered dataset labeling tool with interactive bounding box annotation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
