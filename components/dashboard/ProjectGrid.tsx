"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Terminal, Calendar, ArrowRight, Search, Loader2, Trash2, AlertTriangle, Settings, Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteProject, updateProject } from "@/lib/actions/projects";
import { formatRelativeTime } from "@/lib/utils";
import type { Project } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectGridProps {
  initialProjects: Project[];
}

/**
 * Client component to display a compact, searchable grid of project workspaces.
 */
export function ProjectGrid({ initialProjects }: ProjectGridProps) {
  const router = useRouter();
  const [projects, setProjects] = React.useState<Project[]>(initialProjects);
  const [search, setSearch] = React.useState("");

  // Deletion states
  const [deleteProj, setDeleteProj] = React.useState<Project | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Edit/Settings states
  const [editProj, setEditProj] = React.useState<Project | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editSlug, setEditSlug] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editLoading, setEditLoading] = React.useState(false);

  // Sync initial projects
  React.useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Check URL parameter to trigger global open dialog
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("new=true")) {
      window.dispatchEvent(new CustomEvent("open-new-project-dialog"));
      // Clean up URL search parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  React.useEffect(() => {
    if (editProj) {
      setEditName(editProj.name);
      setEditSlug(editProj.slug);
      setEditDescription(editProj.description ?? "");
    }
  }, [editProj]);

  const filteredProjects = React.useMemo(() => {
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search]);

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
      setProjects((prev) => prev.map((p) => (p.id === editProj.id ? updated : p)));
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

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Upper header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-xs text-muted-foreground">
            Mock API workspace namespaces and configurations.
          </p>
        </div>

        <Button onClick={triggerCreateProject} className="h-8 gap-1.5 text-xs font-semibold shrink-0">
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="pl-8 h-8 text-xs max-w-xs"
        />
      </div>

      {/* Grid listing */}
      {filteredProjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
          <Terminal className="h-8 w-8 text-muted-foreground/60 stroke-1 mb-2" />
          <CardTitle className="text-sm font-semibold">No projects found</CardTitle>
          <CardDescription className="max-w-xs text-[11px] leading-normal mt-1">
            {search
              ? "No workspaces match your search keyword. Try something else."
              : "Get started by creating your first mock API workspace project."}
          </CardDescription>
          {!search && (
            <Button onClick={triggerCreateProject} className="mt-4 h-8 gap-1.5 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Project</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-2">
          {filteredProjects.map((proj) => (
            <Card key={proj.id} className="hover:border-primary/30 transition-all group flex items-center justify-between p-2.5 px-3.5 gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Terminal className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <Link href={`/projects/${proj.slug}/canvas`} className="font-semibold text-sm hover:text-primary transition-colors truncate">
                      {proj.name}
                    </Link>
                    <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                      /mock/{proj.slug}
                    </span>
                  </div>
                  {proj.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[500px]">
                      {proj.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-muted-foreground font-medium hidden sm:inline flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Updated {formatRelativeTime(proj.updatedAt)}</span>
                </span>
                <div className="flex items-center gap-0.5">
                  <Link href={`/projects/${proj.slug}/canvas`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold gap-1 hover:bg-primary/5 hover:text-primary px-2">
                      <span>Enter</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Workspace Settings"
                    onClick={() => setEditProj(proj)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    title="Delete Workspace"
                    onClick={() => setDeleteProj(proj)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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
        <DialogContent className="sm:max-w-[425px]">
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
                <span className="text-[10px] text-muted-foreground">
                  Determines mock base URL: `/mock/{editSlug}`. Must be lowercase alphanumeric with hyphens.
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-description" className="text-sm font-medium">
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
              <Button type="button" variant="outline" onClick={() => setEditProj(null)} disabled={editLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading} className="gap-1.5">
                {editLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
              <AlertTriangle className="h-5 w-5" />
              <span>Confirm Deletion</span>
            </DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to delete project **{deleteProj?.name}**? This will delete all endpoints, mock schema pipelines, and coordinate states. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 my-2">
            <label htmlFor="confirm-text" className="text-xs font-semibold text-muted-foreground">
              To confirm, type <span className="font-mono font-bold text-foreground selection:bg-primary/20">"{deleteProj?.name}"</span> below:
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
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
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
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Permanently Delete</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
