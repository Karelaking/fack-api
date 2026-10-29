"use client";

import * as React from "react";
import { NodeResizer } from "@xyflow/react";
import { RiFolderOpenLine } from "@remixicon/react";
import { cn } from "@/lib/utils";

interface EndpointGroupNodeProps {
  data: {
    label: string;
    basePath: string;
    /** Present when the group only exists in an unapplied agent draft. */
    draft?: { order: number };
  };
  selected: boolean;
}

/**
 * Premium Custom Bounding Container Node for Endpoints.
 * Uses a grid background style, glass header, and dashed glowing border to group routes cleanly.
 */
export function EndpointGroupNode({
  data,
  selected,
}: EndpointGroupNodeProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "relative h-full w-full border-2 border-dashed p-4 transition-all duration-300",
        "bg-card/60 dark:bg-muted/5",
        selected
          ? "border-primary/60 bg-card/95 dark:bg-muted/10 shadow-primary/5 shadow-lg"
          : "border-border hover:border-muted-foreground/40",
        data.draft &&
          "agent-draft-enter border-primary/50 bg-primary/5 ring-primary/15 ring-2",
      )}
      style={
        data.draft
          ? { animationDelay: `${data.draft.order * 70}ms` }
          : undefined
      }
    >
      {data.draft ? (
        <span className="border-primary/40 bg-primary/10 text-primary absolute top-3 right-3 z-10 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
          Draft
        </span>
      ) : null}

      {/* Consistent dot pattern matching React Flow background */}
      <div className="absolute inset-0 -z-10 opacity-20 dark:opacity-10">
        <div
          className="h-full w-full rounded-lg"
          style={{
            backgroundImage: `
            radial-gradient(circle, var(--muted-foreground) 1px, transparent 1px)
          `,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* NodeResizer for scaling bounding containers */}
      <NodeResizer
        minWidth={280}
        minHeight={160}
        isVisible={selected}
        lineClassName="border-primary"
        handleClassName="h-3.5 w-3.5 rounded-full border-2 border-primary bg-background shadow-xs hover:scale-110 transition-transform"
      />

      <div className="text-muted-foreground border-border/60 mb-4 flex shrink-0 items-center gap-2 border-b pb-2">
        <RiFolderOpenLine
          className="text-primary h-4 w-4 shrink-0 animate-pulse motion-reduce:animate-none"
          aria-hidden="true"
        />
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground text-mini truncate font-extrabold tracking-wider uppercase">
            {data.label}
          </span>
          <span className="text-muted-foreground text-micro truncate font-mono">
            {data.basePath || "/"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(EndpointGroupNode);
