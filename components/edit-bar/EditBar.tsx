"use client";

import * as React from "react";
import {
  RiSettings2Line,
  RiCodeLine,
  RiSaveLine,
  RiLoader2Line,
  RiFileCodeLine,
  RiDeleteBin6Line,
} from "@remixicon/react";
import { toast } from "sonner";
import { updateRoute, deleteRoute } from "@/lib/actions/routes";
import { SchemaStoreProvider, useSchemaStore } from "@/stores/store-provider";
import {
  parseSchemaToFields,
  synthesizeSchema,
} from "@/lib/schema-synthesizer";
import { FieldTree } from "./FieldTree";
import { ChaosConfig } from "./ChaosConfig";
import { HeadersEditor, type HeaderRow } from "./HeadersEditor";
import { RulesEditor } from "./RulesEditor";
import { TypeScriptPreview } from "./TypeScriptPreview";
import type { Route, Endpoint } from "@/db/schema";
import type { ConditionalRule } from "@/lib/mock-engine";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface EditBarProps {
  route: Route;
  projectSlug: string;
  endpoints: Endpoint[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRouteUpdated: (updatedRoute: Route) => void;
  onRouteDeleted: (routeId: string) => void;
}

/**
 * Visual editor side drawer panel for updating specific route configurations.
 */
function EditBarInner({
  route,
  onOpenChange,
  onRouteUpdated,
  onRouteDeleted,
}: {
  route: Route;
  onOpenChange: (open: boolean) => void;
  onRouteUpdated: (updatedRoute: Route) => void;
  onRouteDeleted: (routeId: string) => void;
}): React.JSX.Element {
  const [loading, setLoading] = React.useState(false);
  const [tsOpen, setTsOpen] = React.useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this route? This cannot be undone.",
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteRoute(route.id);
      toast.success("Route deleted successfully");
      onRouteDeleted(route.id);
    } catch {
      toast.error("Failed to delete route");
    } finally {
      setLoading(false);
    }
  };

  // Zustand state triggers
  const fields = useSchemaStore((state) => state.fields);
  const setSchema = useSchemaStore((state) => state.setSchema);

  // Sync visual field tree when target route changes
  React.useEffect(() => {
    try {
      const parsed = JSON.parse(route.responseSchema ?? "{}");
      const list = parseSchemaToFields(parsed);
      setSchema(list);
    } catch {
      setSchema([]);
    }
  }, [route, setSchema]);

  // Form states (editable parameters displayed in side drawer)
  const [method, setMethod] = React.useState<Route["method"]>(route.method);
  const [path, setPath] = React.useState(route.path);
  const [statusCode, setStatusCode] = React.useState(route.statusCode);
  const [isEnabled, setIsEnabled] = React.useState(route.isEnabled);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setMethod(route.method);
    setPath(route.path);
    setStatusCode(route.statusCode);
    setIsEnabled(route.isEnabled);
  }, [route]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const [latencyMin, setLatencyMin] = React.useState(route.latencyMin ?? 0);
  const [latencyMax, setLatencyMax] = React.useState(route.latencyMax ?? 0);
  const [errorRate, setErrorRate] = React.useState(route.errorRate ?? 0);

  // Parse initial headers
  const [headers, setHeaders] = React.useState<HeaderRow[]>(() => {
    try {
      const parsed = JSON.parse(route.customHeaders ?? "{}");
      return Object.entries(parsed).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    } catch {
      return [];
    }
  });

  // Parse initial rules
  const [rules, setRules] = React.useState<ConditionalRule[]>(() => {
    try {
      return JSON.parse(route.conditionalRules ?? "[]");
    } catch {
      return [];
    }
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Synthesize visual schema fields tree back to raw JSON schema string
      const schemaDoc = synthesizeSchema(fields);

      // 2. Reduce headers list to key-value record object
      const headerObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key.trim()) {
          headerObj[h.key.trim()] = h.value;
        }
      });

      // 3. Dispatch DB update via server action
      const updated = await updateRoute({
        id: route.id,
        method,
        path,
        statusCode,
        isEnabled,
        latencyMin,
        latencyMax,
        errorRate,
        responseSchema: JSON.stringify(schemaDoc),
        customHeaders: JSON.stringify(headerObj),
        conditionalRules: JSON.stringify(rules),
      });

      toast.success("Route details saved successfully!");
      onRouteUpdated(updated);
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to save route details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const schemaPreview = React.useMemo(() => {
    return JSON.stringify(synthesizeSchema(fields), null, 2);
  }, [fields]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SheetHeader className="border-border shrink-0 border-b pb-2">
        <SheetTitle className="flex items-center gap-1.5 text-base">
          <RiSettings2Line className="text-primary h-4 w-4" />
          <span>Edit Route Config</span>
        </SheetTitle>
        <SheetDescription className="text-[11px]">
          Simulate status codes, headers, delays, and configure response
          payloads.
        </SheetDescription>
      </SheetHeader>

      {/* Core Endpoint settings form fields (Method, Path, Status Code, Status Enabled) */}
      <div className="bg-muted/15 border-border/40 mt-3 shrink-0 space-y-3 rounded-lg border p-3.5">
        <div className="grid grid-cols-12 gap-3">
          {/* Method Selector */}
          <div className="col-span-4 flex flex-col gap-1">
            <label
              htmlFor="route-method"
              className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
            >
              Method
            </label>
            <select
              id="route-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as Route["method"])}
              className="border-input bg-background focus-visible:ring-ring flex h-8 w-full rounded border px-2.5 py-1 text-xs font-bold shadow-xs focus-visible:ring-1 focus-visible:outline-none"
              disabled={loading}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          {/* Path Input */}
          <div className="col-span-8 flex flex-col gap-1">
            <label
              htmlFor="route-path"
              className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
            >
              Route Path
            </label>
            <Input
              id="route-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="h-8 font-mono text-xs font-semibold"
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid grid-cols-12 items-center gap-3">
          {/* Status Code */}
          <div className="col-span-6 flex flex-col gap-1">
            <label
              htmlFor="route-status"
              className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
            >
              Response Status Code
            </label>
            <Input
              id="route-status"
              type="number"
              value={statusCode}
              onChange={(e) => setStatusCode(parseInt(e.target.value) || 200)}
              className="h-8 text-xs font-bold"
              disabled={loading}
              min={100}
              max={599}
            />
          </div>

          {/* Enabled Switch Row */}
          <div className="bg-background col-span-6 mt-4.5 flex h-8 items-center justify-between rounded border border-dashed px-3 py-1">
            <label
              htmlFor="route-enabled"
              className="text-muted-foreground cursor-pointer text-[10px] font-bold tracking-wider uppercase"
            >
              Route Enabled
            </label>
            <Switch
              id="route-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={loading}
              className="scale-75"
            />
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="schema"
        className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col"
      >
        <TabsList className="bg-muted grid h-8.5 shrink-0 grid-cols-5 rounded-lg p-1">
          <TabsTrigger
            value="schema"
            className="rounded-md px-1 text-[10.5px] font-bold"
          >
            Schema
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="rounded-md px-1 text-[10.5px] font-bold"
          >
            Rules
          </TabsTrigger>
          <TabsTrigger
            value="behavior"
            className="rounded-md px-1 text-[10.5px] font-bold"
          >
            Chaos
          </TabsTrigger>
          <TabsTrigger
            value="headers"
            className="rounded-md px-1 text-[10.5px] font-bold"
          >
            Headers
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="rounded-md px-1 text-[10.5px] font-bold"
          >
            Preview
          </TabsTrigger>
        </TabsList>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto py-2">
          {/* Schema Fields Builder Tab */}
          <TabsContent value="schema" className="m-0 h-full">
            <FieldTree />
          </TabsContent>

          {/* Smart Conditional Rules Tab */}
          <TabsContent value="rules" className="m-0 h-full">
            <RulesEditor rules={rules} onRulesChange={setRules} />
          </TabsContent>

          {/* Latency & Error Chaos Tab */}
          <TabsContent value="behavior" className="m-0 h-full">
            <ChaosConfig
              latencyMin={latencyMin}
              latencyMax={latencyMax}
              errorRate={errorRate}
              onLatencyMinChange={setLatencyMin}
              onLatencyMaxChange={setLatencyMax}
              onErrorRateChange={setErrorRate}
            />
          </TabsContent>

          {/* Custom Headers Tab */}
          <TabsContent value="headers" className="m-0 h-full">
            <HeadersEditor headers={headers} onHeadersChange={setHeaders} />
          </TabsContent>

          {/* JSON Schema Live Preview & TS Export Tab */}
          <TabsContent
            value="preview"
            className="m-0 flex h-full flex-col space-y-2"
          >
            <div className="border-border flex shrink-0 items-center justify-between border-b pb-1.5">
              <span className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                <RiFileCodeLine className="h-4 w-4" />
                <span>JSON Schema Preview</span>
              </span>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => setTsOpen(true)}
                className="h-7 gap-1 px-2.5 text-[10px] font-bold"
              >
                <RiCodeLine className="h-3.5 w-3.5" />
                <span>Generate types</span>
              </Button>
            </div>
            <div className="bg-muted min-h-0 flex-1 overflow-auto rounded-md border p-2 font-mono text-[10px]">
              <pre>{schemaPreview}</pre>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Save panel footer triggers */}
      <div className="border-border bg-card mt-auto flex shrink-0 items-center justify-between border-t pt-3">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
          className="h-8 gap-1 text-xs font-bold"
        >
          {loading ? (
            <RiLoader2Line className="h-4 w-4 animate-spin" />
          ) : (
            <RiDeleteBin6Line className="h-4 w-4" />
          )}
          <span>Delete</span>
        </Button>

        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-8 text-xs font-bold"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="h-8 gap-1 text-xs font-bold"
          >
            {loading ? (
              <RiLoader2Line className="h-4 w-4 animate-spin" />
            ) : (
              <RiSaveLine className="h-4 w-4" />
            )}
            <span>Save</span>
          </Button>
        </div>
      </div>

      <TypeScriptPreview
        routeId={route.id}
        open={tsOpen}
        onOpenChange={setTsOpen}
      />
    </div>
  );
}

/**
 * EditBar wrapper containing Sheet panel structure and Zustand store initialization.
 */
export function EditBar({
  route,
  open,
  onOpenChange,
  onRouteUpdated,
  onRouteDeleted,
}: EditBarProps) {
  // Parse initial fields array to populate Zustand provider
  const initialFields = React.useMemo(() => {
    try {
      const parsed = JSON.parse(route.responseSchema ?? "{}");
      return parseSchemaToFields(parsed);
    } catch {
      return [];
    }
  }, [route]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col overflow-hidden p-4 sm:max-w-135">
        <SchemaStoreProvider initialFields={initialFields}>
          <EditBarInner
            route={route}
            onOpenChange={onOpenChange}
            onRouteUpdated={onRouteUpdated}
            onRouteDeleted={onRouteDeleted}
          />
        </SchemaStoreProvider>
      </SheetContent>
    </Sheet>
  );
}
export default EditBar;
