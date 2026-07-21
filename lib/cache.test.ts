import { describe, it, expect, beforeEach } from "vitest";
import {
  getCachedMockData,
  setCachedMockData,
  getCachedSingleMockData,
  setCachedSingleMockData,
  clearCache,
} from "./cache";

describe("Mock Data Caching", () => {
  beforeEach(() => {
    clearCache();
  });

  it("should return undefined for missing cache keys", () => {
    expect(getCachedMockData("non-existent-route")).toBeUndefined();
    expect(getCachedSingleMockData("non-existent-route")).toBeUndefined();
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

  it("should clear mock data cache when clearCache is called", () => {
    const routeId1 = "route-1";
    const routeId2 = "route-2";
    const singleRouteId = "single-route-3";

    setCachedMockData(routeId1, [{ id: 1 }]);
    setCachedMockData(routeId2, [{ id: 2 }]);
    setCachedSingleMockData(singleRouteId, { id: 3 });

    clearCache();

    expect(getCachedMockData(routeId1)).toBeUndefined();
    expect(getCachedMockData(routeId2)).toBeUndefined();
    expect(getCachedSingleMockData(singleRouteId)).toBeUndefined();
  });
});
