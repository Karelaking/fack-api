"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoggerRegistry } from "@/lib/logger-registry";

const uiTrace = LoggerRegistry.getTrace("ui-project-settings");
import {
  RiLoader2Line,
  RiDeleteBin6Line,
  RiSaveLine,
  RiAlertLine,
} from "@remixicon/react";
import { updateProject, deleteProject } from "@/lib/actions/projects";
import { cn, slugifyInput } from "@/lib/utils";
import type { Project } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProjectSettingsProps {
  project: Project;
  isLogsDbConfigured: boolean;
}

/**
 * Client component displaying workspace settings forms.
 * Allows updating project metadata and deleting the project entirely.
 */
export function ProjectSettings({
  project,
  isLogsDbConfigured,
}: ProjectSettingsProps): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Form states
  const [name, setName] = React.useState(project.name);
  const [slug, setSlug] = React.useState(project.slug);
  const [description, setDescription] = React.useState(
    project.description ?? "",
  );
  const [isLoggingEnabled, setIsLoggingEnabled] = React.useState(
    isLogsDbConfigured ? project.isLoggingEnabled : false,
  );
  const [isCachingEnabled, setIsCachingEnabled] = React.useState(
    project.isCachingEnabled !== false,
  );

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
    const cleanedSlug = slug.trim().replace(/^\/+|\/+$/g, "");
    if (!/^[a-z0-9_/-]+$/.test(cleanedSlug)) {
      toast.error(
        "Slug must be lowercase alphanumeric with hyphens, underscores, or slashes",
      );
      return;
    }

    uiTrace.traceCall("handleUpdate", name, cleanedSlug);
    setLoading(true);
    try {
      const updated = await updateProject({
        id: project.id,
        name,
        slug: cleanedSlug,
        description,
        isLoggingEnabled,
        isCachingEnabled,
      });
      toast.success("Workspace settings updated!");
      uiTrace.traceSuccess("handleUpdate", updated.slug);
      router.refresh();
      // Redirect if slug changed
      if (updated.slug !== project.slug) {
        router.push(`/projects/${updated.slug}/settings`);
      }
    } catch (err) {
      toast.error("Failed to update workspace settings");
      uiTrace.traceError("handleUpdate", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== project.name) {
      toast.error("Please type the project name correctly to confirm.");
      return;
    }
    uiTrace.traceCall("handleDelete", project.id);
    setDeleteLoading(true);
    try {
      await deleteProject(project.id);
      toast.success(`Project "${project.name}" deleted successfully.`);
      uiTrace.traceSuccess("handleDelete", "deleted");
      setDeleteOpen(false);
      setDeleteConfirmText("");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Failed to delete workspace");
      uiTrace.traceError("handleDelete", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
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
                onChange={(e) => setSlug(slugifyInput(e.target.value))}
                placeholder="billing-microservice"
                maxLength={100}
                disabled={loading}
              />
              <span className="text-muted-foreground text-xs">
                Determines the network mock base URL: `/{slug}/...`
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
                className="h-24 resize-none"
              />
            </div>
            <div
              className={cn(
                "bg-muted/10 flex items-center justify-between rounded-lg border p-4",
                !isLogsDbConfigured && "border-amber-500/20 bg-amber-500/5",
              )}
            >
              <div className="space-y-0.5">
                <label
                  htmlFor="isLoggingEnabled"
                  className="block text-sm font-semibold"
                >
                  Capture Request History
                </label>
                <span className="text-muted-foreground block text-xs leading-normal">
                  {isLogsDbConfigured
                    ? "When enabled, incoming mock requests are stored in the database for debugging and latency analytics."
                    : "Request logging is currently disabled because LOGS_POSTGRES_URL is not configured in environment variables."}
                </span>
              </div>
              <Switch
                id="isLoggingEnabled"
                checked={isLoggingEnabled}
                onCheckedChange={setIsLoggingEnabled}
                disabled={loading || !isLogsDbConfigured}
              />
            </div>
            <div className="bg-muted/10 flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <label
                  htmlFor="isCachingEnabled"
                  className="block text-sm font-semibold"
                >
                  Enable Mock Caching
                </label>
                <span className="text-muted-foreground block text-xs leading-normal">
                  When enabled, mock response pages and single objects are
                  cached to decrease latency and reduce server generation
                  efforts.
                </span>
              </div>
              <Switch
                id="isCachingEnabled"
                checked={isCachingEnabled}
                onCheckedChange={setIsCachingEnabled}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="border-border justify-end border-t pt-4">
            <Button
              type="submit"
              disabled={loading || !name.trim() || !slug.trim()}
              className="gap-1.5"
            >
              {loading ? (
                <RiLoader2Line className="h-4 w-4 animate-spin" />
              ) : (
                <RiSaveLine className="h-4 w-4" />
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
            <RiAlertLine className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Irreversibly delete this workspace. All endpoints, custom routes,
            schema layouts, and topologies will be deleted permanently.
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-destructive/10 bg-destructive/10 flex items-center justify-between border-t pt-4">
          <span className="text-destructive text-xs font-medium">
            This action is not reversible.
          </span>
          <Dialog
            open={deleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open);
              if (!open) {
                setDeleteConfirmText("");
              }
            }}
          >
            <DialogTrigger
              render={<Button variant="destructive" className="gap-1.5" />}
            >
              <RiDeleteBin6Line className="h-4 w-4" />
              <span>Delete Workspace</span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                  <RiAlertLine className="h-5 w-5" />
                  <span>Confirm Deletion</span>
                </DialogTitle>
                <DialogDescription>
                  Are you absolutely sure you want to delete project **
                  {project.name}**? This will delete all endpoints, mock schema
                  synthesis pipelines, and coordinates. This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <div className="my-2 grid gap-2 text-left">
                <label
                  htmlFor="confirm-text"
                  className="text-muted-foreground text-xs font-semibold"
                >
                  To confirm, type{" "}
                  <span className="text-foreground selection:bg-primary/20 font-mono font-bold">
                    &quot;{project.name}&quot;
                  </span>{" "}
                  below:
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
              <DialogFooter className="mt-2 gap-2 sm:gap-0">
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
                  {deleteLoading && (
                    <RiLoader2Line className="h-4 w-4 animate-spin" />
                  )}
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
