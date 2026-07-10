import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/actions/projects";
import { ProjectSettings } from "@/components/dashboard/ProjectSettings";

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Server page loading metadata for project settings.
 */
export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectSettings project={project} />;
}
