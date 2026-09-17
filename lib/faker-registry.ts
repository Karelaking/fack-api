/**
 * Fack API's — Faker Provider Registry
 *
 * Implements an Object-Oriented Registry pattern for discovering and querying Faker.js providers.
 * Provides:
 * - O(1) provider lookups via a pre-indexed Map
 * - Memoized category grouping computed once on initialization
 * - Clean TypeScript typing and full backward compatibility
 */

import {
  staticProviderDefinitions,
  type FakerProvider,
} from "./faker-providers-data";

export type { FakerProvider };

export interface FakerCategory {
  /** Category display name */
  name: string;
  /** List of providers in this category */
  providers: FakerProvider[];
}

/**
 * Registry service encapsulating lookup indexing and memoized category grouping.
 */
export class FakerRegistryService {
  private static instance: FakerRegistryService | undefined;

  private readonly providers: FakerProvider[];
  private readonly providerMap: Map<string, FakerProvider>;
  private readonly groupedCategories: FakerCategory[];

  private constructor() {
    this.providers = staticProviderDefinitions;
    this.providerMap = new Map<string, FakerProvider>();

    const categoryMap = new Map<string, FakerProvider[]>();

    for (const provider of this.providers) {
      this.providerMap.set(provider.value, provider);

      const existing = categoryMap.get(provider.category) ?? [];
      existing.push(provider);
      categoryMap.set(provider.category, existing);
    }

    this.groupedCategories = Array.from(categoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, providers]) => ({ name, providers }));
  }

  /**
   * Singleton accessor for FakerRegistryService.
   */
  public static getInstance(): FakerRegistryService {
    if (!FakerRegistryService.instance) {
      FakerRegistryService.instance = new FakerRegistryService();
    }
    return FakerRegistryService.instance;
  }

  /**
   * Returns all providers grouped by category in alphabetical order.
   */
  public getGroupedProviders(): FakerCategory[] {
    return this.groupedCategories;
  }

  /**
   * Returns a flat array of all registered Faker providers.
   */
  public getAllProviders(): FakerProvider[] {
    return this.providers;
  }

  /**
   * Finds a provider by its unique method path value in O(1) time.
   */
  public getProviderByValue(value: string): FakerProvider | undefined {
    return this.providerMap.get(value);
  }
}

// ── Backward-Compatible Facade ───────────────────────────────────────────────

const fakerRegistryService = FakerRegistryService.getInstance();

export function getGroupedProviders(): FakerCategory[] {
  return fakerRegistryService.getGroupedProviders();
}

export function getAllProviders(): FakerProvider[] {
  return fakerRegistryService.getAllProviders();
}

export function getProviderByValue(value: string): FakerProvider | undefined {
  return fakerRegistryService.getProviderByValue(value);
}
