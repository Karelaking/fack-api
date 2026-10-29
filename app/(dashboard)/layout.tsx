import * as React from "react";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CommandMenu } from "@/components/command-menu";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RootSidebar } from "@/components/dashboard/RootSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { HeaderNewProjectButton } from "@/components/dashboard/HeaderNewProjectButton";

export const dynamic = "force-dynamic";

/** Authenticated surfaces are never useful as search results. */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard root layout.
 * Includes a simple sidebar base structure.
 *
 * Auth is enforced here (resource-based) rather than by path matching in the
 * proxy, so every page in this route group is protected.
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  await auth.protect();

  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="bg-background flex h-dvh w-full max-w-full overflow-hidden">
          <RootSidebar />

          {/* Main Content Area */}
          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
            <header className="border-border/10 bg-background/60 absolute inset-x-0 top-0 z-10 flex h-14 items-center border-b px-4 backdrop-blur-md sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
              <div className="flex flex-1 items-center justify-start">
                <SidebarTrigger className="-ml-1 h-8 w-8" />
              </div>

              <div className="flex flex-1 items-center justify-end">
                <HeaderNewProjectButton />
              </div>
            </header>
            <div className="flex-1 overflow-auto pt-14 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
              {children}
            </div>
            <MobileBottomNav />
          </main>
        </div>
        <CreateProjectDialog />
        <CommandMenu />
      </SidebarProvider>
    </AuthProvider>
  );
}
