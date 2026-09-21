/**
 * Fack AI API Architect — Core Architect Agent Service
 *
 * Orchestrates the full 5-phase generation lifecycle:
 * 1. Understand -> 2. Inspect -> 3. Design -> 4. Validate -> 5. Present (Change Set)
 *
 * Integrates with the Vercel AI SDK (Gemini / OpenAI) with automatic fallback
 * to the deterministic domain synthesizer when running offline or without API keys.
 */

import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type {
  GeneratedApi,
  ApiChangeSet,
  GenerationProgressStep,
  RouteConflict,
  DetailedPromptResult,
} from "@/lib/types/ai.type";
import {
  AI_SYSTEM_PROMPT,
  AI_PROMPT_EXPANSION_SYSTEM_PROMPT,
} from "./ai-prompts.constant";
import {
  generatedApiSchema,
  detailedPromptSchema,
  validateAndNormalizeApi,
  buildApiChangeSet,
} from "./ai-validator.service";
import { getProjectSummary } from "@/lib/services/project.service";
import {
  getEndpointsByProjectId,
  type EndpointWithRoutes,
} from "@/lib/services/endpoint.service";
import {
  getRoutesByProjectId,
  type RouteWithEndpoint,
} from "@/lib/services/route.service";
import {
  synthesizeFallbackApi,
  synthesizeDetailedPrompt,
} from "./ai-fallback-synthesizer.constant";

export interface GenerateApiOptions {
  projectId?: string;
  prompt: string;
  onProgress?: (step: GenerationProgressStep) => void;
}

export interface GenerateApiExecutionResult {
  success: boolean;
  generation: GeneratedApi;
  changeSet: ApiChangeSet;
  conflicts: RouteConflict[];
  durationMs: number;
  modelUsed: string;
  detailedPrompt?: string;
  detailedSummary?: string;
  error?: string;
}

/**
 * Resolves the active model provider based on configured environment variables.
 */
function resolveAiModel():
  | { model: Parameters<typeof generateObject>[0]["model"]; name: string }
  | undefined {
  const geminiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return {
      model: google("gemini-2.5-flash"),
      name: "gemini-2.5-flash",
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey });
    return {
      model: openai("gpt-4o-mini"),
      name: "gpt-4o-mini",
    };
  }

  return undefined;
}

/**
 * Expands a raw user prompt into an exhaustive, structured architectural specification.
 */
export async function expandUserPrompt(
  rawPrompt: string,
  projectContext?: string,
): Promise<DetailedPromptResult> {
  const cleanPrompt = rawPrompt.trim();
  if (!cleanPrompt) {
    throw new Error("Prompt cannot be empty");
  }

  const modelConfig = resolveAiModel();
  if (modelConfig) {
    try {
      const systemContext = projectContext
        ? `${AI_PROMPT_EXPANSION_SYSTEM_PROMPT}\n\nExisting Project Context:\n${projectContext}`
        : AI_PROMPT_EXPANSION_SYSTEM_PROMPT;

      const result = await generateObject({
        model: modelConfig.model,
        schema: detailedPromptSchema,
        system: systemContext,
        prompt: cleanPrompt,
      });

      return result.object;
    } catch (llmError) {
      console.warn(
        "[Fack AI] LLM prompt expansion failed, falling back to deterministic synthesizer:",
        llmError,
      );
      return synthesizeDetailedPrompt(cleanPrompt);
    }
  }

  return synthesizeDetailedPrompt(cleanPrompt);
}

/**
 * Executes the complete AI API Architect generation lifecycle.
 */
export async function generateApiSpecification(
  options: GenerateApiOptions,
): Promise<GenerateApiExecutionResult> {
  const startTime = Date.now();
  const { projectId, prompt, onProgress } = options;

  const emitProgress = (
    id: GenerationProgressStep["id"],
    label: string,
    status: GenerationProgressStep["status"],
    detail?: string,
  ) => {
    if (onProgress) {
      onProgress({ id, label, status, detail });
    }
  };

  try {
    // ── Phase 1: Understand Requirements ──────────────────────────────────
    emitProgress(
      "understanding",
      "Analyzing requirements & domain scope",
      "active",
    );
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      throw new Error("Prompt cannot be empty");
    }
    emitProgress(
      "understanding",
      "Analyzing requirements & domain scope",
      "completed",
    );

    // ── Phase 2: Inspect Existing Project ─────────────────────────────────
    emitProgress(
      "inspecting",
      "Inspecting existing project architecture",
      "active",
    );
    let projectSummaryText = "";
    let existingEndpoints: EndpointWithRoutes[] = [];
    let existingRoutes: RouteWithEndpoint[] = [];

    if (projectId) {
      const summary = await getProjectSummary(projectId);
      existingEndpoints = await getEndpointsByProjectId(projectId);
      existingRoutes = await getRoutesByProjectId(projectId);

      if (summary) {
        projectSummaryText = `
Existing Project Information:
- Project Name: "${summary.name}"
- Current Endpoints: ${summary.endpoints.map((e) => `${e.name} (${e.basePath}) with ${e.routeCount} routes`).join(", ")}
- Total Routes: ${summary.routeCount}

When modifying, preserve existing resource conventions where appropriate, avoid unnecessary route deletions, and design cohesive extensions.
`;
      }
    }
    emitProgress(
      "inspecting",
      "Inspecting existing project architecture",
      "completed",
    );

    // ── Phase 3: Detailed Specification Generation (Prompt Detailing) ─────
    emitProgress(
      "expanding_prompt",
      "Synthesizing detailed architecture specification",
      "active",
    );
    const detailedSpec = await expandUserPrompt(
      cleanPrompt,
      projectSummaryText,
    );
    emitProgress(
      "expanding_prompt",
      "Synthesizing detailed architecture specification",
      "completed",
      detailedSpec.summary,
    );

    // ── Phase 4: Design API Endpoints & Routes ─────────────────────────────
    emitProgress(
      "designing",
      "Designing REST endpoints & schema models",
      "active",
      detailedSpec.entities.length > 0
        ? `Resources: ${detailedSpec.entities.join(", ")}`
        : undefined,
    );

    const modelConfig = resolveAiModel();
    let rawGeneratedApi: GeneratedApi;
    let modelUsed = "deterministic-architect-engine";

    if (modelConfig) {
      modelUsed = modelConfig.name;
      try {
        const generationPrompt = `Detailed Architecture Specification:\n${detailedSpec.detailedPrompt}\n\nOriginal Request: "${cleanPrompt}"`;
        const result = await generateObject({
          model: modelConfig.model,
          schema: generatedApiSchema,
          system: `${AI_SYSTEM_PROMPT}\n${projectSummaryText}`,
          prompt: generationPrompt,
        });
        rawGeneratedApi = result.object;
      } catch (llmError) {
        console.warn(
          "[Fack AI] LLM call failed, falling back to deterministic synthesizer:",
          llmError,
        );
        rawGeneratedApi = synthesizeFallbackApi(cleanPrompt);
        modelUsed = `${modelConfig.name} (fallback: synthesizer)`;
      }
    } else {
      // Offline / API key not configured -> use built-in domain synthesizer
      rawGeneratedApi = synthesizeFallbackApi(cleanPrompt);
    }

    emitProgress(
      "designing",
      "Designing REST endpoints & schema models",
      "completed",
    );

    // ── Phase 5: Validate and Normalize ───────────────────────────────────
    emitProgress(
      "validating",
      "Validating REST semantics & mock data bindings",
      "active",
    );
    const validation = validateAndNormalizeApi(rawGeneratedApi);

    const validatedApi = validation.normalizedApi ?? rawGeneratedApi;
    emitProgress(
      "validating",
      "Validating REST semantics & mock data bindings",
      "completed",
    );

    // ── Phase 6: Conflict Detection & Change Set ──────────────────────────
    emitProgress(
      "checking_conflicts",
      "Analyzing route collisions & conflict resolution",
      "active",
    );
    const changeSet = buildApiChangeSet(
      validatedApi,
      existingEndpoints,
      existingRoutes,
    );

    emitProgress(
      "checking_conflicts",
      "Analyzing route collisions & conflict resolution",
      "completed",
    );
    emitProgress(
      "complete",
      "API specification generated successfully",
      "completed",
    );

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      generation: validatedApi,
      changeSet,
      conflicts: changeSet.conflicts,
      durationMs,
      modelUsed,
      detailedPrompt: detailedSpec.detailedPrompt,
      detailedSummary: detailedSpec.summary,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown generation error";
    emitProgress("complete", `Generation failed: ${errorMessage}`, "failed");
    throw err;
  }
}
