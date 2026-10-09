import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, endpoints } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import JSZip from "jszip";
import { generateExpressProject } from "@/lib/codegen/express-generator";
import type { CachedRoute } from "@/lib/cache";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await context.params;

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectEndpoints = await db.query.endpoints.findMany({
      where: eq(endpoints.projectId, project.id),
      orderBy: [desc(endpoints.createdAt)],
      with: {
        routes: {
          with: {
            webhooks: true,
          },
        },
      },
    });

    const zip = new JSZip();

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
