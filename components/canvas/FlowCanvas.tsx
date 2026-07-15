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
import { useRouter } from "next/navigation";
import { RouteNode } from "./RouteNode";
import { EndpointGroupNode } from "./EndpointGroupNode";
import { AddRouteDialog } from "./AddRouteDialog";
import type { Endpoint, Route } from "@/db/schema";
import { RiLoader2Line } from "@remixicon/react";

// Custom Node Types registered on React Flow canvas
const nodeTypes = {
  routeNode: RouteNode,
  endpointGroup: EndpointGroupNode,
};

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
  customDomain?: string | null;
  onSelectRoute: (routeId: string) => void;
  onOpenEdit: (routeId: string) => void;
}

/**
 * React Flow Inner Canvas wrapper component.
 * Directly handles drag events, coordinates saving, and custom node bindings.
 */
function FlowCanvasInner({
  projectId,
  projectSlug,
  customDomain,
  endpoints,
  routes,
  initialState,
  onSelectRoute,
  onOpenEdit,
}: FlowCanvasInnerProps): React.JSX.Element {
  const reactFlowInstance = useReactFlow();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Listen for global open-add-route event and query params
  React.useEffect(() => {
    const handleOpen = () => setDialogOpen(true);
    window.addEventListener("open-add-route-dialog", handleOpen);

    // Check if newRoute query parameter is present to open the dialog
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("newRoute=true")
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDialogOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("newRoute");
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    return () =>
      window.removeEventListener("open-add-route-dialog", handleOpen);
  }, []);

  // Parse initial coordinates and reconcile with database reality
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

    const reconciledNodes: Node[] = [];
    const dbEndpointsMap = new Map(endpoints.map((ep) => [ep.id, ep]));

    // 1. Reconcile Group Nodes (Endpoints)
    endpoints.forEach((ep, epIdx) => {
      const groupId = `group-${ep.id}`;
      const savedGroupNode = savedNodes.find((n) => n.id === groupId);

      const groupWidth = 300;
      const groupHeight = 110 + ep.routes.length * 96;

      if (savedGroupNode) {
        // Keep position but update size and label
        reconciledNodes.push({
          ...savedGroupNode,
          data: { label: ep.name, basePath: ep.basePath },
          style: {
            ...savedGroupNode.style,
            width: groupWidth,
            height: groupHeight,
          },
        });
      } else {
        // Position new groups horizontally offset
        reconciledNodes.push({
          id: groupId,
          type: "endpointGroup",
          data: { label: ep.name, basePath: ep.basePath },
          position: { x: 40 + epIdx * 400, y: 40 },
          style: { width: groupWidth, height: groupHeight },
        });
      }
    });

    // 2. Reconcile Route Nodes
    routes.forEach((route) => {
      const groupId = `group-${route.endpointId}`;
      if (!dbEndpointsMap.has(route.endpointId)) return;

      const savedRouteNode = savedNodes.find((n) => n.id === route.id);

      const endpoint = dbEndpointsMap.get(route.endpointId);
      const basePath = endpoint?.basePath || "";
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      let fullMockUrl = "";
      if (customDomain) {
        const protocol = typeof window !== "undefined" ? window.location.protocol + "//" : "http://";
        fullMockUrl = `${protocol}${customDomain}${basePath}${route.path}`;
      } else {
        fullMockUrl = `${origin}/${projectSlug}${basePath}${route.path}`;
      }

      const routeData = {
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
        onToggleEnabled: async (id: string, isEnabled: boolean) => {
          try {
            await updateRoute({ id, isEnabled });
            toast.success(`Route status updated!`);
          } catch {
            toast.error("Failed to toggle route status");
          }
        },
        onSelectRoute,
        onOpenEdit,
        mockUrl: fullMockUrl,
      };

      if (savedRouteNode) {
        reconciledNodes.push({
          ...savedRouteNode,
          parentId: groupId,
          extent: "parent",
          data: routeData,
        });
      } else {
        // Offset vertically within parent group container based on existing children
        const siblingRoutesCount = reconciledNodes.filter(
          (n) => n.parentId === groupId && n.type === "routeNode",
        ).length;

        reconciledNodes.push({
          id: route.id,
          type: "routeNode",
          parentId: groupId,
          extent: "parent",
          position: { x: 30, y: 56 + siblingRoutesCount * 96 },
          data: routeData,
        });
      }
    });

    return reconciledNodes;
  }, [endpoints, routes, initialState, onSelectRoute]);

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
        style: { stroke: "#6366f1", strokeWidth: 2.5, strokeDasharray: "6 4" },
      }));
  }, [initialState, routes, customDomain, projectSlug, onOpenEdit, onSelectRoute]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync selected node mock links with global dashboard sidebar
  React.useEffect(() => {
    const selectedRouteNode = nodes.find(
      (n) => n.selected && n.type === "routeNode",
    );
    if (selectedRouteNode) {
      const data = selectedRouteNode.data as any;
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
      window.dispatchEvent(
        new CustomEvent("route-selected", { detail: null }),
      );
    }
  }, [nodes]);

  // Reconcile and sync nodes state when routes or endpoints props change (ensures correct group sizes and node placements)
  React.useEffect(() => {
    setNodes((prevNodes) => {
      const reconciled: Node[] = [];
      const dbEndpointsMap = new Map(endpoints.map((ep) => [ep.id, ep]));

      // 1. Reconcile Group Nodes (Endpoints)
      endpoints.forEach((ep, epIdx) => {
        const groupId = `group-${ep.id}`;
        const existingGroupNode = prevNodes.find((n) => n.id === groupId);

        const groupWidth = 300;
        const groupHeight = 110 + ep.routes.length * 96;

        if (existingGroupNode) {
          reconciled.push({
            ...existingGroupNode,
            data: { label: ep.name, basePath: ep.basePath },
            style: {
              ...existingGroupNode.style,
              width: groupWidth,
              height: groupHeight,
            },
          });
        } else {
          // Horizontal layout offset for new groups
          reconciled.push({
            id: groupId,
            type: "endpointGroup",
            data: { label: ep.name, basePath: ep.basePath },
            position: { x: 40 + epIdx * 400, y: 40 },
            style: { width: groupWidth, height: groupHeight },
          });
        }
      });

      // 2. Reconcile Route Nodes
      routes.forEach((route) => {
        const groupId = `group-${route.endpointId}`;
        if (!dbEndpointsMap.has(route.endpointId)) return;

        const existingRouteNode = prevNodes.find((n) => n.id === route.id);

        const endpoint = dbEndpointsMap.get(route.endpointId);
        const basePath = endpoint?.basePath || "";
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        let fullMockUrl = "";
        if (customDomain) {
          const protocol = typeof window !== "undefined" ? window.location.protocol + "//" : "http://";
          fullMockUrl = `${protocol}${customDomain}${basePath}${route.path}`;
        } else {
          fullMockUrl = `${origin}/${projectSlug}${basePath}${route.path}`;
        }

        const routeData = {
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
          onToggleEnabled: async (id: string, isEnabled: boolean) => {
            try {
              await updateRoute({ id, isEnabled });
              toast.success("Route status updated!");
            } catch {
              toast.error("Failed to toggle route status");
            }
          },
          onSelectRoute,
          onOpenEdit,
          mockUrl: fullMockUrl,
        };

        if (existingRouteNode) {
          reconciled.push({
            ...existingRouteNode,
            parentId: groupId,
            extent: "parent",
            data: routeData,
          });
        } else {
          // Place newly added route at the correct vertical offset
          const siblingCount = reconciled.filter(
            (n) => n.parentId === groupId && n.type === "routeNode",
          ).length;

          reconciled.push({
            id: route.id,
            type: "routeNode",
            parentId: groupId,
            extent: "parent",
            position: { x: 30, y: 56 + siblingCount * 96 },
            data: routeData,
          });
        }
      });

      return reconciled;
    });
  }, [endpoints, routes, onSelectRoute, setNodes]);

  const onConnect = React.useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: {
              stroke: "#6366f1",
              strokeWidth: 2.5,
              strokeDasharray: "6 4",
            },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  const handleSave = React.useCallback(async () => {
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
    } catch (err) {
      toast.error("Failed to save canvas coordinates");
      console.error(err);
    } finally {
      window.dispatchEvent(new CustomEvent("canvas-save-end"));
    }
  }, [reactFlowInstance, projectId]);

  // Listen for global canvas top bar actions
  React.useEffect(() => {
    const handleZoomIn = () => reactFlowInstance.zoomIn();
    const handleZoomOut = () => reactFlowInstance.zoomOut();
    const handleFitView = () => reactFlowInstance.fitView();
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

  return (
    <div className="bg-card relative h-full w-full overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        colorMode="system"
        deleteKeyCode={null}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={16}
          size={1}
          className="opacity-60"
        />
        <Controls className="bg-card! border-border!" />
        <MiniMap zoomable pannable className="bg-card! border-border! w-[100px]! h-[75px]! sm:w-[150px]! sm:h-[110px]! md:w-[200px]! md:h-[150px]!" />
      </ReactFlow>

      <AddRouteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-card relative flex h-full w-full items-center justify-center">
        <RiLoader2Line className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
export default FlowCanvas;
