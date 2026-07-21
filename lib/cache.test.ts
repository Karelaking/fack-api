import { describe, it, expect, beforeEach } from "vitest";
import { getCachedMockData, setCachedMockData, clearCache } from "./cache";

describe("Mock Data Caching", () => {
  beforeEach(() => {
    clearCache();
  });

  it("should return undefined for missing cache keys", () => {
    expect(getCachedMockData("non-existent-route")).toBeUndefined();
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

  it("should clear mock data cache when clearCache is called", () => {
    const routeId1 = "route-1";
    const routeId2 = "route-2";

    setCachedMockData(routeId1, [{ id: 1 }]);
    setCachedMockData(routeId2, [{ id: 2 }]);

    clearCache();

    expect(getCachedMockData(routeId1)).toBeUndefined();
    expect(getCachedMockData(routeId2)).toBeUndefined();
  });
});
