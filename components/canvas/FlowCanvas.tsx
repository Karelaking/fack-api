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
import { RouteNode } from "./RouteNode";
import { EndpointGroupNode } from "./EndpointGroupNode";
import { AddRouteDialog } from "./AddRouteDialog";
import type { Endpoint, Route } from "@/db/schema";

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
  onSelectRoute: (routeId: string) => void;
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
}: FlowCanvasInnerProps) {
  const reactFlowInstance = useReactFlow();
  const [isSaving, setIsSaving] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Listen for global open-add-route event and query params
  React.useEffect(() => {
    const handleOpen = () => setDialogOpen(true);
    window.addEventListener("open-add-route-dialog", handleOpen);

    // Check if newRoute query parameter is present to open the dialog
    if (typeof window !== "undefined" && window.location.search.includes("newRoute=true")) {
      setDialogOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("newRoute");
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    return () => window.removeEventListener("open-add-route-dialog", handleOpen);
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
          style: { ...savedGroupNode.style, width: groupWidth, height: groupHeight },
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

      const routeData = {
        id: route.id,
        method: route.method,
        path: route.path,
        statusCode: route.statusCode,
        isEnabled: route.isEnabled,
        latencyMin: route.latencyMin ?? 0,
        latencyMax: route.latencyMax ?? 0,
        errorRate: route.errorRate ?? 0,
        onToggleEnabled: async (id: string, isEnabled: boolean) => {
          try {
            await updateRoute({ id, isEnabled });
            toast.success(`Route status updated!`);
          } catch {
            toast.error("Failed to toggle route status");
          }
        },
        onSelectRoute,
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
          (n) => n.parentId === groupId && n.type === "routeNode"
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
      .filter((edge) => activeRouteIds.has(edge.source) && activeRouteIds.has(edge.target))
      .map((edge) => ({
        ...edge,
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 2.5, strokeDasharray: "6 4" },
      }));
  }, [initialState, routes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync route data updates dynamically (for instance after editing in the sidebar EditBar)
  React.useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.type !== "routeNode") return node;
        const matchingRoute = routes.find((r) => r.id === node.id);
        if (!matchingRoute) return node;

        return {
          ...node,
          data: {
            ...node.data,
            method: matchingRoute.method,
            path: matchingRoute.path,
            statusCode: matchingRoute.statusCode,
            isEnabled: matchingRoute.isEnabled,
            latencyMin: matchingRoute.latencyMin ?? 0,
            latencyMax: matchingRoute.latencyMax ?? 0,
            errorRate: matchingRoute.errorRate ?? 0,
          },
        };
      })
    );
  }, [routes, setNodes]);

  const onConnect = React.useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2.5, strokeDasharray: "6 4" },
          },
          eds
        )
      ),
    [setEdges]
  );

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
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
      setIsSaving(false);
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

  const handleRouteAdded = (newRoute: Route) => {
    // Determine the group node parent
    const groupId = `group-${newRoute.endpointId}`;
    const groupNode = nodes.find((n) => n.id === groupId);

    let x = 30;
    let y = 56;

    if (groupNode) {
      // Offset position inside parent box
      const existingChildrenCount = nodes.filter((n) => n.parentId === groupId).length;
      y = 56 + existingChildrenCount * 96;
    }

    const newNode: Node = {
      id: newRoute.id,
      type: "routeNode",
      parentId: groupNode ? groupId : undefined,
      extent: groupNode ? "parent" : undefined,
      data: {
        id: newRoute.id,
        method: newRoute.method,
        path: newRoute.path,
        statusCode: newRoute.statusCode,
        isEnabled: newRoute.isEnabled,
        latencyMin: newRoute.latencyMin ?? 0,
        latencyMax: newRoute.latencyMax ?? 0,
        errorRate: newRoute.errorRate ?? 0,
        onToggleEnabled: async (id: string, isEnabled: boolean) => {
          try {
            await updateRoute({ id, isEnabled });
            toast.success("Route status updated!");
          } catch {
            toast.error("Failed to toggle route status");
          }
        },
        onSelectRoute,
      },
      position: { x, y },
    };

    setNodes((nds) => [...nds, newNode]);
    toast.success("Node added to canvas viewport");
  };

  const handleNodeClick = React.useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === "routeNode") {
        onSelectRoute(node.id);
      }
    },
    [onSelectRoute]
  );

  return (
    <div className="w-full h-full relative bg-card overflow-hidden">
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
      >
        <Background variant={BackgroundVariant.Lines} gap={16} size={1} className="opacity-60" />
        <Controls className="!bg-card !border-border" />
        <MiniMap zoomable pannable className="!bg-card !border-border" />
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
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
export default FlowCanvas;
