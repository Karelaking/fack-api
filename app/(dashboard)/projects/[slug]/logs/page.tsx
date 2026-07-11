import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/actions/projects";
import { getRequestLogs } from "@/lib/actions/logs";
import { ProjectLogs } from "@/components/dashboard/ProjectLogs";

interface LogsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LogsPage({ params }: LogsPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const logs = await getRequestLogs(project.id);

  // Refresh server action wrapper
  const handleRefresh = async () => {
    "use server";
    return getRequestLogs(project.id);
  };

  return (
    <ProjectLogs
      projectId={project.id}
      initialLogs={logs}
      onRefresh={handleRefresh}
    />
  );
}
