import { NextRequest, NextResponse } from "next/server";
import { findProjectBySlug } from "@/lib/services/project.service";
import { generateOpenApi } from "@/lib/services/openapi.service";
import {
  assertProjectOwnedBy,
  authErrorResponse,
  requireUserId,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const userId = await requireUserId();

    const project = await findProjectBySlug(params.slug);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    assertProjectOwnedBy(project, userId);

    const openApi = generateOpenApi(project);

    return new NextResponse(JSON.stringify(openApi, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${project.slug}-openapi.json"`,
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("[Fack API] OpenAPI export failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
