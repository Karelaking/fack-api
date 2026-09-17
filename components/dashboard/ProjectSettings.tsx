"use client";
/* eslint-disable shadcn/no-restyle -- Suppressed at consumer */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateProjectSchema } from "@/lib/validators";
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
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description ?? "",
      isLoggingEnabled: isLogsDbConfigured ? project.isLoggingEnabled : false,
      isCachingEnabled: project.isCachingEnabled !== false,
    },
  });

  const onUpdate = async (data: {
    name?: string;
    slug?: string;
    description?: string;
    isLoggingEnabled?: boolean;
    isCachingEnabled?: boolean;
  }): Promise<void> => {
    const cleanedSlug = data.slug
      ? data.slug.trim().replace(/^\/+|\/+$/g, "")
      : project.slug;

    uiTrace.traceCall("handleUpdate", data.name, cleanedSlug);
    try {
      const updated = await updateProject({
        id: project.id,
        name: data.name?.trim(),
        slug: cleanedSlug,
        description: data.description?.trim(),
        isLoggingEnabled: data.isLoggingEnabled,
        isCachingEnabled: data.isCachingEnabled,
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
    }
  };

  const handleDelete = (): void => {
    if (deleteConfirmText !== project.name) {
      toast.error("Please type the project name correctly to confirm.");
      return;
    }
    uiTrace.traceCall("handleDelete", project.id);
    setDeleteLoading(true);
    startTransition(async () => {
      try {
        await deleteProject(project.id);
        toast.success(`Project "${project.name}" deleted successfully.`);
        uiTrace.traceSuccess("handleDelete", "deleted");
        setDeleteOpen(false);
        setDeleteConfirmText("");
        router.push("/");
      } catch (err) {
        toast.error("Failed to delete workspace");
        uiTrace.traceError("handleDelete", err);
      } finally {
        setDeleteLoading(false);
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Settings Form Card */}
      <form onSubmit={handleSubmit(onUpdate)}>
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure workspace metadata, names, and path slugs.
            </CardDescription>
          </CardHeader>
          {}
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-semibold">
                Workspace Name
              </label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Billing Microservice"
                maxLength={100}
                disabled={isSubmitting}
              />
              {errors.name && (
                <span className="text-destructive text-xs">
                  {errors.name.message}
                </span>
              )}
            </div>
            <div className="grid gap-2">
              <label htmlFor="slug" className="text-sm font-semibold">
                Namespace Slug
              </label>
              <Input
                id="slug"
                {...register("slug", {
                  onChange: (e) =>
                    setValue("slug", slugifyInput(e.target.value)),
                })}
                placeholder="billing-microservice"
                maxLength={100}
                disabled={isSubmitting}
              />
              {errors.slug && (
                <span className="text-destructive text-xs">
                  {errors.slug.message}
                </span>
              )}
              <span className="text-muted-foreground text-xs">
                Determines the network mock base URL: `/{project.slug}/...`
              </span>
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-semibold">
                Description
              </label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="API virtualizer endpoints for billing tasks..."
                maxLength={500}
                disabled={isSubmitting}
                className="h-24 resize-none"
              />
              {errors.description && (
                <span className="text-destructive text-xs">
                  {errors.description.message}
                </span>
              )}
            </div>
            <div
              className={cn(
                "bg-muted/10 flex items-center justify-between border p-4",
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
              <Controller
                control={control}
                name="isLoggingEnabled"
                render={({ field }) => (
                  <Switch
                    id="isLoggingEnabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting || !isLogsDbConfigured}
                  />
                )}
              />
            </div>
            <div className="bg-muted/10 flex items-center justify-between border p-4">
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
              <Controller
                control={control}
                name="isCachingEnabled"
                render={({ field }) => (
                  <Switch
                    id="isCachingEnabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
          </CardContent>
          {}
          <CardFooter className="border-border justify-end border-t pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
              title="Save Changes"
              aria-label="Save Changes"
              className="gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RiLoader2Line
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <RiSaveLine className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Danger Zone Card */}
      <Card variant="danger">
        <CardHeader>
          <CardTitle variant="destructive">
            <RiAlertLine className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Irreversibly delete this workspace. All endpoints, custom routes,
            schema layouts, and topologies will be deleted permanently.
          </CardDescription>
        </CardHeader>
        {}
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
              render={
                <Button
                  type="button"
                  variant="destructive"
                  title="Delete Workspace"
                  aria-label="Delete Workspace"

                  className="gap-1.5"
                />
              }
            >
              <RiDeleteBin6Line className="h-4 w-4" />
              <span>Delete Workspace</span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                {}
                <DialogTitle variant="destructive">
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
              {}
              <DialogFooter className="mt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  title="Cancel deletion"
                  aria-label="Cancel deletion"
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
                  title="Permanently Delete Workspace"
                  aria-label="Permanently Delete Workspace"
                  onClick={handleDelete}
                  disabled={
                    deleteLoading ||
                    isPending ||
                    deleteConfirmText !== project.name
                  }
                  aria-disabled={deleteLoading || isPending}

                  className="gap-1.5"
                >
                  {(deleteLoading || isPending) && (
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
