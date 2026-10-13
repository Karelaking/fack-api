import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { getMockJwtSecret } from "../lib/mock-jwt";

function decode(secret: Uint8Array): string {
  return new TextDecoder().decode(secret);
}

describe("getMockJwtSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers the configured JWT_SECRET", () => {
    vi.stubEnv("JWT_SECRET", "super-secret");

    expect(decode(getMockJwtSecret("project-1"))).toBe("super-secret");
  });

  it("falls back to the project id outside production", () => {
    vi.stubEnv("JWT_SECRET", "");
    vi.stubEnv("NODE_ENV", "development");

    expect(decode(getMockJwtSecret("project-1"))).toBe("project-1");
  });

  it("refuses to derive a secret in production without JWT_SECRET", () => {
    vi.stubEnv("JWT_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getMockJwtSecret("project-1")).toThrow(/JWT_SECRET/);
  });
});
