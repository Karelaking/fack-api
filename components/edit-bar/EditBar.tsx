"use client";

import * as React from "react";
import {
  RiSettings2Line,
  RiCodeLine,
  RiSaveLine,
  RiLoader2Line,
  RiFileCodeLine,
  RiFileCopyLine,
  RiDeleteBin6Line,
  RiArrowDownSLine,
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
  projectSlug,
  endpoints,
  onOpenChange,
  onRouteUpdated,
  onRouteDeleted,
}: {
  route: Route;
  projectSlug: string;
  endpoints: Endpoint[];
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

  React.useEffect(() => {
    setMethod(route.method);
    setPath(route.path);
    setStatusCode(route.statusCode);
    setIsEnabled(route.isEnabled);
  }, [route]);

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

  const parentEndpoint = React.useMemo(() => {
    return endpoints.find((ep) => ep.id === route.endpointId);
  }, [endpoints, route.endpointId]);

  const basePath = parentEndpoint?.basePath || "";

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const fullMockUrl = `${origin}/${projectSlug}${basePath}${route.path}`;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SheetHeader className="border-border shrink-0 border-b pb-1.5">
        <SheetTitle className="flex items-center gap-1.5 text-base">
          <RiSettings2Line className="text-primary h-4 w-4" />
          <span>Edit Route Config</span>
        </SheetTitle>
        <SheetDescription className="text-[11px]">
          Simulate status codes, headers, delays, and configure response
          payloads.
        </SheetDescription>
      </SheetHeader>

      {/* Copyable Mock URL Input bar */}
      <div className="border-border bg-muted/30 mt-2.5 flex shrink-0 flex-col gap-1 rounded-md border p-2">
        <label className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase">
          Mock Endpoint URL
        </label>
        <div className="flex items-center gap-1">
          <span className="border-border bg-card text-foreground flex h-7 flex-1 items-center truncate rounded border px-2 font-mono text-[11px] select-all">
            {fullMockUrl}
          </span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="hover:bg-primary/5 h-7 w-7 shrink-0"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(fullMockUrl);
                toast.success("Mock URL copied to clipboard!");
              } catch {
                toast.error("Failed to copy URL");
              }
            }}
          >
            <RiFileCopyLine className="h-4 w-4" />
          </Button>
        </div>

        {/* Collapsible Default RESTful Query Endpoints */}
        <details className="group border-border/50 mt-1 border-t pt-1.5 text-xs">
          <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center justify-between text-[9px] font-bold tracking-wider uppercase transition-colors select-none">
            <span>Query & Pagination Endpoints</span>
            <RiArrowDownSLine className="text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-1.5 max-h-27.5 space-y-1 overflow-y-auto pt-0.5 pr-1 pb-1">
            {[
              {
                label: "Limit Items (limit)",
                suffix: "?limit=5",
                desc: "Limits the generated array payload to exactly N items.",
              },
              {
                label: "Limit Items (count)",
                suffix: "?count=10",
                desc: "Alternative parameter to specify the limit.",
              },
              {
                label: "Pagination",
                suffix: "?page=2&limit=5",
                desc: "Retrieves a paginated chunk of mock database items.",
              },
              {
                label: "Global Search",
                suffix: "?q=search_term",
                desc: "Searches all fields for matches containing the query.",
              },
              {
                label: "Sorting",
                suffix: "?sort=createdAt&order=desc",
                desc: "Sorts records by a specific field in asc/desc order.",
              },
              {
                label: "Field Filter",
                suffix: "?id=uuid-here",
                desc: "Filters generated array by field exact matches.",
              },
            ].map((opt, oIdx) => {
              const optUrl = `${fullMockUrl}${opt.suffix}`;
              return (
                <div
                  key={oIdx}
                  className="border-border/30 bg-muted/20 flex flex-col gap-0.5 rounded border p-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-foreground text-[11px] font-semibold">
                      {opt.label}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:bg-primary/5 hover:text-foreground h-5 w-5 shrink-0"
                      title={`Copy URL for ${opt.label}`}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(optUrl);
                          toast.success(`Copied query: ${opt.label}`);
                        } catch {
                          toast.error("Failed to copy URL");
                        }
                      }}
                    >
                      <RiFileCopyLine className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="border-border bg-card text-muted-foreground truncate rounded border px-1.5 py-0.5 font-mono text-[9px] select-all">
                    {optUrl}
                  </span>
                  <span className="text-muted-foreground/80 text-[10px] leading-normal">
                    {opt.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </details>
      </div>

      {/* Core Endpoint settings form fields (Method, Path, Status Code, Status Enabled) */}
      <div className="mt-3.5 grid grid-cols-12 gap-3 border-b border-border pb-3.5 shrink-0">
        <div className="col-span-3 flex flex-col gap-1.5">
          <label htmlFor="route-method" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Method
          </label>
          <select
            id="route-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={loading}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>

        <div className="col-span-4 flex flex-col gap-1.5">
          <label htmlFor="route-path" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Route Path
          </label>
          <Input
            id="route-path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="h-8 text-xs font-mono"
            disabled={loading}
          />
        </div>

        <div className="col-span-3 flex flex-col gap-1.5">
          <label htmlFor="route-status" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Status Code
          </label>
          <Input
            id="route-status"
            type="number"
            value={statusCode}
            onChange={(e) => setStatusCode(parseInt(e.target.value) || 200)}
            className="h-8 text-xs"
            disabled={loading}
            min={100}
            max={599}
          />
        </div>

        <div className="col-span-2 flex flex-col items-center justify-center gap-1 pt-3.5">
          <Switch
            id="route-enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            disabled={loading}
          />
          <label htmlFor="route-enabled" className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer">
            Enabled
          </label>
        </div>
      </div>

      <Tabs
        defaultValue="schema"
        className="mt-2.5 flex min-h-0 min-w-0 flex-1 flex-col"
      >
        <TabsList className="bg-muted grid h-8 shrink-0 grid-cols-5">
          <TabsTrigger
            value="schema"
            className="px-1.5 text-[11px] font-semibold"
          >
            Schema
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="px-1.5 text-[11px] font-semibold"
          >
            Rules
          </TabsTrigger>
          <TabsTrigger
            value="behavior"
            className="px-1.5 text-[11px] font-semibold"
          >
            Chaos
          </TabsTrigger>
          <TabsTrigger
            value="headers"
            className="px-1.5 text-[11px] font-semibold"
          >
            Headers
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="px-1.5 text-[11px] font-semibold"
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
      <div className="border-border bg-card mt-auto flex shrink-0 items-center justify-between border-t pt-2.5">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
          className="h-8 gap-1 text-xs font-semibold"
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
            className="h-8 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="h-8 gap-1 text-xs font-semibold"
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
  projectSlug,
  endpoints,
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
      <SheetContent className="flex h-full w-full flex-col overflow-hidden p-3.5 sm:max-w-135">
        <SchemaStoreProvider initialFields={initialFields}>
          <EditBarInner
            route={route}
            projectSlug={projectSlug}
            endpoints={endpoints}
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
