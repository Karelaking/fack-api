/**
 * Fack AI API Architect — Agent Streaming Client
 *
 * Owns the browser side of the generation transport: it POSTs to
 * `/api/ai/generate`, decodes the Server-Sent Events stream, and hands typed
 * events to the caller. Keeping this outside React lets the agent session store
 * drive a run without a component owning the request lifecycle.
 */

import type {
  GenerateApiResponse,
  GenerationProgressStep,
} from "@/lib/ai/types";

/** Raised when the server reports a generation failure or the request fails. */
export class AgentGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentGenerationError";
  }
}

export type AgentStreamEvent =
  | { type: "progress"; step: GenerationProgressStep }
  | { type: "complete"; result: GenerateApiResponse }
  | { type: "error"; message: string };

/**
 * Splits a raw SSE buffer into whole frames plus whatever trailing bytes are
 * still incomplete. Frames are separated by a blank line, and either CRLF or LF
 * line endings are accepted.
 */
export function splitSseFrames(buffer: string): {
  frames: string[];
  rest: string;
} {
  const parts = buffer.split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? "";
  return { frames: parts, rest };
}

/**
 * Parses a single SSE frame into a typed agent event.
 * Returns `null` for frames that carry no recognised event.
 */
export function parseSseFrame(frame: string): AgentStreamEvent | null {
  const eventMatch = frame.match(/^event:\s*(\S+)/m);
  const dataMatch = frame.match(/^data:\s*(.*)$/m);
  if (!eventMatch || !dataMatch) {
    return null;
  }

  const eventName = eventMatch[1];
  const payload = dataMatch[1].trim();

  switch (eventName) {
    case "progress": {
      if (!payload) return null;
      return {
        type: "progress",
        step: JSON.parse(payload) as GenerationProgressStep,
      };
    }
    case "complete": {
      if (!payload) return null;
      return {
        type: "complete",
        result: JSON.parse(payload) as GenerateApiResponse,
      };
    }
    case "error": {
      let message = "Generation failed";
      if (payload) {
        try {
          const parsed = JSON.parse(payload) as { message?: string };
          if (typeof parsed.message === "string") {
            message = parsed.message;
          }
        } catch {
          message = payload;
        }
      }
      return { type: "error", message };
    }
    default:
      return null;
  }
}

export interface StreamApiGenerationInput {
  projectId?: string;
  prompt: string;
  signal?: AbortSignal;
  onEvent: (event: AgentStreamEvent) => void;
}

/**
 * Runs one generation request and forwards every streamed event to `onEvent`.
 *
 * Resolves once the stream closes. Throws {@link AgentGenerationError} when the
 * server reports an `error` event or answers with a non-2xx status, so callers
 * can surface a retryable failure state.
 */
export async function streamApiGeneration({
  projectId,
  prompt,
  signal,
  onEvent,
}: StreamApiGenerationInput): Promise<void> {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, prompt, stream: true }),
    signal,
  });

  if (!response.ok) {
    let message = describeGenerateFailure(response.status);
    try {
      const errorBody = (await response.json()) as unknown;
      message = extractErrorMessage(errorBody) ?? message;
    } catch {
      // Non-JSON error body — keep the status-based message.
    }
    throw new AgentGenerationError(message);
  }

  if (!response.body) {
    throw new AgentGenerationError(
      "No response body received from the generation stream",
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const dispatch = (frame: string): void => {
    const event = parseSseFrame(frame);
    if (!event) return;
    if (event.type === "error") {
      throw new AgentGenerationError(event.message);
    }
    onEvent(event);
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Frames are separated by a blank line; the trailing slice may be partial.
      const { frames, rest } = splitSseFrames(buffer);
      buffer = rest;

      for (const frame of frames) {
        dispatch(frame);
      }
    }

    // A well-behaved server terminates every frame with a blank line, but a
    // truncated final chunk must not silently drop the last event.
    if (buffer.trim().length > 0) {
      dispatch(buffer);
    }
  } finally {
    // Releasing the lock lets an aborted stream be discarded without leaking it.
    reader.releaseLock();
  }
}

/** Reads whichever error field the API returned, if any. */
export function extractErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  const record = body as Record<string, unknown>;
  for (const key of ["error", "message"]) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

/** Human-readable fallback text for a failed generation request. */
export function describeGenerateFailure(status: number): string {
  return `Generation request failed (${status})`;
}
