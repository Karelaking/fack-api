"use client";

import * as React from "react";
import { Network, Activity, Settings2, Code, Save, Loader2, FileJson, Copy } from "lucide-react";
import { toast } from "sonner";
import { updateRoute } from "@/lib/actions/routes";
import { SchemaStoreProvider, useSchemaStore } from "@/stores/store-provider";
import { parseSchemaToFields, synthesizeSchema } from "@/lib/schema-synthesizer";
import { FieldTree } from "./FieldTree";
import { ChaosConfig } from "./ChaosConfig";
import { HeadersEditor, type HeaderRow } from "./HeadersEditor";
import { TypeScriptPreview } from "./TypeScriptPreview";
import type { Route, Endpoint } from "@/db/schema";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface EditBarProps {
  route: Route;
  projectSlug: string;
  endpoints: Endpoint[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRouteUpdated: (updatedRoute: Route) => void;
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
}: {
  route: Route;
  projectSlug: string;
  endpoints: Endpoint[];
  onOpenChange: (open: boolean) => void;
  onRouteUpdated: (updatedRoute: Route) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [tsOpen, setTsOpen] = React.useState(false);

  // Zustand state triggers
  const fields = useSchemaStore((state) => state.fields);
  const setSchema = useSchemaStore((state) => state.setSchema);

  // Sync visual field tree when target route changes
  React.useEffect(() => {
    try {
      const parsed = JSON.parse(route.responseSchema ?? "{}");
      const list = parseSchemaToFields(parsed);
      setSchema(list);
    } catch (e) {
      setSchema([]);
    }
  }, [route, setSchema]);

  // Form states
  const [method, setMethod] = React.useState(route.method);
  const [path, setPath] = React.useState(route.path);
  const [statusCode, setStatusCode] = React.useState(route.statusCode);
  const [isEnabled, setIsEnabled] = React.useState(route.isEnabled);
  const [latencyMin, setLatencyMin] = React.useState(route.latencyMin ?? 0);
  const [latencyMax, setLatencyMax] = React.useState(route.latencyMax ?? 0);
  const [errorRate, setErrorRate] = React.useState(route.errorRate ?? 0);

  // Parse initial headers
  const [headers, setHeaders] = React.useState<HeaderRow[]>(() => {
    try {
      const parsed = JSON.parse(route.customHeaders ?? "{}");
      return Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
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

  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fullMockUrl = `${origin}/mock/${projectSlug}${basePath}${route.path}`;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <SheetHeader className="pb-3 border-b border-border shrink-0">
        <SheetTitle className="text-lg flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <span>Edit Route Config</span>
        </SheetTitle>
        <SheetDescription className="text-xs">
          Simulate status codes, headers, delays, and configure response payloads.
        </SheetDescription>
      </SheetHeader>

      {/* Copyable Mock URL Input bar */}
      <div className="mt-4 flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-muted/30 shrink-0">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Mock Endpoint URL
        </label>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-foreground select-all truncate flex-1 bg-card border border-border px-2.5 py-1 rounded h-8 flex items-center">
            {fullMockUrl}
          </span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0 hover:bg-primary/5"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(fullMockUrl);
                toast.success("Mock URL copied to clipboard!");
              } catch {
                toast.error("Failed to copy URL");
              }
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="schema" className="flex-1 flex flex-col min-h-0 min-w-0 mt-4">
        <TabsList className="grid grid-cols-4 shrink-0 bg-muted">
          <TabsTrigger value="schema" className="text-xs font-semibold">Schema</TabsTrigger>
          <TabsTrigger value="behavior" className="text-xs font-semibold">Chaos</TabsTrigger>
          <TabsTrigger value="headers" className="text-xs font-semibold">Headers</TabsTrigger>
          <TabsTrigger value="preview" className="text-xs font-semibold">Preview</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto py-4 min-h-0 min-w-0">
          {/* Schema Fields Builder Tab */}
          <TabsContent value="schema" className="m-0 h-full">
            <FieldTree />
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
          <TabsContent value="preview" className="m-0 h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <FileJson className="h-4 w-4" />
                <span>JSON Schema Preview</span>
              </span>
              <Button type="button" size="xs" variant="outline" onClick={() => setTsOpen(true)} className="h-7 text-[10px] px-2.5 font-bold gap-1">
                <Code className="h-3.5 w-3.5" />
                <span>Generate types</span>
              </Button>
            </div>
            <div className="flex-1 min-h-0 bg-muted border rounded-lg p-3 overflow-auto font-mono text-[10px]">
              <pre>{schemaPreview}</pre>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Save panel footer triggers */}
      <div className="border-t border-border pt-4 mt-auto shrink-0 flex justify-end gap-2 bg-card">
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="text-xs font-semibold">
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={loading} className="gap-1.5 text-xs font-semibold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Configuration</span>
        </Button>
      </div>

      <TypeScriptPreview routeId={route.id} open={tsOpen} onOpenChange={setTsOpen} />
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
      <SheetContent className="w-full sm:max-w-[500px] h-full overflow-hidden flex flex-col p-6">
        <SchemaStoreProvider initialFields={initialFields}>
          <EditBarInner
            route={route}
            projectSlug={projectSlug}
            endpoints={endpoints}
            onOpenChange={onOpenChange}
            onRouteUpdated={onRouteUpdated}
          />
        </SchemaStoreProvider>
      </SheetContent>
    </Sheet>
  );
}
export default EditBar;
