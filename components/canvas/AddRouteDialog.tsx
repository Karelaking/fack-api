"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createRoute } from "@/lib/actions/routes";
import type { Endpoint, Route } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoints: Endpoint[];
  onRouteAdded: (newRoute: Route) => void;
}

/**
 * Modal form dialog to register a new route under an endpoint group.
 */
export function AddRouteDialog({
  open,
  onOpenChange,
  endpoints,
  onRouteAdded,
}: AddRouteDialogProps): React.JSX.Element {
  const [loading, setLoading] = React.useState(false);

  // Form states
  const [endpointId, setEndpointId] = React.useState("");
  const [method, setMethod] = React.useState<
    "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  >("GET");
  const [path, setPath] = React.useState("");
  const [statusCode, setStatusCode] = React.useState("200");
  const [includeDefaults, setIncludeDefaults] = React.useState(true);

  React.useEffect(() => {
    if (open && endpoints.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEndpointId(endpoints[0].id);
    }
  }, [open, endpoints]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endpointId) {
      toast.error("Please select or create an endpoint group first.");
      return;
    }
    if (!path.trim()) {
      toast.error("Route path is required.");
      return;
    }

    const cleanPath = path.trim().startsWith("/")
      ? path.trim()
      : `/${path.trim()}`;
    const code = parseInt(statusCode, 10);

    if (isNaN(code) || code < 100 || code > 599) {
      toast.error("Status code must be between 100 and 599.");
      return;
    }

    setLoading(true);
    try {
      let responseSchema = "{}";
      if (includeDefaults) {
        responseSchema = JSON.stringify({
          type: "object",
          properties: {
            id: {
              type: "string",
              faker: "string.uuid",
              "x-faker": "string.uuid",
            },
            createdAt: {
              type: "string",
              faker: "date.past",
              "x-faker": "date.past",
            },
            updatedAt: {
              type: "string",
              faker: "date.recent",
              "x-faker": "date.recent",
            },
          },
          required: ["id", "createdAt", "updatedAt"],
        });
      }

      const newRoute = await createRoute({
        endpointId,
        method,
        path: cleanPath,
        statusCode: code,
        responseSchema,
      });

      toast.success("Route node created!");
      onRouteAdded(newRoute);
      setPath("");
      setStatusCode("200");
      setIncludeDefaults(true);
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to create route");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Route Node</DialogTitle>
            <DialogDescription>
              Create a new endpoint route segment on the visual canvas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Endpoint Group</label>
              {endpoints.length === 0 ? (
                <div className="flex flex-col gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-600 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400">
                  <span className="font-semibold">
                    No Endpoint Groups found.
                  </span>
                  <span className="text-muted-foreground text-[10px] leading-normal font-normal">
                    You need at least one Endpoint Group to add routes. Go to
                    the <strong>Endpoints</strong> tab to create one.
                  </span>
                </div>
              ) : (
                <Select
                  value={endpointId}
                  onValueChange={(val) => setEndpointId(val ?? "")}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <span className="truncate" data-slot="select-value">
                      {endpoints.find((ep) => ep.id === endpointId)
                        ? `${endpoints.find((ep) => ep.id === endpointId)?.name} (${endpoints.find((ep) => ep.id === endpointId)?.basePath || "/"})`
                        : "Select a group..."}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {endpoints.map((ep) => (
                      <SelectItem key={ep.id} value={ep.id}>
                        {ep.name} ({ep.basePath || "/"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1 flex flex-col gap-2">
                <label className="text-sm font-semibold">Method</label>
                <Select
                  value={method}
                  onValueChange={(val) => {
                    if (
                      val === "GET" ||
                      val === "POST" ||
                      val === "PUT" ||
                      val === "DELETE" ||
                      val === "PATCH"
                    )
                      setMethod(val);
                  }}
                  disabled={loading || endpoints.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <span data-slot="select-value">{method}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <label htmlFor="route-path" className="text-sm font-semibold">
                  Path
                </label>
                <Input
                  id="route-path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="e.g. /:id/profile"
                  disabled={loading || endpoints.length === 0}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="route-status" className="text-sm font-semibold">
                Default Status Code
              </label>
              <Input
                id="route-status"
                type="number"
                value={statusCode}
                onChange={(e) => setStatusCode(e.target.value)}
                placeholder="200"
                min={100}
                max={599}
                disabled={loading || endpoints.length === 0}
              />
            </div>
            <div className="border-border bg-muted/20 flex items-center justify-between rounded-lg border p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold">Default Fields</span>
                <span className="text-muted-foreground text-[10px] leading-normal">
                  Pre-populate schema with id, createdAt, and updatedAt.
                </span>
              </div>
              <Switch
                checked={includeDefaults}
                onCheckedChange={setIncludeDefaults}
                disabled={loading || endpoints.length === 0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || endpoints.length === 0}
              className="gap-1.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Create Node</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
