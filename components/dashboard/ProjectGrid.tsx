"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsString, parseAsStringEnum } from "nuqs";
import {
  RiTerminalBoxLine,
  RiCalendarLine,
  RiArrowRightLine,
  RiSearchLine,
  RiLoader2Line,
  RiDeleteBin6Line,
  RiSettings3Line,
  RiAddLine,
  RiStackLine,
  RiPulseLine,
  RiMagicLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { deleteProject, updateProject } from "@/lib/actions/projects";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Project, Endpoint, Route } from "@/db/schema";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [sortBy, setSortBy] = useQueryState(
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

  // Color theme generator based on project ID hash
  const getThemeColors = (id: string) => {
    const hash = id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const themes = [
      {
        bg: "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20",
        accent: "from-indigo-500/60 to-indigo-500/10",
        dot: "bg-indigo-500",
      },
      {
        bg: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
        accent: "from-emerald-500/60 to-emerald-500/10",
        dot: "bg-emerald-500",
      },
      {
        bg: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20",
        accent: "from-blue-500/60 to-blue-500/10",
        dot: "bg-blue-500",
      },
      {
        bg: "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20",
        accent: "from-rose-500/60 to-rose-500/10",
        dot: "bg-rose-500",
      },
      {
        bg: "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20",
        accent: "from-purple-500/60 to-purple-500/10",
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
          type="button"
          onClick={triggerCreateProject}
          title="Create New Project"
          aria-label="Create New Project"
          size="lg"
          className="shrink-0"
        >
          <RiAddLine className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Search & Sort Filters */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <InputGroup className="w-full sm:max-w-xs">
          <InputGroupAddon>
            <RiSearchLine className="text-muted-foreground h-3.5 w-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces..."
            aria-label="Search workspaces"
          />
        </InputGroup>

        <div className="flex items-center gap-2 self-end text-xs sm:self-auto">
          <label htmlFor="sort-by-select" className="text-muted-foreground">
            Sort by:
          </label>
          <select
            id="sort-by-select"
            aria-label="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "updated" | "name")}
            className="bg-card border-border text-foreground border px-2 py-1 font-medium focus:outline-none"
          >
            <option value="updated">Last Updated</option>
            <option value="name">Project Name</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      {filteredProjects.length === 0 ? (
        <Card variant="dashed">
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <RiTerminalBoxLine className="text-muted-foreground/60 mb-3 h-10 w-10 stroke-1" />
            <CardTitle>No workspaces found</CardTitle>
            <CardDescription className="mt-1.5">
              <span className="block max-w-xs leading-relaxed">
                {search
                  ? "No workspaces match your search keyword. Try adjusting your query."
                  : "Get started by creating your first mock API workspace namespace."}
              </span>
            </CardDescription>
            {!search && (
              <Button
                type="button"
                onClick={triggerCreateProject}
                title="Create Project"
                aria-label="Create Project"
                className="mt-5"
              >
                <RiAddLine className="h-4 w-4" />
                <span>Create Workspace</span>
              </Button>
            )}
          </div>
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
                variant="interactive"
                className="group relative flex flex-col justify-between overflow-hidden"
              >
                {/* Visual Header Accent Gradient */}
                <div
                  className={`h-1.5 w-full bg-linear-to-r ${theme.accent}`}
                />

                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center border ${theme.bg}`}
                    >
                      <RiTerminalBoxLine className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex items-center gap-1 transition-opacity group-hover:opacity-100 sm:opacity-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        title="Workspace Settings"
                        aria-label="Workspace Settings"
                        onClick={() => setEditProj(proj)}
                      >
                        <RiSettings3Line className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        title="Delete Workspace"
                        aria-label="Delete Workspace"
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
                    <span className="text-muted-foreground bg-muted border-border/40 inline-flex max-w-full truncate border px-1.5 py-0.5 font-mono text-[9px] font-semibold">
                      /{proj.slug}
                    </span>
                  </div>

                  <CardDescription className="mt-2 min-h-8">
                    <span className="line-clamp-2 block leading-relaxed">
                      {proj.description || "No description provided."}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-col gap-2">
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
                  </div>
                </CardContent>

                <CardFooter className="mt-1">
                  <Link
                    href={`/projects/${proj.slug}/canvas`}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "hover:bg-primary/5 hover:text-primary group/btn w-full justify-between px-2 font-bold",
                    )}
                  >
                    <span>Enter Workspace</span>
                    <RiArrowRightLine className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
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
