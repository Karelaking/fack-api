"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsString, parseAsStringEnum } from "nuqs";
import {
  RiTerminalBoxLine,
  RiSearchLine,
  RiLoader2Line,
  RiDeleteBin6Line,
  RiSettings3Line,
  RiAddLine,
  RiCheckLine,
  RiGitBranchLine,
  RiGithubFill,
  RiLayoutGridLine,
  RiListUnordered,
  RiFilter3Line,
} from "@remixicon/react";
import { toast } from "sonner";
import { deleteProject, updateProject } from "@/lib/actions/projects";
import { formatRelativeTime } from "@/lib/utils";
import type { Project, Endpoint, Route } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock11Icon } from "lucide-react";

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
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [sortBy] = useQueryState(
    "sort",
    parseAsStringEnum<"updated" | "name">(["updated", "name"]).withDefault(
      "updated",
    ),
  );

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

  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Sync initial projects
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjects(initialProjects);
  }, [initialProjects]);

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

  const [isPending, startTransition] = React.useTransition();

  const handleEditSubmit = (e: React.FormEvent): void => {
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
    startTransition(async () => {
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
    });
  };

  const handleDeleteProject = (): void => {
    if (!deleteProj) return;
    if (deleteConfirmText !== deleteProj.name) {
      toast.error("Please type the project name correctly to confirm.");
      return;
    }
    setDeleteLoading(true);
    startTransition(async () => {
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
    });
  };

  const triggerCreateProject = () => {
    window.dispatchEvent(new CustomEvent("open-new-project-dialog"));
  };

  return (
    <div className="mx-auto max-w-350 space-y-8 p-4 md:p-8">
      {/* Search Bar Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <RiSearchLine className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Projects..."
            aria-label="Search workspaces"
            className="border-border/40 bg-card/30 focus-visible:ring-primary/20 h-10 w-full rounded-md border pr-12 pl-9 transition-colors outline-none"
          />
          <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
            <kbd className="bg-muted text-muted-foreground hidden h-5 items-center justify-center rounded-lg border px-1.5 font-mono text-[10px] font-medium sm:flex">
              /
            </kbd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="border-border/40 bg-card/30 hover:bg-muted flex h-10 w-10 items-center justify-center rounded-md border transition-colors"
          >
            <RiFilter3Line className="text-muted-foreground h-4 w-4" />
          </button>
          <div className="border-border/40 bg-card/30 flex h-10 items-center rounded-md border p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex h-7 w-7 items-center justify-center rounded-sm transition-colors ${
                viewMode === "grid" ? "bg-muted shadow-sm" : "hover:bg-muted"
              }`}
            >
              <RiLayoutGridLine
                className={`h-4 w-4 ${viewMode === "grid" ? "text-foreground" : "text-muted-foreground"}`}
              />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex h-7 w-7 items-center justify-center rounded-sm transition-colors ${
                viewMode === "list" ? "bg-muted shadow-sm" : "hover:bg-muted"
              }`}
            >
              <RiListUnordered
                className={`h-4 w-4 ${viewMode === "list" ? "text-foreground" : "text-muted-foreground"}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-6">
        {/* Left Sidebar (Widgets) */}
        <div className="flex w-full shrink-0 flex-col gap-8 lg:w-[320px]">
          {/* Usage */}
          <div className="space-y-4">
            <h3 className="text-foreground text-sm font-semibold tracking-tight">
              Usage
            </h3>
            <div className="bg-card/30 border-border/40 rounded-xl border p-0">
              <div className="border-border/40 flex items-center justify-between border-b px-4 py-3">
                <span className="text-foreground text-sm font-medium">
                  Last 30 days
                </span>
                <button
                  type="button"
                  className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1 text-xs font-medium shadow-sm transition-colors"
                >
                  Upgrade
                </button>
              </div>
              <div className="flex flex-col space-y-3 px-4 py-4 text-xs">
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border-[3px] border-blue-500/80" />
                    <span>Functions Storage</span>
                  </div>
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-medium">3.9 GB</span>{" "}
                    / 10 GB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border-[3px] border-zinc-500/50" />
                    <span>Deployment Storage</span>
                  </div>
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-medium">1.09 GB</span>{" "}
                    / 10 GB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border-[3px] border-blue-500/30" />
                    <span>Fluid Active CPU</span>
                  </div>
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-medium">17m 58s</span>{" "}
                    / 4h
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="space-y-4">
            <h3 className="text-foreground text-sm font-semibold tracking-tight">
              Alerts
            </h3>
            <div className="bg-card/30 border-border/40 flex flex-col items-center justify-center space-y-3 rounded-xl border px-4 py-8 text-center">
              <h4 className="text-foreground text-sm font-medium">
                Get alerted for anomalies
              </h4>
              <p className="text-muted-foreground max-w-50 text-xs leading-relaxed">
                Automatically monitor your projects for anomalies and get
                notified.
              </p>
              <button
                type="button"
                className="border-border text-foreground hover:bg-muted mt-2 rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>

          {/* Recent Previews */}
          <div className="space-y-4">
            <h3 className="text-foreground text-sm font-semibold tracking-tight">
              Recent Previews
            </h3>
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-card/30 border-border/40 flex flex-col gap-2 rounded-xl border p-4"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-500">
                      <RiGitBranchLine className="h-2.5 w-2.5" />
                    </div>
                    <span className="text-foreground line-clamp-2 text-sm leading-tight font-medium">
                      chore(deps-dev): bump the dev-dependencies...
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <div className="bg-muted/50 text-muted-foreground flex items-center gap-1 rounded px-1.5 py-0.5">
                      <RiCheckLine className="h-3 w-3 text-emerald-500" />
                      <span>Preview</span>
                    </div>
                    <div className="bg-muted/50 text-muted-foreground flex items-center gap-1 rounded px-1.5 py-0.5">
                      <RiGithubFill className="h-3 w-3" />
                      <span>#{50 + i}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content (Projects Grid) */}
        <div className="min-w-0 flex-1 space-y-4">
          <h3 className="text-foreground text-sm font-semibold tracking-tight">
            Projects
          </h3>

          {filteredProjects.length === 0 ? (
            <div className="bg-card/30 border-border/40 flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
              <RiTerminalBoxLine className="text-muted-foreground/50 mb-4 h-12 w-12" />
              <h4 className="text-foreground text-lg font-medium">
                No workspaces found
              </h4>
              <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                {search
                  ? "No workspaces match your search keyword. Try adjusting your query."
                  : "Get started by creating your first workspace."}
              </p>
              {!search && (
                <Button onClick={triggerCreateProject} className="mt-6">
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Create Workspace
                </Button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-4 xl:grid-cols-2"
                  : "flex flex-col gap-4"
              }
            >
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-card/30 border-border/40 hover:border-border group relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 transition-colors"
                >
                  <Link
                    href={`/projects/${proj.slug}/canvas`}
                    className="absolute inset-0 z-10"
                  >
                    <span className="sr-only">Enter Workspace {proj.name}</span>
                  </Link>

                  <div className="flex items-start justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-b from-zinc-700 to-zinc-900 text-white shadow-sm ring-1 ring-white/10 dark:from-zinc-800 dark:to-zinc-950">
                        <RiTerminalBoxLine className="h-5 w-5" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="text-foreground group-hover:text-primary truncate font-bold transition-colors">
                          {proj.name}
                        </span>
                        <span className="text-muted-foreground truncate text-xs">
                          {proj.slug}.fackapi.com
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="relative z-20 flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className="border-border text-muted-foreground hover:text-foreground hover:bg-muted bg-card flex h-7 w-7 items-center justify-center rounded-md border shadow-sm transition-colors"
                        title="Workspace Settings"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditProj(proj);
                        }}
                      >
                        <RiSettings3Line className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="border-border text-muted-foreground hover:text-destructive hover:bg-muted bg-card flex h-7 w-7 items-center justify-center rounded-md border shadow-sm transition-colors"
                        title="Delete Workspace"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteProj(proj);
                        }}
                      >
                        <RiDeleteBin6Line className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-muted-foreground mt-6 flex min-w-0 flex-col gap-2 text-xs">
                    <div className="flex min-w-0 items-start gap-1.5">
                      <span className="line-clamp-2 min-h-8">
                        {proj.description || "Update routes for " + proj.name}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-end gap-1.5">
                      <Clock11Icon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {formatRelativeTime(proj.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
                  disabled={editLoading || isPending}
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
                  disabled={editLoading || isPending}
                />
                <span className="text-muted-foreground text-[10px]">
                  Determines mock base URL: `/{editSlug}`. Must be lowercase
                  alphanumeric with hyphens.
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
                  disabled={editLoading || isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditProj(null)}
                disabled={editLoading || isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editLoading || isPending}
                aria-disabled={editLoading || isPending}
              >
                {editLoading || isPending ? (
                  <>
                    <RiLoader2Line
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
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
            <DialogTitle variant="destructive">Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete **{deleteProj?.name}**? All
              endpoints, routes, schemas, and historical logs will be
              permanently wiped.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-muted-foreground text-xs">
              To verify deletion, type the project name{" "}
              <strong className="text-foreground select-all">
                {deleteProj?.name}
              </strong>{" "}
              below:
            </p>
            <Input
              size="sm"
              variant="mono"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteProj?.name}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteProj(null)}
              disabled={deleteLoading || isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              title="Permanently Delete Workspace"
              aria-label="Permanently Delete Workspace"
              onClick={handleDeleteProject}
              disabled={
                deleteLoading ||
                isPending ||
                deleteConfirmText !== deleteProj?.name
              }
              aria-disabled={deleteLoading || isPending}
            >
              {(deleteLoading || isPending) && (
                <RiLoader2Line className="h-4 w-4 animate-spin" />
              )}
              <span>Permanently Delete</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
