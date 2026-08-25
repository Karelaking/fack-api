import { getProjects } from "@/lib/actions/projects";
import { ProjectGrid } from "@/components/dashboard/ProjectGrid";

export const dynamic = "force-dynamic";

/**
 * Dashboard Page.
 * Fetches workspace projects list on the server and mounts ProjectGrid.
 */
export default async function DashboardPage() {
  const projects = await getProjects();
  return <ProjectGrid initialProjects={projects} />;
}
