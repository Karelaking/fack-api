import { describe, it, expect, afterEach, vi } from "vite-plus/test";
import {
  AgentGenerationError,
  parseSseFrame,
  splitSseFrames,
  streamApiGeneration,
  type AgentStreamEvent,
} from "../lib/ai/agent-client";
import type {
  GenerateApiResponse,
  GenerationProgressStep,
} from "../lib/ai/types";

const progressStep: GenerationProgressStep = {
  id: "designing",
  label: "Designing endpoints, routes & schemas",
  status: "active",
  detail: "Resources: products",
};

const completeResult: GenerateApiResponse = {
  success: true,
  proposalId: "proposal-1",
  expectedVersion: 3,
};

function frame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

function stubFetch(response: Response | (() => Response)): void {
  vi.stubGlobal("fetch", async () =>
    typeof response === "function" ? response() : response,
  );
}

describe("splitSseFrames", () => {
  it("separates whole frames from a partial trailing frame", () => {
    const { frames, rest } = splitSseFrames(
      "event: progress\ndata: {}\n\nevent: com",
    );

    expect(frames).toEqual(["event: progress\ndata: {}"]);
    expect(rest).toBe("event: com");
  });

  it("accepts CRLF separators", () => {
    const { frames, rest } = splitSseFrames("event: a\r\ndata: 1\r\n\r\n");

    expect(frames).toEqual(["event: a\r\ndata: 1"]);
    expect(rest).toBe("");
  });
});

describe("parseSseFrame", () => {
  it("parses a progress frame", () => {
    expect(
      parseSseFrame(`event: progress\ndata: ${JSON.stringify(progressStep)}`),
    ).toEqual({ type: "progress", step: progressStep });
  });

  it("parses a complete frame", () => {
    expect(parseSseFrame(frame("complete", completeResult).trim())).toEqual({
      type: "complete",
      result: completeResult,
    });
  });

  it("parses an error frame carrying a JSON message", () => {
    expect(
      parseSseFrame(
        `event: error\ndata: ${JSON.stringify({ message: "boom" })}`,
      ),
    ).toEqual({ type: "error", message: "boom" });
  });

  it("falls back to the raw payload for a non-JSON error frame", () => {
    expect(parseSseFrame("event: error\ndata: upstream unavailable")).toEqual({
      type: "error",
      message: "upstream unavailable",
    });
  });

  it("ignores keep-alive comments and unknown event names", () => {
    expect(parseSseFrame(": keep-alive")).toBeNull();
    expect(parseSseFrame("event: ping\ndata: {}")).toBeNull();
  });
});

describe("streamApiGeneration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards progress and complete events across split chunks", async () => {
    const body = `${frame("progress", progressStep)}${frame("complete", completeResult)}`;
    const midpoint = Math.floor(body.length / 2);

    stubFetch(
      new Response(streamOf([body.slice(0, midpoint), body.slice(midpoint)]), {
        status: 200,
      }),
    );

    const events: AgentStreamEvent[] = [];

    await streamApiGeneration({
      projectId: "project-1",
      prompt: "build a shop",
      onEvent: (event) => events.push(event),
    });

    expect(events).toEqual([
      { type: "progress", step: progressStep },
      { type: "complete", result: completeResult },
    ]);
  });

  it("rejects with AgentGenerationError when the stream reports an error", async () => {
    stubFetch(
      new Response(
        streamOf([
          `event: error\ndata: ${JSON.stringify({ message: "model offline" })}`,
        ]),
        { status: 200 },
      ),
    );

    await expect(
      streamApiGeneration({ prompt: "build a shop", onEvent: () => {} }),
    ).rejects.toThrow(AgentGenerationError);
  });

  it("surfaces the server message for a non-2xx response", async () => {
    stubFetch(
      new Response(JSON.stringify({ error: "Prompt is too vague" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      streamApiGeneration({ prompt: "x", onEvent: () => {} }),
    ).rejects.toThrow("Prompt is too vague");
  });

  it("falls back to a status message when the error body is not JSON", async () => {
    stubFetch(new Response("nope", { status: 503 }));

    await expect(
      streamApiGeneration({ prompt: "x", onEvent: () => {} }),
    ).rejects.toThrow("Generation request failed (503)");
  });
});
