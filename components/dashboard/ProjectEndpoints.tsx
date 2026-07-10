"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Activity, Plus, Edit2, Trash2, Loader2, ArrowRight } from "lucide-react";
import { createEndpoint, updateEndpoint, deleteEndpoint } from "@/lib/actions/endpoints";
import type { Endpoint, Route } from "@/db/schema";
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

// Endpoint with joined routes list
type EndpointWithRoutes = Endpoint & { routes: Route[] };

interface ProjectEndpointsProps {
  projectId: string;
  initialEndpoints: EndpointWithRoutes[];
}

/**
 * Interactive Client interface to add, edit, or remove endpoints under a project.
 */
export function ProjectEndpoints({ projectId, initialEndpoints }: ProjectEndpointsProps) {
  const router = useRouter();
  const [endpointsList, setEndpointsList] = React.useState<EndpointWithRoutes[]>(initialEndpoints);
  const [loading, setLoading] = React.useState(false);

  // Dialog control states
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // Form fields
  const [selectedId, setSelectedId] = React.useState("");
  const [name, setName] = React.useState("");
  const [basePath, setBasePath] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Endpoint name is required");
      return;
    }

    setLoading(true);
    try {
      const created = await createEndpoint({
        projectId,
        name,
        basePath: normalizePath(basePath),
        description,
      });
      toast.success(`Endpoint "${created.name}" created successfully.`);
      setCreateOpen(false);
      setName("");
      setBasePath("");
      setDescription("");
      router.refresh();
      // Simple reload of listing state
      setEndpointsList([...endpointsList, { ...created, routes: [] }]);
    } catch (err) {
      toast.error("Failed to create endpoint");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInit = (ep: EndpointWithRoutes) => {
    setSelectedId(ep.id);
    setName(ep.name);
    setBasePath(ep.basePath);
    setDescription(ep.description ?? "");
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Endpoint name is required");
      return;
    }

    setLoading(true);
    try {
      const updated = await updateEndpoint({
        id: selectedId,
        name,
        basePath: normalizePath(basePath),
        description,
      });
      toast.success("Endpoint updated successfully!");
      setEditOpen(false);
      router.refresh();
      setEndpointsList(
        endpointsList.map((ep) =>
          ep.id === selectedId
            ? { ...ep, name: updated.name, basePath: updated.basePath, description: updated.description }
            : ep
        )
      );
    } catch (err) {
      toast.error("Failed to update endpoint");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInit = (ep: EndpointWithRoutes) => {
    setSelectedId(ep.id);
    setName(ep.name);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteEndpoint(selectedId);
      toast.success(`Endpoint "${name}" deleted.`);
      setDeleteOpen(false);
      router.refresh();
      setEndpointsList(endpointsList.filter((ep) => ep.id !== selectedId));
    } catch (err) {
      toast.error("Failed to delete endpoint");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const normalizePath = (p: string) => {
    const trimmed = p.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Endpoint Groups</h2>
          <p className="text-muted-foreground text-xs mt-1">
            Group individual routes together under a shared base path.
          </p>
        </div>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" className="gap-1.5 shrink-0" />}>
            <Plus className="h-4 w-4" />
            <span>Add Endpoint Group</span>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New Endpoint Group</DialogTitle>
                <DialogDescription>
                  Group routes under a shared path prefix. (e.g. `/api/v1/auth/*`)
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="ep-name" className="text-sm font-semibold">
                    Group Name
                  </label>
                  <Input
                    id="ep-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. User Service"
                    maxLength={100}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="ep-basePath" className="text-sm font-semibold">
                    Base Path Prefix
                  </label>
                  <Input
                    id="ep-basePath"
                    value={basePath}
                    onChange={(e) => setBasePath(e.target.value)}
                    placeholder="e.g. /users or /v1"
                    maxLength={200}
                    disabled={loading}
                  />
                  <span className="text-[10px] text-muted-foreground italic">
                    If left blank, routes inside this group will map directly to project root namespace.
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="ep-desc" className="text-sm font-semibold">
                    Description
                  </label>
                  <Textarea
                    id="ep-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Endpoints matching auth functions..."
                    maxLength={500}
                    disabled={loading}
                    className="resize-none h-20"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="gap-1.5">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Create Group</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid listing */}
      {endpointsList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <Activity className="h-10 w-10 text-muted-foreground stroke-1 mb-4 animate-pulse" />
          <CardTitle className="text-lg">No Endpoint Groups</CardTitle>
          <CardDescription className="max-w-sm mt-1">
            Endpoint groups help catalog routes in structural namespaces. Create your first group to add custom dynamic routes.
          </CardDescription>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="mt-6 gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Create Group</span>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {endpointsList.map((ep) => (
            <Card key={ep.id} className="flex flex-col justify-between hover:border-muted-foreground/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg truncate">{ep.name}</CardTitle>
                    <span className="inline-block text-xs font-mono bg-muted border border-border px-2 py-0.5 rounded text-muted-foreground mt-0.5">
                      Prefix: {ep.basePath || "/ (Root)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEditInit(ep)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteInit(ep)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-2 mt-2 min-h-[2.5rem]">
                  {ep.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-2">
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{ep.routes.length} Active Routes</span>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-3 mt-4">
                <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-primary/5 group/btn" onClick={() => router.push(`/projects/${projectId}/canvas`)}>
                  <span>Open Route Canvas</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Endpoint Group</DialogTitle>
              <DialogDescription>Modify path namespace configurations.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-name" className="text-sm font-semibold">
                  Group Name
                </label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-basePath" className="text-sm font-semibold">
                  Base Path Prefix
                </label>
                <Input
                  id="edit-basePath"
                  value={basePath}
                  onChange={(e) => setBasePath(e.target.value)}
                  placeholder="/users"
                  maxLength={200}
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-desc" className="text-sm font-semibold">
                  Description
                </label>
                <Textarea
                  id="edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  disabled={loading}
                  className="resize-none h-20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-1.5">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Save Changes</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <span>Delete Endpoint Group</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete **{name}**? This will delete the endpoint group and **all its sub-routes permanently**. This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Delete Group</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
