import { describe, it, expect } from "vitest";
import { POST as generateHandler } from "../app/api/ai/generate/route";
import { proxy } from "../proxy";
import { NextRequest } from "next/server";

describe("AI API Architect — Route Handlers & Proxy Dispatching", () => {
  describe("proxy.ts system path matching", () => {
    it("should treat /api/ai/generate as a system path and pass through without rewrite", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/generate", {
        method: "POST",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = (await proxy(req, {} as any)) as any;

      // If rewritten, headers or internal url would change to /api/mock/...
      // For a pass-through, proxy returns NextResponse.next()
      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    });

    it("should treat /api/ai/apply as a system path and pass through without rewrite", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/apply", {
        method: "POST",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = (await proxy(req, {} as any)) as any;

      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    });

    it("should rewrite non-system mock routes to /api/mock/...", async () => {
      const req = new NextRequest(
        "http://localhost:3000/ecommerce-project/products",
        {
          method: "GET",
        },
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = (await proxy(req, {} as any)) as any;

      expect(res.headers.get("x-middleware-rewrite")).toContain(
        "/api/mock/ecommerce-project/products",
      );
    });
  });

  describe("POST /api/ai/generate handler", () => {
    it("should return 400 when prompt is missing or empty", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: "   " }),
      });

      const res = await generateHandler(req);
      expect(res.status).toBe(400);

      const json = (await res.json()) as { success: boolean; error: string };
      expect(json.success).toBe(false);
      expect(json.error).toContain("Prompt is required");
    });

    it("should return 200 with generated specification for a valid prompt", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Create an e-commerce API with products and orders",
        }),
      });

      const res = await generateHandler(req);
      expect(res.status).toBe(200);

      const json = (await res.json()) as {
        success: boolean;
        generation: { endpoints: Array<{ name: string; routes: unknown[] }> };
        changeSet: { summary: { routesCount: number } };
      };

      expect(json.success).toBe(true);
      expect(json.generation.endpoints.length).toBeGreaterThanOrEqual(1);
      expect(json.changeSet.summary.routesCount).toBeGreaterThan(0);
    });
  });
});
