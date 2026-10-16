"use client";

// Selection and keyboard activation are owned by React Flow's node wrapper
// (`role="group"`, `tabIndex=0`, Enter/Space -> onNodeClick), so the card root
// stays a plain presentational element and nested controls remain valid.

import * as React from "react";
import { Handle, Position } from "@xyflow/react";
import {
  RiAlertLine,
  RiTimeLine,
  RiPulseLine,
  RiCheckboxCircleLine,
  RiShieldCrossLine,
  RiFlashlightLine,
  RiCodeLine,
  RiEqualizerLine,
  RiGitBranchLine,
  RiPencilLine,
} from "@remixicon/react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { DraftMark } from "./preview-nodes";

interface RouteNodeData {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  isEnabled: boolean;
  latencyMin: number;
  latencyMax: number;
  errorRate: number;
  responseSchema?: string;
  customHeaders?: string;
  conditionalRules?: string;
  onToggleEnabled: (id: string, isEnabled: boolean) => void;
  onSelectRoute: (id: string) => void;
  onOpenEdit: (id: string) => void;
  mockUrl: string;
  /** Present when this node is part of an unapplied agent draft. */
  draft?: DraftMark;
}

interface RouteNodeProps {
  data: RouteNodeData;
  selected: boolean;
}

/**
 * Premium redesigned Custom Node representing a Mock API route.
 * Sleek card container, glowing indicators, copyable path styling, and rules indicators.
 */
export const RouteNode = ({
  data,
  selected,
}: RouteNodeProps): React.ReactElement => {
  const method = data.method.toUpperCase();

  const getRouteVariants = (method: string) => ({
    wrapper: cn({
      "border-l-method-get hover:shadow-method-get/10 hover:border-method-get/40":
        method === "GET",
      "border-l-method-post hover:shadow-method-post/10 hover:border-method-post/40":
        method === "POST",
      "border-l-method-put hover:shadow-method-put/10 hover:border-method-put/40":
        method === "PUT",
      "border-l-method-delete hover:shadow-method-delete/10 hover:border-method-delete/40":
        method === "DELETE",
      "border-l-method-patch hover:shadow-method-patch/10 hover:border-method-patch/40":
        method === "PATCH",
      "border-l-muted-foreground hover:border-muted/40": ![
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
      ].includes(method),
    }),
    badge: cn({
      "bg-method-get/10 text-method-get border-method-get/25": method === "GET",
      "bg-method-post/10 text-method-post border-method-post/25":
        method === "POST",
      "bg-method-put/10 text-method-put border-method-put/25": method === "PUT",
      "bg-method-delete/10 text-method-delete border-method-delete/25":
        method === "DELETE",
      "bg-method-patch/10 text-method-patch border-method-patch/25":
        method === "PATCH",
      "bg-muted/10 text-muted-foreground border-border/20": ![
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
      ].includes(method),
    }),
    dot: cn({
      "bg-method-get shadow-[0_0_8px_var(--color-method-get)]":
        method === "GET",
      "bg-method-post shadow-[0_0_8px_var(--color-method-post)]":
        method === "POST",
      "bg-method-put shadow-[0_0_8px_var(--color-method-put)]":
        method === "PUT",
      "bg-method-delete shadow-[0_0_8px_var(--color-method-delete)]":
        method === "DELETE",
      "bg-method-patch shadow-[0_0_8px_var(--color-method-patch)]":
        method === "PATCH",
      "bg-muted-foreground": ![
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
      ].includes(method),
    }),
  });

  const variants = getRouteVariants(method);

  // Status code colors and icons
  let statusBadgeClass = "bg-muted/30 text-muted-foreground border-border/40";
  let StatusIcon = RiPulseLine;

  if (data.statusCode >= 200 && data.statusCode < 300) {
    statusBadgeClass = "bg-success/10 text-success border-success/20";
    StatusIcon = RiCheckboxCircleLine;
  } else if (data.statusCode >= 300 && data.statusCode < 400) {
    statusBadgeClass = "bg-warning/10 text-warning border-warning/20";
    StatusIcon = RiFlashlightLine;
  } else if (data.statusCode >= 400 && data.statusCode < 500) {
    statusBadgeClass =
      "bg-destructive/10 text-destructive border-destructive/20";
    StatusIcon = RiAlertLine;
  } else if (data.statusCode >= 500) {
    statusBadgeClass =
      "bg-destructive/10 text-destructive border-destructive/20 animate-pulse motion-reduce:animate-none";
    StatusIcon = RiShieldCrossLine;
  }

  // Calculate configuration counts for Schema and Custom Headers
  const schemaKeysCount = React.useMemo(() => {
    try {
      const parsed = JSON.parse(data.responseSchema || "{}");
      if (parsed.type === "array" && parsed.items) {
        return Object.keys(parsed.items.properties || {}).length;
      }
      return (
        Object.keys(parsed.properties || {}).length ||
        Object.keys(parsed).length
      );
    } catch {
      return 0;
    }
  }, [data.responseSchema]);

  const headersKeysCount = React.useMemo(() => {
    try {
      const parsed = JSON.parse(data.customHeaders || "{}");
      return Object.keys(parsed).length;
    } catch {
      return 0;
    }
  }, [data.customHeaders]);

  const rulesCount = React.useMemo(() => {
    try {
      const parsed = JSON.parse(data.conditionalRules || "[]");
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, [data.conditionalRules]);

  const handleToggle = (checked: boolean) => {
    data.onToggleEnabled(data.id, checked);
  };

  const hasLatency = (data.latencyMin ?? 0) > 0 || (data.latencyMax ?? 0) > 0;
  const hasErrors = (data.errorRate ?? 0) > 0;

  return (
    <div
      className={cn(
        "bg-card border-border relative flex w-70 cursor-pointer flex-col overflow-hidden rounded-xl border border-l-4 shadow-sm transition-all duration-200 select-none",
        variants.wrapper,
        selected
          ? "border-primary ring-primary/20 shadow-primary/5 -translate-y-1 scale-[1.02] shadow-lg ring-4"
          : "hover:-translate-y-0.5 hover:shadow-md",
        !data.isEnabled && "opacity-60 grayscale-[0.5]",
        data.draft?.changeType === "create" &&
          "agent-draft-enter border-primary/50 ring-primary/15 ring-2",
        data.draft?.changeType === "update" &&
          "agent-draft-enter ring-info/20 ring-2",
        data.draft?.changeType === "delete" &&
          "agent-draft-enter border-destructive/40 opacity-70",
      )}
      style={
        data.draft
          ? { animationDelay: `${data.draft.order * 70}ms` }
          : undefined
      }
    >
      {data.draft ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-2 right-2 z-10 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
            data.draft.changeType === "delete"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : data.draft.changeType === "update"
                ? "border-info/40 bg-info/10 text-info"
                : "border-primary/40 bg-primary/10 text-primary",
          )}
        >
          {data.draft.changeType === "delete"
            ? "Remove"
            : data.draft.changeType === "update"
              ? "Update"
              : "New"}
        </span>
      ) : null}
      {data.draft?.hasConflict ? (
        <span
          aria-hidden="true"
          className="border-warning/40 bg-warning/10 text-warning absolute top-2 right-18 z-10 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
        >
          Conflict
        </span>
      ) : null}

      {/* Node handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "bg-background! -left-1.75! h-3 w-3 border-2 transition-colors duration-200",
          selected
            ? "border-primary scale-110"
            : "border-muted-foreground/50 hover:border-primary",
        )}
      />

      {/* Header: Status and Controls */}
      <div className="border-border/40 bg-muted/10 flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Method Badge with glowing indicator dot */}
          <span
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-micro font-extrabold tracking-wider",
              variants.badge,
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                variants.dot,
                data.isEnabled && "animate-pulse motion-reduce:animate-none",
              )}
            />
            {method}
          </span>

          {/* Status code view */}
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-mini font-bold",
              statusBadgeClass,
            )}
          >
            <StatusIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
            {data.statusCode}
          </span>
        </div>

        {/* Actions block: Toggle Switch */}
        <div
          className="flex items-center gap-3"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="canvas-touch-target"
            title="Edit Route"
            aria-label="Edit Route"
            onClick={(e) => {
              e.stopPropagation();
              data.onOpenEdit(data.id);
            }}
          >
            <RiPencilLine className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Switch
            checked={data.isEnabled}
            onCheckedChange={handleToggle}
            aria-label="Toggle Route Enabled"
            className="canvas-touch-switch"
          />
        </div>
      </div>

      {/* Body: Title & Description */}
      <div className="flex flex-col gap-1 px-4 py-3">
        <span className="text-foreground line-clamp-1 text-sm font-semibold tracking-tight">
          {data.path}
        </span>
        <span className="text-muted-foreground text-mini line-clamp-1 font-mono">
          {data.mockUrl}
        </span>
      </div>

      {/* Footer: Metadata Indicators */}
      {(schemaKeysCount > 0 ||
        headersKeysCount > 0 ||
        rulesCount > 0 ||
        hasLatency ||
        hasErrors) && (
        <div className="border-border/40 bg-muted/20 flex flex-wrap items-center gap-2 border-t px-4 py-2.5">
          {schemaKeysCount > 0 && (
            <div className="text-muted-foreground text-mini flex items-center gap-1 font-medium">
              <RiCodeLine
                className="text-success h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>JSON</span>
            </div>
          )}
          {headersKeysCount > 0 && (
            <div className="text-muted-foreground text-mini flex items-center gap-1 font-medium">
              <RiEqualizerLine
                className="text-info h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>Hdrs</span>
            </div>
          )}
          {rulesCount > 0 && (
            <div className="text-muted-foreground text-mini flex items-center gap-1 font-medium">
              <RiGitBranchLine
                className="text-primary h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>Rules</span>
            </div>
          )}
          {hasLatency && (
            <div className="text-muted-foreground text-mini flex items-center gap-1 font-medium">
              <RiTimeLine
                className="text-warning h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>
                {data.latencyMin === data.latencyMax
                  ? `${data.latencyMin}ms`
                  : `${data.latencyMin}-${data.latencyMax}ms`}
              </span>
            </div>
          )}
          {hasErrors && (
            <div className="text-muted-foreground text-mini flex items-center gap-1 font-medium">
              <RiAlertLine
                className="text-destructive h-3.5 w-3.5 shrink-0 animate-pulse motion-reduce:animate-none"
                aria-hidden="true"
              />
              <span>{data.errorRate}% Err</span>
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "bg-background! -right-1.5! h-2.5 w-2.5 border-2 transition-colors duration-200",
          selected
            ? "border-primary scale-110"
            : "border-muted-foreground/50 hover:border-primary",
        )}
      />
    </div>
  );
};

export default React.memo(RouteNode);
