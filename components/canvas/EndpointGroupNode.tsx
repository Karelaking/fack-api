"use client";

import * as React from "react";
import { NodeResizer } from "@xyflow/react";
import { Folder } from "lucide-react";

interface EndpointGroupNodeProps {
  data: {
    label: string;
    basePath: string;
  };
  selected: boolean;
}

/**
 * Custom Endpoint Group Node.
 * Acts as a visual bounding container in React Flow to group routes structurally.
 */
export function EndpointGroupNode({ data, selected }: EndpointGroupNodeProps) {
  return (
    <div className="h-full w-full rounded-xl border border-dashed border-border bg-muted/10 p-4 transition-all">
      {/* NodeResizer helper to allow dynamic scaling of the bounding container */}
      <NodeResizer
        minWidth={280}
        minHeight={160}
        isVisible={selected}
        lineClassName="border-primary"
        handleClassName="h-3 w-3 rounded-full border-2 border-primary bg-card"
      />

      <div className="flex items-center gap-2 text-muted-foreground border-b border-border pb-2 mb-4 shrink-0" style={{ contentVisibility: "auto" }}>
        <Folder className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold font-mono tracking-tight uppercase">
          {data.label} ({data.basePath || "/ (Root)"})
        </span>
      </div>
    </div>
  );
}
export default React.memo(EndpointGroupNode);
