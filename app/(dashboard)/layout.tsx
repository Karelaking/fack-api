import * as React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RootSidebar } from "@/components/dashboard/RootSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { HeaderNewProjectButton } from "@/components/dashboard/HeaderNewProjectButton";
import { CommandMenu } from "@/components/command-menu";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard root layout.
 * Includes a simple sidebar base structure.
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="bg-background flex h-screen w-full max-w-full overflow-hidden">
        <RootSidebar />

        {/* Main Content Area */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="border-border/10 flex h-14 shrink-0 items-center justify-between border-b px-6">
            <SidebarTrigger className="-ml-1 h-8 w-8" />
            <HeaderNewProjectButton />
          </header>
          <div className="bg-background flex-1 overflow-auto pb-14 md:pb-0">
            {children}
          </div>
          <MobileBottomNav />
        </main>
      </div>
      <CreateProjectDialog />
      <CommandMenu />
    </SidebarProvider>
  );
}
