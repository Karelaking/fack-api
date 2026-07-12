"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RiFolderSharedLine, RiAddLine, RiLoader2Line } from "@remixicon/react";
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
import Image from "next/image";

const slugifyInput = (val: string) => {
  return val
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-/]/g, "")
    .replace(/\/+/g, "/");
};

interface DashboardSidebarProps {
  initialProjects: Project[];
}

export function DashboardSidebar({
  initialProjects,
}: DashboardSidebarProps): React.JSX.Element {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjects(initialProjects);
  }, [initialProjects]);

  // Listen for global open-new-project event
  React.useEffect(() => {
    const handleOpen = () => setDialogOpen(true);
    window.addEventListener("open-new-project-dialog", handleOpen);
    return () =>
      window.removeEventListener("open-new-project-dialog", handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    const cleanedSlug = slug.trim() ? slug.trim().replace(/^\/+|\/+$/g, "") : undefined;
    if (cleanedSlug && !/^[a-z0-9_/-]+$/.test(cleanedSlug)) {
      toast.error("Slug must be lowercase alphanumeric with hyphens, underscores, or slashes");
      return;
    }

    setLoading(true);
    try {
      const newProj = await createProject({
        name: name.trim(),
        description: description.trim(),
        slug: cleanedSlug,
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
      <Sidebar className="border-border bg-card border-r">
        <SidebarHeader className="flex flex-row items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight"
          >
            <Image
              src="/logo-v2.png"
              alt="Fack API's Logo"
              width={24}
              height={24}
              className="h-6 w-6 rounded-md object-cover"
            />
            <span>Fack API&apos;s</span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground flex items-center justify-between px-2 text-[10px] font-semibold tracking-wider uppercase">
              <span>Workspaces</span>
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground h-5 w-5"
                title="Create Workspace"
                aria-label="Create Workspace"
                onClick={() => setDialogOpen(true)}
              >
                <RiAddLine className="h-3.5 w-3.5" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-1">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === "/dashboard"}
                    render={<Link href="/dashboard" />}
                  >
                    <RiFolderSharedLine className="text-muted-foreground h-4 w-4" />
                    <span>All Projects</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-3">
            <SidebarGroupLabel className="text-muted-foreground px-2 text-[10px] font-semibold tracking-wider uppercase">
              Active Projects
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-1">
              {projects.length === 0 ? (
                <div className="text-muted-foreground px-3 py-2 text-xs italic">
                  No projects created yet.
                </div>
              ) : (
                <SidebarMenu className="space-y-0.5">
                  {projects.map((proj) => {
                    const isProjectActive = pathname.startsWith(
                      `/projects/${proj.slug}`,
                    );
                    return (
                      <SidebarMenuItem key={proj.id}>
                        <SidebarMenuButton
                          isActive={isProjectActive}
                          render={
                            <Link href={`/projects/${proj.slug}/canvas`} />
                          }
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

        <SidebarFooter className="border-border flex flex-row items-center justify-between gap-4 border-t p-3">
          <div className="text-muted-foreground truncate font-mono text-xs">
            v0.1.0 (SQLite)
          </div>
          <ThemeToggle />
        </SidebarFooter>
      </Sidebar>

      {/* New Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>New Workspace</DialogTitle>
              <DialogDescription>
                Create a new isolated project namespace for your mock routes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="sidebar-proj-name"
                  className="text-sm font-medium"
                >
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
                <label
                  htmlFor="sidebar-proj-slug"
                  className="text-sm font-medium"
                >
                  Namespace Slug
                </label>
                <Input
                  id="sidebar-proj-slug"
                  value={slug}
                  onChange={(e) => setSlug(slugifyInput(e.target.value))}
                  placeholder="e.g., billing-service"
                  maxLength={100}
                  disabled={loading}
                />
                <span className="text-muted-foreground text-[10px]">
                  Determines mock base URL: `/
                  {'{slug || "slug-derived-from-name"}'}`. Lowercase with
                  hyphens.
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="sidebar-proj-description"
                  className="text-sm font-medium"
                >
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-1.5">
                {loading && <RiLoader2Line className="h-4 w-4 animate-spin" />}
                <span>Create Workspace</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
