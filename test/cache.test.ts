import { describe, it, expect, beforeEach } from "vitest";
import {
  getCachedMockData,
  setCachedMockData,
  getCachedSingleMockData,
  setCachedSingleMockData,
  getCachedPageData,
  setCachedPageData,
  prunePageCache,
  clearCache,
  getCachedProjectsList,
  setCachedProjectsList,
  getCachedProjectBySlug,
  setCachedProjectBySlug,
} from "../lib/cache";
import type { Project } from "@/db/schema";

describe("Mock Data Caching", () => {
  beforeEach(() => {
    clearCache();
  });

  const mockProject: Project = {
    id: "proj-1",
    name: "Sample Project",
    slug: "sample-slug",
    description: "",
    isLoggingEnabled: true,
    isCachingEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should return undefined for missing cache keys", () => {
    expect(getCachedMockData("non-existent-route")).toBeUndefined();
    expect(getCachedSingleMockData("non-existent-route")).toBeUndefined();
    expect(getCachedPageData("non-existent-route", 1, 10)).toBeUndefined();
  });

  it("should cache and retrieve project lists and projects by slug", () => {
    expect(getCachedProjectsList()).toBeUndefined();
    setCachedProjectsList([mockProject]);
    expect(getCachedProjectsList()).toEqual([mockProject]);

    expect(getCachedProjectBySlug("sample-slug")).toBeUndefined();
    setCachedProjectBySlug("sample-slug", mockProject);
    expect(getCachedProjectBySlug("sample-slug")).toEqual(mockProject);
  });

  it("should cache and retrieve mock arrays by route ID", () => {
    const routeId = "route-123";
    const data = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];

    setCachedMockData(routeId, data);
    expect(getCachedMockData(routeId)).toEqual(data);
  });

  it("should cache and retrieve single mock objects by route ID", () => {
    const routeId = "single-route-123";
    const data = { id: 1, name: "Alice" };

    setCachedSingleMockData(routeId, data);
    expect(getCachedSingleMockData(routeId)).toEqual(data);
  });

  it("should cache and retrieve page data separately for different pages and limits", () => {
    const routeId = "paged-route";
    setCachedPageData(routeId, 1, 10, [{ id: 1 }]);
    setCachedPageData(routeId, 2, 10, [{ id: 2 }]);
    setCachedPageData(routeId, 1, 20, [{ id: 3 }]); // Different limit

    expect(getCachedPageData(routeId, 1, 10)).toEqual([{ id: 1 }]);
    expect(getCachedPageData(routeId, 2, 10)).toEqual([{ id: 2 }]);
    expect(getCachedPageData(routeId, 1, 20)).toEqual([{ id: 3 }]);
  });

  it("should keep only previous, current, and next page when pruned, removing others", () => {
    const routeId = "paged-route-prune";
    setCachedPageData(routeId, 1, 10, [{ id: 1 }]);
    setCachedPageData(routeId, 2, 10, [{ id: 2 }]);
    setCachedPageData(routeId, 3, 10, [{ id: 3 }]);
    setCachedPageData(routeId, 4, 10, [{ id: 4 }]);
    setCachedPageData(routeId, 5, 10, [{ id: 5 }]);

    // Visiting page 3 keeps page 2, 3, 4. Page 1 and Page 5 are pruned.
    prunePageCache(routeId, 3, 10);

    expect(getCachedPageData(routeId, 1, 10)).toBeUndefined();
    expect(getCachedPageData(routeId, 2, 10)).toEqual([{ id: 2 }]);
    expect(getCachedPageData(routeId, 3, 10)).toEqual([{ id: 3 }]);
    expect(getCachedPageData(routeId, 4, 10)).toEqual([{ id: 4 }]);
    expect(getCachedPageData(routeId, 5, 10)).toBeUndefined();
  });

  it("should clear mock data cache when clearCache is called", () => {
    const routeId1 = "route-1";
    const routeId2 = "route-2";
    const singleRouteId = "single-route-3";
    const pagedRouteId = "paged-route-4";

    setCachedMockData(routeId1, [{ id: 1 }]);
    setCachedMockData(routeId2, [{ id: 2 }]);
    setCachedSingleMockData(singleRouteId, { id: 3 });
    setCachedPageData(pagedRouteId, 1, 10, [{ id: 4 }]);
    setCachedProjectsList([mockProject]);
    setCachedProjectBySlug("sample-slug", mockProject);

    clearCache();

    expect(getCachedMockData(routeId1)).toBeUndefined();
    expect(getCachedMockData(routeId2)).toBeUndefined();
    expect(getCachedSingleMockData(singleRouteId)).toBeUndefined();
    expect(getCachedPageData(pagedRouteId, 1, 10)).toBeUndefined();
    expect(getCachedProjectsList()).toBeUndefined();
    expect(getCachedProjectBySlug("sample-slug")).toBeUndefined();
  });
});
