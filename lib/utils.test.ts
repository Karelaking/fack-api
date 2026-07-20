import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, slugify, slugifyInput, formatRelativeTime } from "./utils";

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-4 py-2", "px-6")).toBe("py-2 px-6");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});

describe("slugify", () => {
  it("converts text to url-safe slug", () => {
    expect(slugify("My Cool Project!")).toBe("my-cool-project");
  });

  it("trims whitespace", () => {
    expect(slugify("  API v2.0  ")).toBe("api-v20");
  });

  it("collapses consecutive hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("removes leading/trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello");
  });
});

describe("slugifyInput", () => {
  it("preserves slashes for nested paths", () => {
    expect(slugifyInput("api/v1/auth")).toBe("api/v1/auth");
  });

  it("lowercases input", () => {
    expect(slugifyInput("My Path")).toBe("my-path");
  });

  it("removes special characters except slashes and hyphens", () => {
    expect(slugifyInput("api/v1! @test")).toBe("api/v1-test");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for recent dates", () => {
    expect(formatRelativeTime(new Date("2026-07-20T11:59:30Z"))).toBe(
      "just now",
    );
  });

  it("returns minutes ago", () => {
    expect(formatRelativeTime(new Date("2026-07-20T11:55:00Z"))).toBe("5m ago");
  });

  it("returns hours ago", () => {
    expect(formatRelativeTime(new Date("2026-07-20T09:00:00Z"))).toBe("3h ago");
  });

  it("returns days ago", () => {
    expect(formatRelativeTime(new Date("2026-07-18T12:00:00Z"))).toBe("2d ago");
  });

  it("returns month/day for older dates in same year", () => {
    expect(formatRelativeTime(new Date("2026-06-15T12:00:00Z"))).toBe("Jun 15");
  });

  it("returns month/day/year for different year", () => {
    expect(formatRelativeTime(new Date("2025-06-15T12:00:00Z"))).toBe(
      "Jun 15, 2025",
    );
  });
});
