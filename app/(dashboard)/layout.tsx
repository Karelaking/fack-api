import * as React from "react";
import { getProjects } from "@/lib/actions/projects";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumbs } from "@/components/dashboard/DashboardBreadcrumbs";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { HeaderNewProjectButton } from "@/components/dashboard/HeaderNewProjectButton";
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
      <div className="bg-background flex h-screen w-screen overflow-hidden">
        {/* Sidebar component */}
        <DashboardSidebar initialProjects={projects} />

        {/* Main Content Area */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="border-border bg-card flex h-14 shrink-0 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9" />
              <Separator orientation="vertical" className="h-4" />
              <DashboardBreadcrumbs projects={projects} />
            </div>
            <HeaderNewProjectButton />
          </header>
          <div className="bg-background flex-1 overflow-auto pb-14 md:pb-0">
            {children}
          </div>
          <MobileBottomNav />
        </main>
      </div>
    </SidebarProvider>
  );
}
