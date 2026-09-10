import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  );
}
