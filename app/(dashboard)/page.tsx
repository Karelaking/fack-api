import { getProjects } from "@/lib/actions/projects";
import { ProjectGrid } from "@/components/dashboard/ProjectGrid";

/**
 * Next.js App Router Page.
 * Fetches initial projects list on the server and mounts the interactive ProjectGrid.
 */
export default async function DashboardPage() {
  const projects = await getProjects();

  return <ProjectGrid initialProjects={projects} />;
}
