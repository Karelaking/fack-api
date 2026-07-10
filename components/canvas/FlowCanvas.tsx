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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { saveCanvasState } from "@/lib/actions/canvas";
import { updateRoute } from "@/lib/actions/routes";
import { RouteNode } from "./RouteNode";
import { EndpointGroupNode } from "./EndpointGroupNode";
import { CanvasToolbar } from "./CanvasToolbar";
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

  // Parse initial coordinates or generate default layout grid
  const initialNodes: Node[] = React.useMemo(() => {
    if (initialState?.nodes) {
      try {
        const parsed = JSON.parse(initialState.nodes);
        if (parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse canvas nodes:", e);
      }
    }

    // Default layout generation if canvas state is empty
    const nodesList: Node[] = [];
    let xOffset = 40;
    let yOffset = 40;

    endpoints.forEach((ep, epIdx) => {
      // Group bounding container
      const groupWidth = 340;
      const groupHeight = 180 + ep.routes.length * 110;
      const groupId = `group-${ep.id}`;

      nodesList.push({
        id: groupId,
        type: "endpointGroup",
        data: { label: ep.name, basePath: ep.basePath },
        position: { x: xOffset, y: yOffset },
        style: { width: groupWidth, height: groupHeight },
      });

      // Individual sub-routes inside the bounding container
      ep.routes.forEach((route, rIdx) => {
        nodesList.push({
          id: route.id,
          type: "routeNode",
          parentId: groupId,
          extent: "parent",
          data: {
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
          },
          position: { x: 30, y: 70 + rIdx * 120 },
        });
      });

      xOffset += 400; // shift next group horizontally
    });

    return nodesList;
  }, [endpoints, initialState, onSelectRoute]);

  const initialEdges: Edge[] = React.useMemo(() => {
    if (initialState?.edges) {
      try {
        return JSON.parse(initialState.edges);
      } catch (e) {
        console.error("Failed to parse canvas edges:", e);
      }
    }
    return [];
  }, [initialState]);

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
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
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
    }
  }, [reactFlowInstance, projectId]);

  const handleRouteAdded = (newRoute: Route) => {
    // Determine the group node parent
    const groupId = `group-${newRoute.endpointId}`;
    const groupNode = nodes.find((n) => n.id === groupId);

    let x = 30;
    let y = 70;

    if (groupNode) {
      // Offset position inside parent box
      const existingChildrenCount = nodes.filter((n) => n.parentId === groupId).length;
      y = 70 + existingChildrenCount * 120;
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
    <div className="w-full h-full relative border border-border rounded-xl bg-card overflow-hidden">
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
        <Background gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Floating Canvas Toolbar controls */}
      <CanvasToolbar
        onAddRoute={() => setDialogOpen(true)}
        onFitView={() => reactFlowInstance.fitView()}
        onZoomIn={() => reactFlowInstance.zoomIn()}
        onZoomOut={() => reactFlowInstance.zoomOut()}
        onSave={handleSave}
        isSaving={isSaving}
      />

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
