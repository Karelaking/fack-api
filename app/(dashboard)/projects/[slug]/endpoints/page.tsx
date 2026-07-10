import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getEndpoints } from "@/lib/actions/endpoints";
import { ProjectEndpoints } from "@/components/dashboard/ProjectEndpoints";

interface EndpointsPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Server page loading endpoint definitions for a project workspace.
 */
export default async function EndpointsPage({ params }: EndpointsPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const endpointsList = await getEndpoints(project.id);

  return (
    <ProjectEndpoints
      projectId={project.id}
      initialEndpoints={endpointsList}
    />
  );
}
