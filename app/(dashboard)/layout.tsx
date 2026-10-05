import * as React from "react";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { CommandMenu } from "@/components/command-menu";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard & Workspace layout.
 * Wraps dashboard routes in a clean interface without the redundant sidebar.
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <>
      <div className="bg-background flex h-screen w-full max-w-full overflow-hidden">
        {/* Main Content Area */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="bg-background flex-1 overflow-auto pb-14 md:pb-0">
            {children}
          </div>
          <MobileBottomNav />
        </main>
      </div>
      <CreateProjectDialog />
      <CommandMenu />
    </>
  );
}
