"use client";

import * as React from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { saveCanvasState } from "@/lib/actions/canvas";
import { updateRoute } from "@/lib/actions/routes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsBoolean } from "nuqs";
import { RouteNode } from "./RouteNode";
import { LoggerRegistry } from "@/lib/logger-registry";

const canvasUiTrace = LoggerRegistry.getTrace("ui-flow-canvas");
import { EndpointGroupNode } from "./EndpointGroupNode";
import { AddRouteDialog } from "./AddRouteDialog";
import type { Endpoint, Route } from "@/db/schema";
import { RiGitBranchLine, RiLoader2Line } from "@remixicon/react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

// Custom Node Types registered on React Flow canvas
const nodeTypes = {
  routeNode: RouteNode,
  endpointGroup: EndpointGroupNode,
};

/**
 * Canvas geometry. Route cards are laid out with fixed vertical rhythm so a
 * card that grows a metrics footer never overlaps its sibling; the group
 * container is sized to fit its children plus padding.
 */
const ROUTE_NODE_WIDTH = 280; // must match RouteNode's `w-70`
const ROUTE_SIBLING_X = 30; // left inset of a route inside its group
const GROUP_WIDTH = ROUTE_SIBLING_X + ROUTE_NODE_WIDTH + 18; // right inset
const GROUP_HEADER_OFFSET = 92; // first route's y: group header bottom (~75px) + its mb-4 gap
const ROUTE_NODE_SPACING = 214; // measured card height (198px: 47 header + 72 body + 77 two-row footer) + 16px gap

function groupHeightFor(routeCount: number): number {
  return Math.max(
    140,
    GROUP_HEADER_OFFSET + routeCount * ROUTE_NODE_SPACING + 16,
  );
}

/**
 * Zoomed-out floor. React Flow clamps `fitView` to `minZoom`, which defaults to
 * 0.5 — too tight to fit three endpoint groups on a phone (needs ~0.35) or a
 * tablet in portrait with the sidebar open (needs ~0.48), so those viewports
 * used to open with node groups clipped off-screen.
 */
const MIN_ZOOM = 0.1;

/**
 * Fit settings shared by the initial mount, the resize refit, and the toolbar
 * action so all three agree on framing. Capping `maxZoom` keeps a near-empty
 * canvas from magnifying a single card past life size.
 */
const FIT_VIEW_OPTIONS = { padding: 0.15, maxZoom: 1 } as const;

/**
 * Smallest container delta (px) that counts as a real relayout worth refitting
 * for. Filters out scrollbar and rounding jitter while still catching rotation,
 * breakpoint changes, and the sidebar collapsing (~256px).
 */
const REFIT_THRESHOLD_PX = 40;

/** Frame the graph to the current container box, animating so a refit after a
 *  rotate or resize reads as a deliberate move rather than a jump cut. */
function refitViewport(instance: {
  fitView: (options?: {
    padding?: number;
    maxZoom?: number;
    duration?: number;
  }) => unknown;
}): void {
  void instance.fitView({ ...FIT_VIEW_OPTIONS, duration: 200 });
}

interface RouteNodeData {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  isEnabled: boolean;
  latencyMin: number;
  latencyMax: number;
  errorRate: number;
  responseSchema: string;
  customHeaders: string;
  conditionalRules: string;
  onToggleEnabled: (id: string, isEnabled: boolean) => void;
  onSelectRoute: (id: string) => void;
  onOpenEdit: (id: string) => void;
  mockUrl: string;
}

interface FlowCanvasInnerProps {
  projectId: string;
  projectSlug: string;
  endpoints: (Endpoint & { routes: Route[] })[];
  routes: Route[];
  initialState?: {
    nodes: string;
    edges: string;
    viewport: string;
  };
  onSelectRoute: (routeId: string) => void;
  onOpenEdit: (routeId: string) => void;
}

interface ReconcileCallbacks {
  onToggleEnabled: (id: string, isEnabled: boolean) => void;
  onSelectRoute: (id: string) => void;
  onOpenEdit: (id: string) => void;
}

/**
 * Builds the React Flow node list from the database truth (endpoints + routes),
 * preserving any positions the user has already saved for known node ids.
 *
 * Single source of truth for both the initial mount and every later
 * reconciliation, so the two paths cannot drift apart.
 */
function reconcileNodes(
  savedNodes: Node[],
  endpoints: (Endpoint & { routes: Route[] })[],
  routes: Route[],
  projectSlug: string,
  callbacks: ReconcileCallbacks,
): Node[] {
  const reconciled: Node[] = [];
  const savedById = new Map(savedNodes.map((node) => [node.id, node]));
  const endpointById = new Map(endpoints.map((ep) => [ep.id, ep]));
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // 1. Group nodes (endpoints)
  endpoints.forEach((ep, epIdx) => {
    const groupId = `group-${ep.id}`;
    const saved = savedById.get(groupId);
    const size = {
      width: GROUP_WIDTH,
      height: groupHeightFor(ep.routes.length),
    };

    reconciled.push({
      ...saved,
      id: groupId,
      type: "endpointGroup",
      data: { label: ep.name, basePath: ep.basePath },
      position: saved?.position ?? {
        x: 40 + epIdx * (GROUP_WIDTH + 40),
        y: 40,
      },
      style: { ...saved?.style, ...size },
      ariaLabel: `Endpoint group ${ep.name}, base path ${ep.basePath || "/"}`,
    });
  });

  // 2. Route nodes (children of their endpoint group)
  routes.forEach((route) => {
    const endpoint = endpointById.get(route.endpointId);
    if (!endpoint) return;

    const groupId = `group-${route.endpointId}`;
    const saved = savedById.get(route.id);
    const siblingCount = reconciled.filter(
      (node) => node.parentId === groupId && node.type === "routeNode",
    ).length;

    const data = {
      id: route.id,
      method: route.method,
      path: route.path,
      statusCode: route.statusCode,
      isEnabled: route.isEnabled,
      latencyMin: route.latencyMin ?? 0,
      latencyMax: route.latencyMax ?? 0,
      errorRate: route.errorRate ?? 0,
      responseSchema: route.responseSchema ?? "{}",
      customHeaders: route.customHeaders ?? "{}",
      conditionalRules: route.conditionalRules ?? "[]",
      onToggleEnabled: callbacks.onToggleEnabled,
      onSelectRoute: callbacks.onSelectRoute,
      onOpenEdit: callbacks.onOpenEdit,
      mockUrl: `${origin}/${projectSlug}${endpoint.basePath || ""}${route.path}`,
    } satisfies RouteNodeData;

    reconciled.push({
      ...saved,
      id: route.id,
      type: "routeNode",
      parentId: groupId,
      extent: "parent",
      position: saved?.position ?? {
        x: ROUTE_SIBLING_X,
        y: GROUP_HEADER_OFFSET + siblingCount * ROUTE_NODE_SPACING,
      },
      data,
      ariaLabel: `Route ${route.method} ${route.path}, status ${route.statusCode}, ${
        route.isEnabled ? "enabled" : "disabled"
      }`,
    });
  });

  return reconciled;
}

/**
 * React Flow Inner Canvas wrapper component.
 * Directly handles drag events, coordinates saving, and custom node bindings.
 */
function FlowCanvasInner({
  projectId,
  projectSlug,
  endpoints,
  routes,
  initialState,
  onSelectRoute,
  onOpenEdit,
}: FlowCanvasInnerProps): React.JSX.Element {
  const reactFlowInstance = useReactFlow();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [newRouteQuery, setNewRouteQuery] = useQueryState(
    "newRoute",
    parseAsBoolean.withDefault(false),
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const isAddRouteOpen = dialogOpen || newRouteQuery;

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open && newRouteQuery) {
      void setNewRouteQuery(null);
    }
  };

  // Listen for global open-add-route event
  React.useEffect(() => {
    const handleOpen = () => setDialogOpen(true);
    window.addEventListener("open-add-route-dialog", handleOpen);

    return () =>
      window.removeEventListener("open-add-route-dialog", handleOpen);
  }, []);

  const handleToggleEnabled = React.useCallback(
    async (id: string, isEnabled: boolean) => {
      canvasUiTrace.traceCall("onToggleEnabled", id, isEnabled);
      try {
        await updateRoute({ id, isEnabled });
        toast.success("Route status updated!");
        canvasUiTrace.traceSuccess("onToggleEnabled", isEnabled);
      } catch (err) {
        toast.error("Failed to toggle route status");
        canvasUiTrace.traceError("onToggleEnabled", err);
      }
    },
    [],
  );

  const nodeCallbacks = React.useMemo<ReconcileCallbacks>(
    () => ({
      onToggleEnabled: (id, isEnabled) =>
        void handleToggleEnabled(id, isEnabled),
      onSelectRoute,
      onOpenEdit,
    }),
    [handleToggleEnabled, onSelectRoute, onOpenEdit],
  );

  const initialNodes: Node[] = React.useMemo(() => {
    let savedNodes: Node[] = [];
    if (initialState?.nodes) {
      try {
        const parsed = JSON.parse(initialState.nodes);
        if (Array.isArray(parsed)) {
          savedNodes = parsed;
        }
      } catch (e) {
        console.error("Failed to parse canvas nodes:", e);
      }
    }

    return reconcileNodes(
      savedNodes,
      endpoints,
      routes,
      projectSlug,
      nodeCallbacks,
    );
    // `initialState` is intentionally excluded: it seeds the very first render
    // only, and later changes flow through the reconciliation effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoints, routes, projectSlug, nodeCallbacks]);

  const initialEdges: Edge[] = React.useMemo(() => {
    let savedEdges: Edge[] = [];
    if (initialState?.edges) {
      try {
        const parsed = JSON.parse(initialState.edges);
        if (Array.isArray(parsed)) {
          savedEdges = parsed;
        }
      } catch (e) {
        console.error("Failed to parse canvas edges:", e);
      }
    }

    // Discard stale edges connecting deleted routes and style active ones
    const activeRouteIds = new Set(routes.map((r) => r.id));
    return savedEdges
      .filter(
        (edge) =>
          activeRouteIds.has(edge.source) && activeRouteIds.has(edge.target),
      )
      .map((edge) => ({
        ...edge,
        animated: true,
        style: {
          stroke: "var(--color-primary)",
          strokeWidth: 2.5,
          strokeDasharray: "6 4",
        },
      }));
  }, [initialState, routes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync selected node mock links with global dashboard sidebar
  React.useEffect(() => {
    const selectedRouteNode = nodes.find(
      (n) => n.selected && n.type === "routeNode",
    );
    if (selectedRouteNode) {
      const data = selectedRouteNode.data as {
        path: string;
        method: string;
        mockUrl: string;
      };
      window.dispatchEvent(
        new CustomEvent("route-selected", {
          detail: {
            id: selectedRouteNode.id,
            path: data.path,
            method: data.method,
            mockUrl: data.mockUrl,
          },
        }),
      );
    } else {
      window.dispatchEvent(new CustomEvent("route-selected", { detail: null }));
    }
  }, [nodes]);

  // Reconcile node state when endpoints or routes change, preserving positions.
  React.useEffect(() => {
    setNodes((prevNodes) =>
      reconcileNodes(prevNodes, endpoints, routes, projectSlug, nodeCallbacks),
    );
  }, [endpoints, routes, projectSlug, nodeCallbacks, setNodes]);

  const onConnect = React.useCallback(
    (params: Connection) => {
      canvasUiTrace.traceCall("onConnect", params.source, params.target);
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: {
              stroke: "var(--color-primary)",
              strokeWidth: 2.5,
              strokeDasharray: "6 4",
            },
          },
          eds,
        ),
      );
      canvasUiTrace.traceSuccess("onConnect", "edge added");
    },
    [setEdges],
  );

  const handleSave = React.useCallback(async () => {
    canvasUiTrace.traceCall("handleSave", projectId);
    window.dispatchEvent(new CustomEvent("canvas-save-start"));
    try {
      const flow = reactFlowInstance.toObject();
      await saveCanvasState({
        projectId,
        nodes: JSON.stringify(flow.nodes),
        edges: JSON.stringify(flow.edges),
        viewport: JSON.stringify(flow.viewport),
      });
      toast.success("Canvas layout saved!");
      canvasUiTrace.traceSuccess("handleSave", "saved");
    } catch (err) {
      toast.error("Failed to save canvas coordinates");
      canvasUiTrace.traceError("handleSave", err);
    } finally {
      window.dispatchEvent(new CustomEvent("canvas-save-end"));
    }
  }, [reactFlowInstance, projectId]);

  // Listen for global canvas top bar actions
  React.useEffect(() => {
    const handleZoomIn = () => reactFlowInstance.zoomIn();
    const handleZoomOut = () => reactFlowInstance.zoomOut();
    const handleFitView = () => refitViewport(reactFlowInstance);
    const handleSaveTrigger = () => handleSave();

    window.addEventListener("canvas-zoom-in", handleZoomIn);
    window.addEventListener("canvas-zoom-out", handleZoomOut);
    window.addEventListener("canvas-fit-view", handleFitView);
    window.addEventListener("canvas-save", handleSaveTrigger);

    return () => {
      window.removeEventListener("canvas-zoom-in", handleZoomIn);
      window.removeEventListener("canvas-zoom-out", handleZoomOut);
      window.removeEventListener("canvas-fit-view", handleFitView);
      window.removeEventListener("canvas-save", handleSaveTrigger);
    };
  }, [reactFlowInstance, handleSave]);

  /**
   * React Flow only fits the view on mount, so a phone rotating, a breakpoint
   * change, or the sidebar collapsing would leave the far node groups clipped
   * off the canvas. Refit whenever the canvas box changes size materially,
   * debounced so a drag-resize settles before we move the camera.
   */
  const canvasRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    let lastWidth = element.clientWidth;
    let lastHeight = element.clientHeight;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const observer = new ResizeObserver(() => {
      const width = element.clientWidth;
      const height = element.clientHeight;

      if (
        Math.abs(width - lastWidth) < REFIT_THRESHOLD_PX &&
        Math.abs(height - lastHeight) < REFIT_THRESHOLD_PX
      ) {
        return;
      }

      lastWidth = width;
      lastHeight = height;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (cancelled) return;
        refitViewport(reactFlowInstance);
      }, 150);
    });

    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [reactFlowInstance]);

  const handleRouteAdded = () => {
    router.refresh();
    toast.success("Node added to canvas viewport");
  };

  const handleNodeClick = React.useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === "routeNode") {
        onSelectRoute(node.id);
      }
    },
    [onSelectRoute],
  );

  const isEmpty = routes.length === 0;
  const hasEndpoints = endpoints.length > 0;

  return (
    <div
      ref={canvasRef}
      className="bg-muted/30 dark:bg-card relative h-full w-full overflow-hidden"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        minZoom={MIN_ZOOM}
        colorMode={resolvedTheme}
        deleteKeyCode={null}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          className="opacity-70 dark:opacity-40"
          color={resolvedTheme === "dark" ? "#52525b" : "#94a3b8"}
        />
        <Controls className="bg-card! border-border! shadow-xs!" />
        <MiniMap
          zoomable
          pannable
          nodeColor={(node) => {
            if (node.type === "endpointGroup") {
              return resolvedTheme === "dark" ? "#27272a" : "#e2e8f0";
            }
            return resolvedTheme === "dark" ? "#6366f1" : "#4f46e5";
          }}
          maskColor={
            resolvedTheme === "dark"
              ? "rgba(0, 0, 0, 0.6)"
              : "rgba(241, 245, 249, 0.7)"
          }
          className="bg-card! border-border! h-18.75! w-25! shadow-xs! sm:h-27.5! sm:w-37.5! md:h-37.5! md:w-50!"
        />
      </ReactFlow>

      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
          <div className="bg-card/95 border-border pointer-events-auto flex max-w-sm flex-col items-center gap-4 rounded-xl border px-6 py-8 text-center shadow-lg backdrop-blur-sm">
            <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
              <RiGitBranchLine className="size-5" aria-hidden="true" />
            </span>
            <div className="space-y-1.5">
              <h2 className="text-foreground text-base font-semibold">
                {hasEndpoints
                  ? "No routes on the canvas yet"
                  : "Start with an endpoint group"}
              </h2>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {hasEndpoints
                  ? "Add your first route to define a path, status code, and response schema on the canvas."
                  : "Routes live inside endpoint groups. Create your first group, then add routes to it."}
              </p>
            </div>
            {hasEndpoints ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setDialogOpen(true)}
              >
                Add your first route
              </Button>
            ) : (
              <Button
                size="sm"
                render={<Link href={`/projects/${projectSlug}/endpoints`} />}
              >
                Create an endpoint group
              </Button>
            )}
          </div>
        </div>
      )}

      <AddRouteDialog
        open={isAddRouteOpen}
        onOpenChange={handleOpenChange}
        endpoints={endpoints}
        onRouteAdded={handleRouteAdded}
      />
    </div>
  );
}

/**
 * FlowCanvas component wrapped in ReactFlowProvider to enable useReactFlow hook bindings.
 */
export function FlowCanvas(props: FlowCanvasInnerProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <output className="bg-card text-muted-foreground relative flex h-full w-full flex-col items-center justify-center gap-2">
        <RiLoader2Line
          className="h-8 w-8 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="text-xs font-medium">Loading canvas…</span>
      </output>
    );
  }

  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
export default FlowCanvas;
