"use client";

import { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import type { AdminUser } from "@/types";

interface DashboardLayoutClientProps {
  children: ReactNode;
  user: AdminUser | null;
}

function DashboardContent({ children, user }: DashboardLayoutClientProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={`min-h-screen transition-all duration-300 ${
          isCollapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
      >
        <Header user={user} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  return (
    <SidebarProvider>
      <DashboardContent user={user}>{children}</DashboardContent>
    </SidebarProvider>
  );
}
