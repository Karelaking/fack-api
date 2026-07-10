import { redirect } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Default project page redirecting to the canvas subview.
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  redirect(`/projects/${slug}/canvas`);
}
