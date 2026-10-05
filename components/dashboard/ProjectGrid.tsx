"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsString, parseAsStringEnum } from "nuqs";
import {
  RiTerminalBoxLine,
  RiCalendarLine,
  RiSearchLine,
  RiLoader2Line,
  RiDeleteBin6Line,
  RiSettings3Line,
  RiAddLine,
  RiStackLine,
  RiPulseLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { deleteProject, updateProject } from "@/lib/actions/projects";
import { formatRelativeTime } from "@/lib/utils";
import type { Project, Endpoint, Route } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <div className="max-w-8xl mx-auto space-y-8 p-6 md:p-6 lg:px-12">
      {/* Upper header section */}
      <div>
        <h1 className="font-heading text-foreground text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
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

        <div className="flex items-center gap-2 self-end text-sm sm:self-auto">
          <span className="text-muted-foreground">Sort by:</span>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as "updated" | "name")}
          >
            <SelectTrigger size="sm" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="name">Project Name</SelectItem>
            </SelectContent>
          </Select>
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
              <div
                key={proj.id}
                className="group bg-card text-card-foreground hover:border-primary/30 relative flex min-h-44 flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                {/* Stretched link for making the entire card clickable */}
                <Link
                  href={`/projects/${proj.slug}/canvas`}
                  className="absolute inset-0 z-0"
                >
                  <span className="sr-only">Enter Workspace {proj.name}</span>
                </Link>

                {/* Subtle top accent gradient */}
                <div
                  className={`absolute top-0 right-0 left-0 h-1 bg-linear-to-r opacity-60 transition-opacity group-hover:opacity-100 ${theme.accent}`}
                />

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative z-10 flex flex-col space-y-1">
                      <h3 className="text-foreground font-heading group-hover:text-primary line-clamp-1 text-lg font-bold tracking-tight capitalize transition-colors">
                        {proj.name}
                      </h3>
                      <div className="flex items-center">
                        <span className="border-border/40 bg-muted/50 text-muted-foreground text-micro group-hover:bg-muted inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono font-medium transition-colors">
                          /{proj.slug}
                        </span>
                      </div>
                    </div>

                    <div className="bg-background/80 border-border/50 duration-fast relative z-10 flex items-center gap-1 rounded-md border p-0.5 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="h-7 w-7"
                        title="Workspace Settings"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditProj(proj);
                        }}
                      >
                        <RiSettings3Line className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="h-7 w-7"
                        title="Delete Workspace"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteProj(proj);
                        }}
                      >
                        <RiDeleteBin6Line className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-muted-foreground pointer-events-none relative z-10 mt-3 line-clamp-2 flex-1 text-sm leading-relaxed">
                    {proj.description || "No description provided."}
                  </p>

                  <div className="border-border/20 pointer-events-none relative z-10 mt-5 flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-primary/5 text-primary/90 text-mini flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-semibold">
                        <RiStackLine className="h-3.5 w-3.5 shrink-0" />
                        <span>{groupsCount}</span>
                      </div>
                      <div className="bg-success/5 text-success/90 text-mini flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-semibold">
                        <RiPulseLine className="h-3.5 w-3.5 shrink-0" />
                        <span>{routesCount}</span>
                      </div>
                    </div>
                    <div className="text-muted-foreground/70 text-micro flex items-center gap-1 font-medium">
                      <RiCalendarLine className="h-3 w-3 shrink-0" />
                      <span>{formatRelativeTime(proj.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
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
