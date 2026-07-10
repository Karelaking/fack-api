import * as React from "react";
import { getProjects } from "@/lib/actions/projects";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumbs } from "@/components/dashboard/DashboardBreadcrumbs";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { HeaderActions } from "@/components/dashboard/HeaderActions";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Dashboard Shell Layout.
 * Uses shadcn/ui Sidebar primitives to construct a collapsible navigation drawer.
 * Automatically fetches the active project list from SQLite using a Server Action.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const projects = await getProjects();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Sidebar component */}
        <DashboardSidebar initialProjects={projects} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="h-14 border-b border-border flex items-center px-4 justify-between shrink-0 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9" />
              <Separator orientation="vertical" className="h-4" />
              <DashboardBreadcrumbs projects={projects} />
            </div>
            <HeaderActions />
          </header>
          <div className="flex-1 overflow-auto bg-background pb-14 md:pb-0">
            {children}
          </div>
          <MobileBottomNav />
        </main>
      </div>
    </SidebarProvider>
  );
}
