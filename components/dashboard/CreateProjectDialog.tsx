"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsBoolean } from "nuqs";
import { toast } from "sonner";
import { RiLoader2Line } from "@remixicon/react";
import { createProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugifyInput } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CreateProjectDialog(): React.JSX.Element {
  const router = useRouter();

  const [newProjectQuery, setNewProjectQuery] = useQueryState(
    "new",
    parseAsBoolean.withDefault(false),
  );

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const isCreateOpen = open || newProjectQuery;

  const handleCreateOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val && newProjectQuery) {
      setNewProjectQuery(null);
    }
  };

  React.useEffect(() => {
    const handleOpen = () => setOpen(true);
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
    const cleanedSlug = slug.trim()
      ? slug.trim().replace(/^\/+|\/+$/g, "")
      : undefined;
    if (cleanedSlug && !/^[a-z0-9_/-]+$/.test(cleanedSlug)) {
      toast.error(
        "Slug must be lowercase alphanumeric with hyphens, underscores, or slashes",
      );
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
      handleCreateOpenChange(false);
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
    <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a new isolated project namespace for your mock routes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="global-proj-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="global-proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Billing Service"
                maxLength={100}
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="global-proj-slug" className="text-sm font-medium">
                Namespace Slug
              </label>
              <Input
                id="global-proj-slug"
                value={slug}
                onChange={(e) => setSlug(slugifyInput(e.target.value))}
                placeholder="e.g., billing-service"
                maxLength={100}
                disabled={loading}
              />
              <span className="text-muted-foreground text-mini">
                Determines mock base URL: `/
                {'{slug || "slug-derived-from-name"}'}`. Lowercase with hyphens.
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="global-proj-description"
                className="text-sm font-medium"
              >
                Description
              </label>
              <Input
                id="global-proj-description"
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
              title="Cancel creation"
              aria-label="Cancel creation"
              onClick={() => handleCreateOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              aria-disabled={loading}
              title="Create Workspace"
              aria-label="Create Workspace"
            >
              {loading ? (
                <>
                  <RiLoader2Line
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Workspace</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
