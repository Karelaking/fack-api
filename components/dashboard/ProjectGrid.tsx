"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderPlus, Terminal, Calendar, ArrowRight, Search, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createProject, deleteProject } from "@/lib/actions/projects";
import { formatRelativeTime } from "@/lib/utils";
import type { Project } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProjectGridProps {
  initialProjects: Project[];
}

/**
 * Client component to display a searchable grid of projects.
 * Includes a dialog to trigger project creation via Server Actions.
 */
export function ProjectGrid({ initialProjects }: ProjectGridProps) {
  const router = useRouter();
  const [projects, setProjects] = React.useState<Project[]>(initialProjects);
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Deletion states
  const [deleteProj, setDeleteProj] = React.useState<Project | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const filteredProjects = React.useMemo(() => {
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setLoading(true);
    try {
      const newProj = await createProject({ name, description });
      toast.success(`Project "${newProj.name}" created successfully!`);
      setProjects([newProj, ...projects]);
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/projects/${newProj.slug}/canvas`);
    } catch (err) {
      toast.error("Failed to create project");
      console.error(err);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Upper header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your mock API workspaces and simulate endpoints.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="gap-2 shrink-0" />}>
            <FolderPlus className="h-4 w-4" />
            <span>Create Project</span>
          </DialogTrigger>
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
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Billing Service"
                    maxLength={100}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Mocking stripe endpoints for dev"
                    maxLength={500}
                    disabled={loading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
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
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects by name..."
          className="pl-9"
        />
      </div>

      {/* Grid listing */}
      {filteredProjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <Terminal className="h-10 w-10 text-muted-foreground stroke-1 mb-4" />
          <CardTitle className="text-xl">No projects found</CardTitle>
          <CardDescription className="max-w-sm mt-1">
            {search
              ? "No workspaces match your search keyword. Try something else."
              : "Get started by creating your first mock API workspace project."}
          </CardDescription>
          {!search && (
            <Button onClick={() => setOpen(true)} className="mt-6 gap-2">
              <FolderPlus className="h-4 w-4" />
              <span>Create Project</span>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((proj) => (
            <Card key={proj.id} className="hover:shadow-md transition-shadow group flex flex-col justify-between relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-mono text-xs mb-1.5 uppercase font-semibold">
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Workspace</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteProj(proj);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                  {proj.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-1.5">
                  {proj.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Updated {formatRelativeTime(proj.updatedAt)}</span>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4 mt-2">
                <Link href={`/projects/${proj.slug}/canvas`} className="w-full">
                  <Button variant="ghost" className="w-full justify-between hover:bg-primary/5 group/btn">
                    <span>Enter Workspace</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

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
