"use client";

import * as React from "react";
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiFolderLine,
  RiTimeLine,
  RiAlertLine,
  RiCodeSSlashLine,
  RiFileTextLine,
  RiFileCopyLine,
  RiCheckLine,
} from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  GeneratedApi,
  GeneratedEndpoint,
  GeneratedRoute,
  ApiChangeSet,
} from "@/lib/types/ai.type";
import { convertPropertiesToJsonSchema } from "@/lib/services/schema.service";

interface ApiChangeSetPreviewProps {
  api: GeneratedApi;
  changeSet?: ApiChangeSet;
  detailedPrompt?: string;
  detailedSummary?: string;
}

const METHOD_COLOR_CLASSES: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  PATCH:
    "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  DELETE: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

export const ApiChangeSetPreview = ({
  api,
  changeSet,
  detailedPrompt,
  detailedSummary,
}: ApiChangeSetPreviewProps): React.JSX.Element => {
  const totalRoutes = api.endpoints.reduce(
    (sum, ep) => sum + ep.routes.length,
    0,
  );
  const totalProperties = api.endpoints.reduce(
    (sum, ep) =>
      sum + ep.routes.reduce((rSum, r) => rSum + r.properties.length, 0),
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header Summary Banner */}
      <div className="border-border/80 bg-muted/40 flex items-center justify-between rounded-xl border px-4 py-3">
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-semibold">
            {api.name}
          </span>
          {api.description && (
            <span className="text-muted-foreground text-xs">
              {api.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {changeSet ? (
            <>
              {changeSet.routesToCreate.length > 0 && (
                <span className="focus:ring-ring inline-flex items-center rounded-md border border-transparent bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
                  +{changeSet.routesToCreate.length} Routes
                </span>
              )}
              {changeSet.routesToUpdate.length > 0 && (
                <span className="focus:ring-ring inline-flex items-center rounded-md border border-transparent bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
                  ~{changeSet.routesToUpdate.length} Modified
                </span>
              )}
              {changeSet.routesToDelete.length > 0 && (
                <span className="focus:ring-ring inline-flex items-center rounded-md border border-transparent bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-600 transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
                  -{changeSet.routesToDelete.length} Deleted
                </span>
              )}
            </>
          ) : (
            <>
              <Badge variant="secondary">
                {api.endpoints.length} Endpoints
              </Badge>
              <Badge variant="secondary">{totalRoutes} Routes</Badge>
              <Badge variant="secondary">{totalProperties} Fields</Badge>
            </>
          )}
        </div>
      </div>

      {/* Detailed Blueprint from Stage 2 Prompt Expansion */}
      {detailedPrompt && (
        <DetailedBlueprintCard
          detailedPrompt={detailedPrompt}
          detailedSummary={detailedSummary}
        />
      )}

      {/* Endpoints & Routes Tree */}
      <div className="flex flex-col gap-3">
        {api.endpoints.map((endpoint) => (
          <EndpointCard key={endpoint.name} endpoint={endpoint} />
        ))}
      </div>
    </div>
  );
};

const DetailedBlueprintCard = ({
  detailedPrompt,
  detailedSummary,
}: {
  detailedPrompt: string;
  detailedSummary?: string;
}): React.JSX.Element => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(detailedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="border-border/70 bg-card/60 flex flex-col rounded-xl border shadow-2xs">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {isExpanded ? (
            <RiArrowDownSLine className="text-muted-foreground size-4 shrink-0" />
          ) : (
            <RiArrowRightSLine className="text-muted-foreground size-4 shrink-0" />
          )}
          <RiFileTextLine className="text-primary size-4 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-foreground text-xs font-semibold">
              Architecture Design Specification
            </span>
            {detailedSummary && (
              <span className="text-muted-foreground line-clamp-1 text-[11px]">
                {detailedSummary}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="xs" onClick={handleCopy}>
            {copied ? (
              <span className="flex items-center gap-1 text-emerald-500">
                <RiCheckLine className="size-3.5" />
                <span>Copied</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <RiFileCopyLine className="size-3.5" />
                <span>Copy Spec</span>
              </span>
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-border/60 bg-muted/20 border-t p-4">
          <pre className="text-foreground/90 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
            {detailedPrompt}
          </pre>
        </div>
      )}
    </div>
  );
};

const EndpointCard = ({
  endpoint,
}: {
  endpoint: GeneratedEndpoint;
}): React.JSX.Element => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="border-border/70 bg-card/60 flex flex-col rounded-xl border shadow-2xs">
      {/* Endpoint Header Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-left transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <RiArrowDownSLine className="text-muted-foreground size-4 shrink-0" />
          ) : (
            <RiArrowRightSLine className="text-muted-foreground size-4 shrink-0" />
          )}
          <RiFolderLine className="text-primary size-4 shrink-0" />
          <span className="text-foreground text-xs font-semibold">
            {endpoint.name}
          </span>
          <span className="text-muted-foreground font-mono text-xs">
            ({endpoint.basePath})
          </span>
        </div>
        <Badge variant="outline">
          {endpoint.routes.length} route{endpoint.routes.length > 1 ? "s" : ""}
        </Badge>
      </button>

      {/* Endpoint Routes List */}
      {isExpanded && (
        <div className="border-border/40 flex flex-col gap-2 border-t p-3">
          {endpoint.routes.map((route, idx) => (
            <RouteRow
              key={`${route.method}-${route.path}-${idx}`}
              basePath={endpoint.basePath}
              route={route}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const RouteRow = ({
  basePath,
  route,
}: {
  basePath: string;
  route: GeneratedRoute;
}): React.JSX.Element => {
  const [showSchema, setShowSchema] = React.useState(false);
  const methodColor =
    METHOD_COLOR_CLASSES[route.method] || "bg-muted text-foreground";
  const fullPath = `${basePath}${route.path}`;

  const jsonSchemaDoc = React.useMemo(() => {
    return convertPropertiesToJsonSchema(route.properties);
  }, [route.properties]);

  return (
    <div className="border-border/60 bg-muted/20 hover:bg-muted/40 flex flex-col rounded-lg border transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${methodColor}`}
          >
            {route.method}
          </span>
          <span className="text-foreground font-semibold">{fullPath}</span>
          <span className="text-muted-foreground/80 text-[11px]">
            &rarr; {route.statusCode}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <RiTimeLine className="size-3" />
            <span>
              {route.latency.min}–{route.latency.max}ms
            </span>
          </div>

          {route.errorRate > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-amber-500">
              <RiAlertLine className="size-3" />
              <span>{route.errorRate}% error</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSchema(!showSchema)}
            className="border-border hover:bg-card text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 rounded border px-2 py-0.5 text-[11px] transition-colors"
          >
            <RiCodeSSlashLine className="size-3" />
            <span>{showSchema ? "Hide Schema" : "Schema"}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Response Schema Inspector */}
      {showSchema && (
        <div className="border-border/40 bg-card/90 border-t p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-semibold tracking-wider uppercase">
                Response Schema Properties:
              </span>
              <span className="text-muted-foreground font-mono">
                {route.properties.length} field
                {route.properties.length > 1 ? "s" : ""}
              </span>
            </div>

            {route.properties.length > 0 ? (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {route.properties.map((p) => (
                  <div
                    key={p.name}
                    className="bg-muted/40 border-border/50 flex items-center justify-between rounded border px-2 py-1 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground font-mono font-medium">
                        {p.name}
                      </span>
                      <span className="text-muted-foreground/70 text-[10px]">
                        ({p.type})
                      </span>
                    </div>
                    {p.fakerProvider && (
                      <Badge variant="secondary">
                        <span className="font-mono text-[10px]">
                          {p.fakerProvider}
                        </span>
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs italic">
                No properties defined (returns empty object)
              </span>
            )}

            <details className="pt-1">
              <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-[11px]">
                View Generated JSON Schema
              </summary>
              <pre className="bg-muted/80 text-foreground mt-1 max-h-48 overflow-auto rounded p-2 font-mono text-[10px]">
                {JSON.stringify(jsonSchemaDoc, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};
