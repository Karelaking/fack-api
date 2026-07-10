"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderKanban, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createProject } from "@/lib/actions/projects";
import type { Project } from "@/db/schema";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DashboardSidebarProps {
  initialProjects: Project[];
}

export function DashboardSidebar({ initialProjects }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = React.useState<Project[]>(initialProjects);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Sync projects list when server list updates
  React.useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Listen for global open-new-project event
  React.useEffect(() => {
    const handleOpen = () => setDialogOpen(true);
    window.addEventListener("open-new-project-dialog", handleOpen);
    return () => window.removeEventListener("open-new-project-dialog", handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setLoading(true);
    try {
      const newProj = await createProject({
        name: name.trim(),
        description: description.trim(),
        slug: slug.trim() || undefined,
      });
      toast.success(`Project "${newProj.name}" created successfully!`);
      setProjects([newProj, ...projects]);
      setDialogOpen(false);
      setName("");
      setSlug("");
      setDescription("");
      router.push(`/projects/${newProj.slug}/canvas`);
      router.refresh();
    } catch (err) {
      toast.error("Failed to create project");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Sidebar className="border-r border-border bg-card">
        <SidebarHeader className="flex flex-row items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <img src="/logo.png" alt="Fack API's Logo" className="h-6 w-6 rounded-md object-cover" />
            <span>Fack API&apos;s</span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Workspaces</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                title="Create Workspace"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-1">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === "/dashboard"}
                    render={<Link href="/dashboard" />}
                  >
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    <span>All Projects</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-3">
            <SidebarGroupLabel className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Active Projects
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-1">
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground italic">
                  No projects created yet.
                </div>
              ) : (
                <SidebarMenu className="space-y-0.5">
                  {projects.map((proj) => {
                    const isProjectActive = pathname.startsWith(`/projects/${proj.slug}`);
                    return (
                      <SidebarMenuItem key={proj.id}>
                        <SidebarMenuButton
                          isActive={isProjectActive}
                          render={<Link href={`/projects/${proj.slug}/canvas`} />}
                        >
                          <span className="truncate">{proj.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-border flex flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground font-mono truncate">v0.1.0 (SQLite)</div>
          <ThemeToggle />
        </SidebarFooter>
      </Sidebar>

      {/* New Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>New Workspace</DialogTitle>
              <DialogDescription>
                Create a new isolated project namespace for your mock routes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="sidebar-proj-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="sidebar-proj-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Billing Service"
                  maxLength={100}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="sidebar-proj-slug" className="text-sm font-medium">
                  Namespace Slug
                </label>
                <Input
                  id="sidebar-proj-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., billing-service"
                  maxLength={100}
                  disabled={loading}
                />
                <span className="text-[10px] text-muted-foreground">
                  Determines mock base URL: `/mock/{"{slug || \"slug-derived-from-name\"}"}`. Lowercase with hyphens.
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="sidebar-proj-description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="sidebar-proj-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Mocking stripe endpoints for dev"
                  maxLength={500}
                  disabled={loading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-1.5">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Create Workspace</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
