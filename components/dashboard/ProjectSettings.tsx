"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, Save, AlertTriangle } from "lucide-react";
import { updateProject, deleteProject } from "@/lib/actions/projects";
import type { Project } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface ProjectSettingsProps {
  project: Project;
}

/**
 * Client component displaying workspace settings forms.
 * Allows updating project metadata and deleting the project entirely.
 */
export function ProjectSettings({ project }: ProjectSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Form states
  const [name, setName] = React.useState(project.name);
  const [slug, setSlug] = React.useState(project.slug);
  const [description, setDescription] = React.useState(project.description ?? "");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Project slug is required");
      return;
    }

    setLoading(true);
    try {
      const updated = await updateProject({
        id: project.id,
        name,
        slug,
        description,
      });
      toast.success("Workspace settings updated!");
      router.refresh();
      // Redirect if slug changed
      if (updated.slug !== project.slug) {
        router.push(`/projects/${updated.slug}/settings`);
      }
    } catch (err) {
      toast.error("Failed to update workspace settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== project.name) {
      toast.error("Please type the project name correctly to confirm.");
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteProject(project.id);
      toast.success(`Project "${project.name}" deleted successfully.`);
      setDeleteOpen(false);
      setDeleteConfirmText("");
      router.push("/");
    } catch (err) {
      toast.error("Failed to delete workspace");
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Form Card */}
      <form onSubmit={handleUpdate}>
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure workspace metadata, names, and path slugs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-semibold">
                Workspace Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Billing Microservice"
                maxLength={100}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="slug" className="text-sm font-semibold">
                Namespace Slug
              </label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="billing-microservice"
                maxLength={100}
                disabled={loading}
              />
              <span className="text-xs text-muted-foreground">
                Determines the network mock base URL: `/mock/{slug}/...`
              </span>
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-semibold">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="API virtualizer endpoints for billing tasks..."
                maxLength={500}
                disabled={loading}
                className="resize-none h-24"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-border pt-4 justify-end">
            <Button type="submit" disabled={loading || !name.trim() || !slug.trim()} className="gap-1.5">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Changes</span>
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Danger Zone Card */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Irreversibly delete this workspace. All endpoints, custom routes, schema layouts, and topologies will be deleted permanently.
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t border-destructive/10 pt-4 flex justify-between items-center bg-destructive/10">
          <span className="text-xs font-medium text-destructive">This action is not reversible.</span>
          <Dialog
            open={deleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open);
              if (!open) {
                setDeleteConfirmText("");
              }
            }}
          >
            <DialogTrigger render={<Button variant="destructive" className="gap-1.5" />}>
              <Trash2 className="h-4 w-4" />
              <span>Delete Workspace</span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Confirm Deletion</span>
                </DialogTitle>
                <DialogDescription>
                  Are you absolutely sure you want to delete project **{project.name}**? This will delete all endpoints, mock schema synthesis pipelines, and coordinates. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 my-2 text-left">
                <label htmlFor="confirm-text" className="text-xs font-semibold text-muted-foreground">
                  To confirm, type <span className="font-mono font-bold text-foreground selection:bg-primary/20">"{project.name}"</span> below:
                </label>
                <Input
                  id="confirm-text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={project.name}
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
                    setDeleteOpen(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteLoading || deleteConfirmText !== project.name}
                  className="gap-1.5"
                >
                  {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Permanently Delete</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
