"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiTerminalBoxLine,
  RiCalendarLine,
  RiArrowRightLine,
  RiSearchLine,
  RiLoader2Line,
  RiDeleteBin6Line,
  RiAlertLine,
  RiSettings3Line,
  RiAddLine,
  RiStackLine,
  RiPulseLine,
  RiMagicLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { deleteProject, updateProject } from "@/lib/actions/projects";
import { formatRelativeTime } from "@/lib/utils";
import type { Project, Endpoint, Route } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProjectWithRelations = Project & {
  endpoints?: (Endpoint & {
    routes?: Route[];
  })[];
};

interface ProjectGridProps {
  initialProjects: ProjectWithRelations[];
}

/**
 * Premium dashboard component listing workspaces in a beautiful, grid-based card layout.
 * Features workspace stats, search filters, and active mock details.
 */
export function ProjectGrid({
  initialProjects,
}: ProjectGridProps): React.JSX.Element | null {
  const router = useRouter();
  const [projects, setProjects] =
    React.useState<ProjectWithRelations[]>(initialProjects);
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"updated" | "name">("updated");

  // Deletion states
  const [deleteProj, setDeleteProj] =
    React.useState<ProjectWithRelations | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Edit/Settings states
  const [editProj, setEditProj] = React.useState<ProjectWithRelations | null>(
    null,
  );
  const [editName, setEditName] = React.useState("");
  const [editSlug, setEditSlug] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editLoading, setEditLoading] = React.useState(false);

  // Sync initial projects
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjects(initialProjects);
  }, [initialProjects]);

  // Check URL parameter to trigger global open dialog
  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("new=true")
    ) {
      window.dispatchEvent(new CustomEvent("open-new-project-dialog"));
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  React.useEffect(() => {
    if (editProj) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditName(editProj.name);
      setEditSlug(editProj.slug);
      setEditDescription(editProj.description ?? "");
    }
  }, [editProj]);

  const filteredProjects = React.useMemo(() => {
    const filtered = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()),
    );

    if (sortBy === "name") {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered; // already ordered by updatedAt desc from query
  }, [projects, search, sortBy]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProj) return;
    if (!editName.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (!editSlug.trim()) {
      toast.error("Namespace slug is required");
      return;
    }

    setEditLoading(true);
    try {
      const updated = await updateProject({
        id: editProj.id,
        name: editName.trim(),
        slug: editSlug.trim(),
        description: editDescription.trim(),
      });
      toast.success("Workspace settings updated successfully!");
      setProjects((prev) =>
        prev.map((p) => (p.id === editProj.id ? { ...p, ...updated } : p)),
      );
      setEditProj(null);
      router.refresh();
    } catch (err) {
      toast.error("Failed to update workspace settings");
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProj) return;
    if (deleteConfirmText !== deleteProj.name) {
      toast.error("Please type the project name correctly to confirm.");
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteProject(deleteProj.id);
      toast.success(`Project "${deleteProj.name}" deleted successfully.`);
      setProjects((prev) => prev.filter((p) => p.id !== deleteProj.id));
      setDeleteProj(null);
      setDeleteConfirmText("");
      router.refresh();
    } catch (err) {
      toast.error("Failed to delete workspace");
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const triggerCreateProject = () => {
    window.dispatchEvent(new CustomEvent("open-new-project-dialog"));
  };

  // Color theme generator based on project ID hash
  const getThemeColors = (id: string) => {
    const hash = id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const themes = [
      {
        bg: "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20",
        accent: "from-indigo-500/20 to-indigo-500/5",
        dot: "bg-indigo-500",
      },
      {
        bg: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
        accent: "from-emerald-500/20 to-emerald-500/5",
        dot: "bg-emerald-500",
      },
      {
        bg: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20",
        accent: "from-blue-500/20 to-blue-500/5",
        dot: "bg-blue-500",
      },
      {
        bg: "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20",
        accent: "from-rose-500/20 to-rose-500/5",
        dot: "bg-rose-500",
      },
      {
        bg: "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20",
        accent: "from-purple-500/20 to-purple-500/5",
        dot: "bg-purple-500",
      },
    ];
    return themes[hash % themes.length];
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Upper header section */}
      <div className="border-border/40 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Manage your isolated API namespaces and simulate response schema
            endpoints.
          </p>
        </div>

        <Button
          onClick={triggerCreateProject}
          className="h-9 shrink-0 gap-1.5 text-xs font-semibold"
        >
          <RiAddLine className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Search & Sort Filters */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
          <RiSearchLine className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces..."
            className="h-8.5 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-end text-xs sm:self-auto">
          <span className="text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "updated" | "name")}
            className="bg-card border-border text-foreground rounded border px-2 py-1 font-medium focus:outline-none"
          >
            <option value="updated">Last Updated</option>
            <option value="name">Project Name</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      {filteredProjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-2 border-dashed p-12 text-center">
          <RiTerminalBoxLine className="text-muted-foreground/60 mb-3 h-10 w-10 stroke-1" />
          <CardTitle className="text-base font-bold">
            No workspaces found
          </CardTitle>
          <CardDescription className="mt-1.5 max-w-xs text-xs leading-relaxed">
            {search
              ? "No workspaces match your search keyword. Try adjusting your query."
              : "Get started by creating your first mock API workspace namespace."}
          </CardDescription>
          {!search && (
            <Button
              onClick={triggerCreateProject}
              className="mt-5 h-9 gap-1.5 text-xs font-semibold"
            >
              <RiAddLine className="h-4 w-4" />
              <span>Create Project</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((proj) => {
            const theme = getThemeColors(proj.id);
            const routesCount =
              proj.endpoints?.reduce(
                (acc, e) => acc + (e.routes?.length ?? 0),
                0,
              ) ?? 0;
            const groupsCount = proj.endpoints?.length ?? 0;

            return (
              <Card
                key={proj.id}
                className="hover:border-primary/20 group bg-card/65 relative flex flex-col justify-between overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
              >
                {/* Visual Header Accent Gradient */}
                <div
                  className={`h-1.5 w-full bg-linear-to-r ${theme.accent}`}
                />

                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${theme.bg}`}
                    >
                      <RiTerminalBoxLine className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex items-center gap-1 transition-opacity group-hover:opacity-100 sm:opacity-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground h-6 w-6"
                        title="Workspace Settings"
                        onClick={() => setEditProj(proj)}
                      >
                        <RiSettings3Line className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 h-6 w-6"
                        title="Delete Workspace"
                        onClick={() => setDeleteProj(proj)}
                      >
                        <RiDeleteBin6Line className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <Link
                      href={`/projects/${proj.slug}/canvas`}
                      className="hover:text-primary line-clamp-1 flex items-center gap-1.5 text-sm font-bold transition-colors"
                    >
                      <span>{proj.name}</span>
                      <RiMagicLine className="text-primary h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                    <span className="text-muted-foreground bg-muted border-border/40 inline-flex max-w-full truncate rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold">
                      /{proj.slug}
                    </span>
                  </div>

                  <CardDescription className="mt-2 line-clamp-2 min-h-8 text-xs leading-relaxed">
                    {proj.description || "No description provided."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 p-4 pt-1 pb-3.5">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold">
                    <RiCalendarLine className="h-3.5 w-3.5 shrink-0" />
                    <span>Updated {formatRelativeTime(proj.updatedAt)}</span>
                  </div>

                  <div className="border-border/40 text-muted-foreground/80 flex items-center gap-3 border-t pt-2 text-[10px] font-semibold">
                    <div className="flex items-center gap-1">
                      <RiStackLine className="text-primary/80 h-3.5 w-3.5 shrink-0" />
                      <span>
                        {groupsCount} {groupsCount === 1 ? "group" : "groups"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <RiPulseLine className="h-3.5 w-3.5 shrink-0 text-emerald-500/80" />
                      <span>
                        {routesCount} {routesCount === 1 ? "route" : "routes"}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-border/40 mt-1 border-t p-4 pt-0">
                  <Link
                    href={`/projects/${proj.slug}/canvas`}
                    className="w-full"
                  >
                    <Button
                      variant="ghost"
                      className="hover:bg-primary/5 hover:text-primary group/btn h-8.5 w-full justify-between px-2 text-xs font-bold"
                    >
                      <span>Enter Workspace</span>
                      <RiArrowRightLine className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Settings Dialog */}
      <Dialog
        open={!!editProj}
        onOpenChange={(open) => {
          if (!open) {
            setEditProj(null);
            setEditName("");
            setEditSlug("");
            setEditDescription("");
          }
        }}
      >
        <DialogContent className="sm:max-w-106.25">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Workspace Settings</DialogTitle>
              <DialogDescription>
                Modify workspace metadata and namespace configurations.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g., Billing Service"
                  maxLength={100}
                  disabled={editLoading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-slug" className="text-sm font-medium">
                  Namespace Slug
                </label>
                <Input
                  id="edit-slug"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  placeholder="e.g., billing-service"
                  maxLength={100}
                  disabled={editLoading}
                />
                <span className="text-muted-foreground text-[10px]">
                  Determines mock base URL: `/{editSlug}`. Must be
                  lowercase alphanumeric with hyphens.
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="edit-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <Input
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="e.g., Mocking stripe endpoints for dev"
                  maxLength={500}
                  disabled={editLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditProj(null)}
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading} className="gap-1.5">
                {editLoading && <RiLoader2Line className="h-4 w-4 animate-spin" />}
                <span>Save Changes</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteProj}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteProj(null);
            setDeleteConfirmText("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <RiAlertLine className="h-5 w-5" />
              <span>Confirm Deletion</span>
            </DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to delete project **
              {deleteProj?.name}**? This will delete all endpoints, mock schema
              pipelines, and coordinate states. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 grid gap-2">
            <label
              htmlFor="confirm-text"
              className="text-muted-foreground text-xs font-semibold"
            >
              To confirm, type{" "}
              <span className="text-foreground selection:bg-primary/20 font-mono font-bold">
                &ldquo;{deleteProj?.name}&ldquo;
              </span>{" "}
              below:
            </label>
            <Input
              id="confirm-text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteProj?.name}
              className="font-mono text-sm"
              disabled={deleteLoading}
              autoComplete="off"
            />
          </div>
          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteProj(null);
                setDeleteConfirmText("");
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={deleteLoading || deleteConfirmText !== deleteProj?.name}
              className="gap-1.5"
            >
              {deleteLoading && <RiLoader2Line className="h-4 w-4 animate-spin" />}
              <span>Permanently Delete</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
