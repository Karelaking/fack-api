"use client";

import * as React from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { RiLoader2Line } from "@remixicon/react";
import { createRoute } from "@/lib/actions/routes";
import { httpMethods } from "@/lib/validators";
import type { Endpoint, Route } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const addRouteFormSchema = z.object({
  endpointId: z.string().min(1, "Please select an endpoint group."),
  method: z.enum(httpMethods),
  path: z.string().min(1, "Route path is required.").max(200),
  statusCode: z
    .number()
    .int()
    .min(100, "Status code must be between 100 and 599.")
    .max(599, "Status code must be between 100 and 599."),
  includeDefaults: z.boolean(),
});

type AddRouteFormData = z.infer<typeof addRouteFormSchema>;

interface AddRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoints: Endpoint[];
  onRouteAdded: (newRoute: Route) => void;
}

/**
 * Modal form dialog to register a new route under an endpoint group.
 */
export const AddRouteDialog = ({
  open,
  onOpenChange,
  endpoints,
  onRouteAdded,
}: AddRouteDialogProps): React.JSX.Element => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddRouteFormData>({
    resolver: zodResolver(addRouteFormSchema),
    defaultValues: {
      endpointId: endpoints[0]?.id ?? "",
      method: "GET",
      path: "",
      statusCode: 200,
      includeDefaults: true,
    },
  });

  React.useEffect(() => {
    if (open && endpoints.length > 0) {
      reset({
        endpointId: endpoints[0].id,
        method: "GET",
        path: "",
        statusCode: 200,
        includeDefaults: true,
      });
    }
  }, [open, endpoints, reset]);

  const onSubmit = async (data: AddRouteFormData) => {
    const cleanPath = data.path.trim().startsWith("/")
      ? data.path.trim()
      : `/${data.path.trim()}`;

    try {
      let responseSchema = "{}";
      if (data.includeDefaults) {
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
        endpointId: data.endpointId,
        method: data.method,
        path: cleanPath,
        statusCode: data.statusCode,
        responseSchema,
      });

      toast.success("Route node created!");
      onRouteAdded(newRoute);
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to create route");
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={handleSubmit(onSubmit)}>
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
                <div className="flex flex-col gap-1.5 border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-500">
                  <span className="font-semibold">
                    No Endpoint Groups found.
                  </span>
                  <span className="text-muted-foreground text-[10px] leading-normal font-normal">
                    You need at least one Endpoint Group to add routes. Go to
                    the <strong>Endpoints</strong> tab to create one.
                  </span>
                </div>
              ) : (
                <Controller
                  control={control}
                  name="endpointId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        aria-label="Endpoint Group"
                        className="w-full"
                      >
                        <span className="truncate" data-slot="select-value">
                          {endpoints.find((ep) => ep.id === field.value)
                            ? `${endpoints.find((ep) => ep.id === field.value)?.name} (${endpoints.find((ep) => ep.id === field.value)?.basePath || "/"})`
                            : "Select a group..."}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {endpoints.map((ep) => (
                            <SelectItem key={ep.id} value={ep.id}>
                              {ep.name} ({ep.basePath || "/"})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.endpointId && (
                <span className="text-destructive text-xs">
                  {errors.endpointId.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 flex flex-col gap-2">
                <label className="text-sm font-semibold">Method</label>
                <Controller
                  control={control}
                  name="method"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting || endpoints.length === 0}
                    >
                      <SelectTrigger
                        aria-label="HTTP Method"
                        variant="mono"
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <label htmlFor="route-path" className="text-sm font-semibold">
                  Sub-Path
                </label>
                <Input
                  id="route-path"
                  {...register("path")}
                  placeholder="e.g. /login or /:id"
                  maxLength={200}
                  disabled={isSubmitting || endpoints.length === 0}
                />
                {errors.path && (
                  <span className="text-destructive text-xs">
                    {errors.path.message}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="route-statusCode"
                className="text-sm font-semibold"
              >
                Default Status Code
              </label>
              <Input
                id="route-statusCode"
                type="number"
                {...register("statusCode", { valueAsNumber: true })}
                placeholder="200"
                min={100}
                max={599}
                disabled={isSubmitting || endpoints.length === 0}
              />
              {errors.statusCode && (
                <span className="text-destructive text-xs">
                  {errors.statusCode.message}
                </span>
              )}
            </div>
            <div className="bg-muted/10 flex items-center justify-between border p-3">
              <div className="space-y-0.5">
                <label
                  htmlFor="include-defaults"
                  className="block text-xs font-semibold"
                >
                  Generate Starter Schema
                </label>
                <span className="text-muted-foreground block text-[10px] leading-normal">
                  Include default JSON schema properties (`id`, `createdAt`,
                  `updatedAt`).
                </span>
              </div>
              <Controller
                control={control}
                name="includeDefaults"
                render={({ field }) => (
                  <Switch
                    id="include-defaults"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting || endpoints.length === 0}
                  />
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              title="Cancel creation"
              aria-label="Cancel creation"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || endpoints.length === 0}
              aria-disabled={isSubmitting}
              title="Create Node"
              aria-label="Create Node"
            >
              {isSubmitting ? (
                <>
                  <RiLoader2Line
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Node</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
