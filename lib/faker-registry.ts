import { staticProviderDefinitions, type FakerProvider } from "./faker-providers-data";

export type { FakerProvider };

export interface FakerCategory {
  /** Category display name */
  name: string;
  /** List of providers in this category */
  providers: FakerProvider[];
}

// Compute once and cache
const providerDefinitions: FakerProvider[] = staticProviderDefinitions;

/**
 * Returns all providers grouped by category for the searchable dropdown.
 */
export function getGroupedProviders(): FakerCategory[] {
  const categoryMap = new Map<string, FakerProvider[]>();

  for (const provider of providerDefinitions) {
    const existing = categoryMap.get(provider.category) ?? [];
    existing.push(provider);
    categoryMap.set(provider.category, existing);
  }

  return Array.from(categoryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, providers]) => ({ name, providers }));
}

/**
 * Returns a flat list of all available providers.
 */
export function getAllProviders(): FakerProvider[] {
  return providerDefinitions;
}

/**
 * Looks up a provider by its Faker.js method path.
 */
export function getProviderByValue(value: string): FakerProvider | undefined {
  return providerDefinitions.find((p) => p.value === value);
}
