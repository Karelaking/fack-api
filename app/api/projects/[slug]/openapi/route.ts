import { NextRequest, NextResponse } from "next/server";
import { findProjectBySlug } from "@/lib/services/project.service";
import { generateOpenApi } from "@/lib/services/openapi.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const project = await findProjectBySlug(params.slug);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const openApi = generateOpenApi(project);

    return new NextResponse(JSON.stringify(openApi, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${project.slug}-openapi.json"`,
      },
    });
  } catch (error) {
    console.error("[Fack API] OpenAPI export failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
