import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  parseProjectPath,
  type ProjectSubpage,
} from "@/lib/utils/project-slug";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getEndpoints } from "@/lib/actions/endpoints";
import { getCanvasState } from "@/lib/actions/canvas";
import { getRequestLogs } from "@/lib/actions/logs";
import { CanvasContainer } from "@/components/canvas/CanvasContainer";
import { ProjectEndpoints } from "@/components/dashboard/ProjectEndpoints";
import { ProjectLogs } from "@/components/dashboard/ProjectLogs";
import { ProjectSettings } from "@/components/dashboard/ProjectSettings";
import { SubpageLoading } from "./_components/SubpageLoading";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{ slug: string[] }>;
}

/**
 * Project workspace page.
 *
 * The layout has already validated the project and handled the bare-slug redirect,
 * so this component only needs to determine which subpage to render and fetch
 * the subpage-specific data.
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug: slugParam } = await params;
  const { projectSlug, subpage } = parseProjectPath(slugParam);

  if (!projectSlug || !subpage) {
    notFound();
  }

  const project = await getProjectBySlug(projectSlug);
  if (!project) {
    notFound();
  }

  const isLockedHeight = subpage === "canvas" || subpage === "logs";

  return (
    <div
      className={`flex h-full w-full flex-col ${isLockedHeight ? "overflow-hidden" : "bg-background overflow-y-auto"}`}
    >
      <Suspense fallback={<SubpageLoading subpage={subpage} />}>
        <SubpageContent subpage={subpage} project={project} />
      </Suspense>
    </div>
  );
}

// ─── Async Subpage Content ───────────────────────────────────────────────────

/**
 * Async component that fetches subpage-specific data.
 * Wrapped in Suspense so each subpage gets its own loading boundary.
 */
async function SubpageContent({
  subpage,
  project,
}: {
  subpage: ProjectSubpage;
  project: {
    id: string;
    slug: string;
    name: string;
    isLoggingEnabled: boolean;
    isCachingEnabled: boolean;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}) {
  switch (subpage) {
    case "canvas": {
      const [endpointsList, canvasState] = await Promise.all([
        getEndpoints(project.id),
        getCanvasState(project.id),
      ]);
      const routesList = endpointsList.flatMap((ep) => ep.routes);
      return (
        <CanvasContainer
          projectId={project.id}
          projectSlug={project.slug}
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

    case "endpoints": {
      const endpointsList = await getEndpoints(project.id);
      return (
        <ProjectEndpoints
          projectId={project.id}
          projectSlug={project.slug}
          initialEndpoints={endpointsList}
        />
      );
    }

    case "logs": {
      const logs = await getRequestLogs(project.id);
      return <ProjectLogs projectId={project.id} initialLogs={logs} />;
    }

    case "settings": {
      const isLogsDbConfigured = !!process.env.LOGS_POSTGRES_URL;
      return (
        <ProjectSettings
          project={project}
          isLogsDbConfigured={isLogsDbConfigured}
        />
      );
    }

    default:
      notFound();
  }
}
