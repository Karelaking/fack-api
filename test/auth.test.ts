import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { POST as generateHandler } from "../app/api/ai/generate/route";
import { POST as importHandler } from "../app/api/import/openapi/route";
import { GET as typescriptHandler } from "../app/api/typescript/[routeId]/route";

const mockedAuth = vi.mocked(auth);

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function signOut() {
  mockedAuth.mockResolvedValueOnce({ userId: null } as never);
}

describe("Authorization guards", () => {
  afterEach(() => {
    mockedAuth.mockReset();
    mockedAuth.mockResolvedValue({ userId: "user_test_owner" } as never);
  });

  it("rejects unauthenticated AI generation with 401", async () => {
    signOut();

    const res = await generateHandler(
      jsonRequest("/api/ai/generate", { prompt: "Create a billing API" }),
    );

    expect(res.status).toBe(401);
    const json = (await res.json()) as { success: boolean; error: string };
    expect(json.success).toBe(false);
    expect(json.error).toBe("Unauthorized");
  });

  it("forbids generating against a project the user cannot access", async () => {
    const res = await generateHandler(
      jsonRequest("/api/ai/generate", {
        prompt: "Create a billing API",
        projectId: "project-owned-by-someone-else",
      }),
    );

    expect(res.status).toBe(403);
  });

  it("rejects unauthenticated OpenAPI imports with 401", async () => {
    signOut();

    const res = await importHandler(
      jsonRequest("/api/import/openapi", {
        projectId: "p1",
        openApiString: "{}",
      }),
    );

    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated TypeScript downloads with 401", async () => {
    signOut();

    const res = await typescriptHandler(
      new NextRequest("http://localhost:3000/api/typescript/abc"),
      { params: Promise.resolve({ routeId: "abc" }) },
    );

    expect(res.status).toBe(401);
  });
});
