import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, endpoints, notes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import JSZip from "jszip";
import { generateExpressProject } from "@/lib/codegen/express-generator";
import type { CachedRoute } from "@/lib/cache";
import {
  assertProjectOwnedBy,
  authErrorResponse,
  requireUserId,
} from "@/lib/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug: projectSlug } = await context.params;

    const userId = await requireUserId();

    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, projectSlug),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found", debugId: projectSlug },
        { status: 404 },
      );
    }

    assertProjectOwnedBy(project, userId);

    const [projectEndpoints, projectNotes] = await Promise.all([
      db.query.endpoints.findMany({
        where: eq(endpoints.projectId, project.id),
        orderBy: [desc(endpoints.createdAt)],
        with: {
          routes: {
            with: {
              webhooks: true,
            },
          },
        },
      }),
      db.query.notes.findMany({
        where: eq(notes.projectId, project.id),
        orderBy: [desc(notes.pinned), desc(notes.updatedAt)],
      }),
    ]);

    const zip = new JSZip();

    // Keep the scratchpad with the export so local backups are self-contained.
    zip.file("notes.json", JSON.stringify(projectNotes, null, 2));

    // Map to CodeGenContext
    const codegenContext = {
      project,
      endpoints: projectEndpoints.map((ep) => ({
        ...ep,
        routes: ep.routes as unknown as CachedRoute[],
      })),
    };

    const files = generateExpressProject(codegenContext);

    for (const file of files) {
      zip.file(file.path, file.content);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // NextResponse doesn't accept Buffer in newer Next.js types cleanly without casting or Blob
    // @ts-expect-error Next.js doesn't type Buffer well for bodyInit
    const response = new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.slug || "export"}.zip"`,
      },
    });

    return response;
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Export error:", error);
    return NextResponse.json(
      {
        error: "Failed to export project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
