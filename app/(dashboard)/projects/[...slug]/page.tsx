import { notFound, redirect } from "next/navigation";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getEndpoints } from "@/lib/actions/endpoints";
import { getCanvasState } from "@/lib/actions/canvas";
import { getRequestLogs } from "@/lib/actions/logs";
import { CanvasContainer } from "@/components/canvas/CanvasContainer";
import { ProjectEndpoints } from "@/components/dashboard/ProjectEndpoints";
import { ProjectLogs } from "@/components/dashboard/ProjectLogs";
import { ProjectSettings } from "@/components/dashboard/ProjectSettings";

interface ProjectPageProps {
  params: Promise<{ slug: string[] }>;
}

/**
 * Unified project details workspace router.
 * Combines Canvas, Endpoints, Logs, and Settings subpages into a single
 * catch-all dynamic router to support multi-segment project slugs (e.g. `/projects/api/v1/canvas`).
 */
export default async function UnifiedProjectPage({ params }: ProjectPageProps): Promise<React.JSX.Element> {
  const { slug: slugParam } = await params;
  if (!slugParam || slugParam.length === 0) {
    notFound();
  }

  // Parse path segments
  // e.g. for ["api", "v1", "canvas"] -> subpage = "canvas", projectSlugParts = ["api", "v1"]
  // e.g. for ["demo"] -> subpage = "", projectSlugParts = ["demo"]
  const lastSegment = slugParam[slugParam.length - 1];
  const subpages = new Set(["canvas", "endpoints", "logs", "settings"]);
  
  let subpage = "";
  let projectSlugParts = slugParam;

  if (subpages.has(lastSegment)) {
    subpage = lastSegment;
    projectSlugParts = slugParam.slice(0, -1);
  }

  const projectSlug = projectSlugParts.join("/");
  if (!projectSlug) {
    notFound();
  }

  const project = await getProjectBySlug(projectSlug);
  if (!project) {
    notFound();
  }

  // If no subpage is specified (e.g. /projects/api/v1), redirect to /projects/api/v1/canvas
  if (!subpage) {
    redirect(`/projects/${projectSlug}/canvas`);
  }

  // Render the appropriate component based on subpage
  let content: React.JSX.Element | null = null;
  if (subpage === "canvas") {
    const [endpointsList, canvasState] = await Promise.all([
      getEndpoints(project.id),
      getCanvasState(project.id),
    ]);
    const routesList = endpointsList.flatMap((ep) => ep.routes);
    content = (
      <CanvasContainer
        projectId={project.id}
        projectSlug={project.slug}
        customDomain={project.customDomain}
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
  } else if (subpage === "endpoints") {
    const endpointsList = await getEndpoints(project.id);
    content = (
      <ProjectEndpoints
        projectId={project.id}
        projectSlug={project.slug}
        initialEndpoints={endpointsList}
      />
    );
  } else if (subpage === "logs") {
    const logs = await getRequestLogs(project.id);
    content = <ProjectLogs projectId={project.id} initialLogs={logs} />;
  } else if (subpage === "settings") {
    content = <ProjectSettings project={project} />;
  }

  // Wrap in the standard layout styling
  return <div className="flex h-full w-full flex-col">{content}</div>;
}
export const dynamic = "force-dynamic";
