import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getEndpoints } from "@/lib/actions/endpoints";
import { getCanvasState } from "@/lib/actions/canvas";
import { CanvasContainer } from "@/components/canvas/CanvasContainer";

interface CanvasPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Server page loading topology states, project information, and active routes.
 */
export default async function CanvasPage({ params }: CanvasPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Load database entities
  const endpointsList = await getEndpoints(project.id);
  const canvasState = await getCanvasState(project.id);

  // Flatten routes to pass to canvas sync hook
  const routesList = endpointsList.flatMap((ep) => ep.routes);

  return (
    <CanvasContainer
      projectId={project.id}
      endpoints={endpointsList}
      routes={routesList}
      initialState={
        canvasState
          ? {
              nodes: canvasState.nodes,
              edges: canvasState.edges,
              viewport: canvasState.viewport,
            }
          : undefined
      }
    />
  );
}
