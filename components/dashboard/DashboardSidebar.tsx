"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  RiFolderSharedLine,
  RiAddLine,
  RiLoader2Line,
  RiGitBranchLine,
  RiPulseLine,
  RiFileHistoryLine,
  RiSettings2Line,
  RiFileCopyLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { createProject } from "@/lib/actions/projects";
import type { Project } from "@/db/schema";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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

  const [selectedRoute, setSelectedRoute] = React.useState<{
    id: string;
    path: string;
    method: string;
    mockUrl: string;
  } | null>(null);

  // Sync projects list when server list updates
  React.useEffect(() => {
    const handleSelected = (e: Event) => {
      const customEvent = e as CustomEvent;
      setSelectedRoute(customEvent.detail);
    };

    window.addEventListener("route-selected", handleSelected);
    return () => window.removeEventListener("route-selected", handleSelected);
  }, []);
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
          <SidebarGroup className="mt-1">
            <SidebarGroupLabel className="text-muted-foreground flex items-center justify-between px-2 text-[10px] font-semibold tracking-wider uppercase">
              <span>Active Projects</span>
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground h-5 w-5"
                title="Create Project"
                aria-label="Create Project"
                onClick={() => setDialogOpen(true)}
              >
                <RiAddLine className="h-3.5 w-3.5" />
              </Button>
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
                          <span className="truncate font-semibold">{proj.name}</span>
                        </SidebarMenuButton>

                        {isProjectActive && (
                          <div className="ml-3.5 mt-1 border-l border-border/60 pl-2.5 space-y-1 py-1">
                            {[
                              {
                                name: "Canvas",
                                path: "canvas",
                                icon: RiGitBranchLine,
                              },
                              {
                                name: "Endpoints",
                                path: "endpoints",
                                icon: RiPulseLine,
                              },
                              {
                                name: "Logs",
                                path: "logs",
                                icon: RiFileHistoryLine,
                              },
                              {
                                name: "Settings",
                                path: "settings",
                                icon: RiSettings2Line,
                              },
                            ].map((subItem) => {
                              const Icon = subItem.icon;
                              const isSubActive = pathname.endsWith(`/${subItem.path}`);
                              return (
                                <Link
                                  key={subItem.path}
                                  href={`/projects/${proj.slug}/${subItem.path}`}
                                  className={cn(
                                    "flex items-center gap-2 rounded px-2.5 py-1 text-xs font-medium transition-all select-none",
                                    isSubActive
                                      ? "bg-primary/10 text-primary font-semibold"
                                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                                  )}
                                >
                                  <Icon className="h-3.5 w-3.5 shrink-0" />
                                  <span>{subItem.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Dynamic Selected Route Links Section */}
          {selectedRoute && (
            <SidebarGroup className="mt-3 border-t border-border/60 pt-3">
              <SidebarGroupLabel className="text-foreground/90 flex items-center justify-between px-2 text-[10px] font-bold tracking-wider uppercase">
                <span>Selected Route Link</span>
              </SidebarGroupLabel>
              <div className="px-2 py-2 space-y-3.5">
                {/* Method & Path Display */}
                <div className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-lg p-2">
                  <span className={cn(
                    "px-2 py-0.5 text-[9.5px] font-extrabold rounded-md uppercase tracking-wider shrink-0",
                    selectedRoute.method.toUpperCase() === "GET" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                    selectedRoute.method.toUpperCase() === "POST" && "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                    selectedRoute.method.toUpperCase() === "PUT" && "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                    selectedRoute.method.toUpperCase() === "DELETE" && "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20",
                    selectedRoute.method.toUpperCase() === "PATCH" && "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20",
                  )}>
                    {selectedRoute.method}
                  </span>
                  <span className="text-[11px] font-mono font-bold truncate text-foreground flex-1">
                    {selectedRoute.path}
                  </span>
                </div>

                {/* Base Link (Copyable Input-like box) */}
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block px-0.5">Mock URL</span>
                  <div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-md p-1.5 shadow-xs">
                    <span className="text-[11px] font-mono font-bold text-foreground truncate select-all flex-1 pl-1 leading-normal">
                      {selectedRoute.mockUrl}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded"
                      title="Copy URL"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(selectedRoute.mockUrl);
                          toast.success("Mock link copied!");
                        } catch {
                          toast.error("Failed to copy link");
                        }
                      }}
                    >
                      <RiFileCopyLine className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Query Parameters Helper List */}
                <div className="space-y-1.5">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block px-0.5">Query Parameters</span>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5 border rounded-lg bg-muted/20 p-2 border-border/50">
                    {[
                      { param: "?limit=5", desc: "Limit output array items" },
                      { param: "?q=search", desc: "Global text search" },
                      { param: "?page=2&limit=5", desc: "Paginate mock output" },
                      { param: "?sort=id&order=desc", desc: "Sort records" },
                      { param: "?field=value", desc: "Exact field match" },
                    ].map((opt, oIdx) => {
                      const optUrl = `${selectedRoute.mockUrl}${opt.param}`;
                      return (
                        <div key={oIdx} className="flex items-center justify-between gap-2 px-1.5 py-1 rounded-md hover:bg-background transition-colors border border-transparent hover:border-border/30">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-mono text-[9.5px] font-bold text-primary truncate leading-normal">{opt.param}</span>
                            <span className="text-muted-foreground text-[8px] truncate leading-normal">{opt.desc}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 rounded"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(optUrl);
                                toast.success(`Copied parameter URL`);
                              } catch {
                                toast.error("Failed to copy link");
                              }
                            }}
                          >
                            <RiFileCopyLine className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SidebarGroup>
          )}
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
