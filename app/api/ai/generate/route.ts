/**
 * Fack AI API Architect — Generate Route Handler
 *
 * POST /api/ai/generate
 *
 * Accepts a natural language prompt and optional projectId, executes the
 * 5-phase AI generation pipeline, and returns or streams structured specifications.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateApiSpecification } from "@/lib/ai/ai-architect.service";
import {
  authErrorResponse,
  requireProjectAccess,
  requireUserId,
} from "@/lib/auth";
import type {
  GenerateApiRequest,
  GenerationProgressStep,
} from "@/lib/types/ai.type";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as GenerateApiRequest;
    const { projectId, prompt, stream } = body;

    await requireUserId();
    if (projectId) {
      await requireProjectAccess(projectId);
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "Prompt is required and must not be empty" },
        { status: 400 },
      );
    }

    // Handle SSE streaming for live progress updates
    if (stream) {
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: unknown) => {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
              ),
            );
          };

          try {
            const result = await generateApiSpecification({
              projectId,
              prompt,
              onProgress: (step: GenerationProgressStep) => {
                sendEvent("progress", step);
              },
            });

            sendEvent("complete", result);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Generation failed";
            sendEvent("error", { message });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(customStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Standard JSON response
    const result = await generateApiSpecification({
      projectId,
      prompt,
    });

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate API specification";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
