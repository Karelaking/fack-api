"use client";

import * as React from "react";
import {
  RiSettings2Line,
  RiCodeLine,
  RiSaveLine,
  RiLoader2Line,
  RiFileCodeLine,
  RiDeleteBin6Line,
  RiFileCopyLine,
  RiCheckLine,
} from "@remixicon/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

const HTTP_METHODS: Route["method"][] = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
];

const METHOD_THEMES: Record<
  Route["method"],
  { active: string; inactive: string }
> = {
  GET: {
    active:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-xs",
    inactive: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  },
  POST: {
    active:
      "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40 shadow-xs",
    inactive: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  },
  PUT: {
    active:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 shadow-xs",
    inactive: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  },
  DELETE: {
    active:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40 shadow-xs",
    inactive: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  },
  PATCH: {
    active:
      "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/40 shadow-xs",
    inactive: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  },
};

const STATUS_PRESETS = [200, 201, 204, 400, 404, 500] as const;

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

  const [copiedJson, setCopiedJson] = React.useState(false);

  const schemaPreview = React.useMemo(() => {
    return JSON.stringify(synthesizeSchema(fields), null, 2);
  }, [fields]);

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(schemaPreview);
      setCopiedJson(true);
      toast.success("JSON Schema copied to clipboard");
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      toast.error("Failed to copy schema");
    }
  };

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

      {/* Sleek SaaS Route Header (Method Chips, Path Input, Status Code & Enable Toggle) */}
      <div className="bg-muted/20 border-border mt-3 shrink-0 space-y-2.5 border p-3">
        {/* Row 1: Method Selector Chips + Route Enabled Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Method Chips */}
          <div className="flex items-center gap-1">
            {HTTP_METHODS.map((m) => {
              const isActive = method === m;
              const theme = METHOD_THEMES[m];
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  disabled={loading}
                  className={cn(
                    "cursor-pointer border px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase transition-all duration-150 select-none",
                    isActive
                      ? theme.active
                      : cn("border-transparent", theme.inactive),
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Route Enabled Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              {isEnabled ? "Active" : "Disabled"}
            </span>
            <Switch
              id="route-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={loading}
              className="scale-75"
            />
          </div>
        </div>

        {/* Row 2: Route Path Input */}
        <div className="space-y-1">
          <label
            htmlFor="route-path"
            className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase"
          >
            Route Path
          </label>
          <Input
            id="route-path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/endpoint/path"
            className="h-8 font-mono text-xs font-semibold"
            disabled={loading}
          />
        </div>

        {/* Row 3: Status Code with Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground mr-1 text-[10px] font-bold tracking-wider uppercase">
              Status:
            </span>
            {STATUS_PRESETS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setStatusCode(code)}
                disabled={loading}
                className={cn(
                  "cursor-pointer border px-1.5 py-0.5 font-mono text-[10px] font-bold transition-colors",
                  statusCode === code
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted border-border",
                )}
              >
                {code}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <label
              htmlFor="route-status"
              className="text-muted-foreground text-[10px] font-bold uppercase"
            >
              Custom:
            </label>
            <Input
              id="route-status"
              type="number"
              value={statusCode}
              onChange={(e) => setStatusCode(parseInt(e.target.value) || 200)}
              className="h-7 w-16 text-center font-mono text-xs font-bold"
              disabled={loading}
              min={100}
              max={599}
            />
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="schema"
        className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col"
      >
        <TabsList className="bg-muted grid h-8.5 shrink-0 grid-cols-5 p-1">
          <TabsTrigger
            value="schema"
            className="gap-1 px-1 text-[10.5px] font-bold"
          >
            <span>Schema</span>
            <span className="bg-muted-foreground/15 text-muted-foreground py-0.2 rounded-xs px-1 font-mono text-[9px]">
              {fields.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="rules"
            className="gap-1 px-1 text-[10.5px] font-bold"
          >
            <span>Rules</span>
            {rules.length > 0 && (
              <span className="bg-primary/15 text-primary py-0.2 rounded-xs px-1 font-mono text-[9px] font-extrabold">
                {rules.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="behavior"
            className="gap-1 px-1 text-[10.5px] font-bold"
          >
            <span>Chaos</span>
            {(latencyMin > 0 || latencyMax > 0 || errorRate > 0) && (
              <span className="py-0.2 rounded-xs bg-amber-500/15 px-1 font-mono text-[9px] font-bold text-amber-600 dark:text-amber-400">
                ON
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="headers"
            className="gap-1 px-1 text-[10.5px] font-bold"
          >
            <span>Headers</span>
            {headers.length > 0 && (
              <span className="py-0.2 rounded-xs bg-blue-500/15 px-1 font-mono text-[9px] font-extrabold text-blue-600 dark:text-blue-400">
                {headers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preview" className="px-1 text-[10.5px] font-bold">
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
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Copy Schema JSON"
                  aria-label="Copy Schema JSON"
                  onClick={handleCopySchema}
                  className="h-7 gap-1 px-2 text-[10px] font-bold"
                >
                  {copiedJson ? (
                    <RiCheckLine className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <RiFileCopyLine className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Generate types"
                  aria-label="Generate types"
                  onClick={() => setTsOpen(true)}
                  className="h-7 gap-1 px-2 text-[10px] font-bold"
                >
                  <RiCodeLine className="h-3.5 w-3.5" />
                  <span>Types</span>
                </Button>
              </div>
            </div>
            <div className="bg-muted min-h-0 flex-1 overflow-auto border p-2 font-mono text-[10px]">
              <pre>{schemaPreview}</pre>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Save panel footer triggers */}
      <div className="border-border bg-card mt-auto flex shrink-0 items-center justify-between border-t pt-3">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          title="Delete Route"
          aria-label="Delete Route"
          onClick={handleDelete}
          disabled={loading}
          aria-disabled={loading}
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
            type="button"
            variant="outline"
            size="sm"
            title="Cancel edits"
            aria-label="Cancel edits"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-8 text-xs font-bold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            title="Save Route"
            aria-label="Save Route"
            onClick={handleSave}
            disabled={loading}
            aria-disabled={loading}
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
      <SheetContent
        aria-label="Edit Route Config"
        className="flex h-full w-full flex-col overflow-hidden p-4 sm:max-w-135"
      >
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
