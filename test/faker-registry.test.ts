import { describe, it, expect } from "vitest";
import {
  getAllProviders,
  getGroupedProviders,
  getProviderByValue,
} from "../lib/faker-registry";

describe("Faker Registry", () => {
  it("should return a flat list of all providers", () => {
    const providers = getAllProviders();
    expect(providers.length).toBeGreaterThan(0);
    expect(providers[0]).toHaveProperty("label");
    expect(providers[0]).toHaveProperty("value");
    expect(providers[0]).toHaveProperty("category");
  });

  it("should return grouped categories in alphabetical order", () => {
    const groups = getGroupedProviders();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]).toHaveProperty("name");
    expect(groups[0]).toHaveProperty("providers");
    expect(Array.isArray(groups[0].providers)).toBe(true);

    // Verify groups are sorted alphabetically by category name
    for (let i = 0; i < groups.length - 1; i++) {
      const compareResult = groups[i].name.localeCompare(groups[i + 1].name);
      expect(compareResult).toBeLessThanOrEqual(0);
    }
  });

  it("should retrieve a provider by its unique method path value", () => {
    const all = getAllProviders();
    const firstValue = all[0].value;

    const matched = getProviderByValue(firstValue);
    expect(matched).toBeDefined();
    expect(matched?.value).toBe(firstValue);
  });

  it("should return undefined for non-existent provider value", () => {
    expect(getProviderByValue("non.existent.path")).toBeUndefined();
  });
});
