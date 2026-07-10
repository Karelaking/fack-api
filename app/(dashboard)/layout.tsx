import * as React from "react";
import Link from "next/link";
import { FolderKanban, Plus, Settings, Terminal, Activity, FileText } from "lucide-react";
import { getProjects } from "@/lib/actions/projects";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="flex flex-row items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <Terminal className="h-5 w-5 text-primary" />
              <span>Fack API&apos;s</span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workspaces
              </SidebarGroupLabel>
              <SidebarGroupContent className="mt-1.5">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<Link href="/" />}>
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      <span>All Projects</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Active Projects</span>
              </SidebarGroupLabel>
              <SidebarGroupContent className="mt-1.5">
                {projects.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground italic">
                    No projects created yet.
                  </div>
                ) : (
                  <SidebarMenu className="space-y-0.5">
                    {projects.map((proj) => (
                      <SidebarMenuItem key={proj.id}>
                        <SidebarMenuButton render={<Link href={`/projects/${proj.slug}/canvas`} />}>
                          <span className="truncate">{proj.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border flex flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground font-mono truncate">v0.1.0 (SQLite)</div>
            <ThemeToggle />
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="h-14 border-b border-border flex items-center px-4 justify-between shrink-0 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9" />
              <Separator orientation="vertical" className="h-4" />
              <div className="text-sm font-medium text-muted-foreground">Workspace Shell</div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" passHref>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Project</span>
                </Button>
              </Link>
            </div>
          </header>
          <div className="flex-1 overflow-auto bg-background p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
