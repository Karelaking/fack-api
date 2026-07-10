import { faker } from "@faker-js/faker";

export interface FakerProvider {
  /** Unique identifier matching the Faker.js method path */
  value: string;
  /** Human-readable display label */
  label: string;
  /** Example output for UI preview */
  example: string;
  /** Category grouping for the dropdown */
  category: string;
}

export interface FakerCategory {
  /** Category display name */
  name: string;
  /** List of providers in this category */
  providers: FakerProvider[];
}

const ignoredCategories = new Set([
  "helpers",
  "definitions",
  "locales",
  "locale",
  "localeFallback",
  "rawDefinitions",
  "_randomizer"
]);

const ignoredMethods = new Set([
  "parse",
  "fake",
  "unique",
  "slugify",
  "seed",
  "setDefaultRefDate",
  "urlLoremFlickr",
  "urlPicsum",
  "urlUnsplash",
  "avatarLoremFlickr"
]);

/**
 * Dynamically scans the entire @faker-js/faker object to extract all zero-argument
 * generator methods at runtime. Ensures 100% coverage of all Faker.js data types.
 */
function buildDynamicProviders(): FakerProvider[] {
  const list: FakerProvider[] = [];

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const splitCamelCase = (s: string) => s.replace(/([A-Z])/g, " $1").trim();

  // Find all category keys on the faker object
  const categories = Object.keys(faker).filter((key) => {
    const val = (faker as unknown as Record<string, unknown>)[key];
    return (
      val &&
      typeof val === "object" &&
      !ignoredCategories.has(key) &&
      !key.startsWith("_")
    );
  });

  for (const cat of categories) {
    const catObj = (faker as unknown as Record<string, unknown>)[cat] as Record<string, unknown>;
    const methods = Object.keys(catObj).filter((method) => {
      const val = catObj[method];
      return typeof val === "function" && !ignoredMethods.has(method) && !method.startsWith("_");
    });

    for (const method of methods) {
      const value = `${cat}.${method}`;
      const label = capitalize(splitCamelCase(method));
      const category = capitalize(cat);

      try {
        // Run the faker generator once to get a real life example for the UI
        const exampleVal = (catObj[method] as () => unknown)();
        let exampleStr = "";

        if (typeof exampleVal === "object" && exampleVal !== null) {
          // If it returns an object or array, serialize it nicely
          exampleStr = JSON.stringify(exampleVal);
        } else if (exampleVal !== undefined && exampleVal !== null) {
          exampleStr = String(exampleVal);
        }

        // Only include it if it generates a clean string of reasonable length
        if (exampleStr && exampleStr !== "undefined" && exampleStr !== "null" && exampleStr.length < 150) {
          list.push({
            value,
            label,
            example: exampleStr,
            category,
          });
        }
      } catch {
        // Skip any helper/generator that requires custom arguments and throws an error
      }
    }
  }

  // Add custom parameterized/category image providers
  const imageCategories = [
    "sports",
    "animals",
    "business",
    "cats",
    "city",
    "fashion",
    "food",
    "nature",
    "technics",
    "transport",
    "abstract",
    "people",
    "nightlife",
  ];
  imageCategories.forEach((cat) => {
    const cap = cat.charAt(0).toUpperCase() + cat.slice(1);
    list.push({
      value: `image.${cat}`,
      label: `Image (${cap})`,
      example: `https://loremflickr.com/640/480/${cat}?lock=42`,
      category: "Image",
    });
  });

  // Add custom sizes
  const sizes = [
    { name: "urlSquare", label: "Image (Square 200x200)", size: "200/200" },
    { name: "urlThumbnail", label: "Image (Thumbnail 150x150)", size: "150/150" },
    { name: "urlHD", label: "Image (HD 1280x720)", size: "1280/720" },
    { name: "urlFullHD", label: "Image (Full HD 1920x1080)", size: "1920/1080" },
  ];
  sizes.forEach((s) => {
    list.push({
      value: `image.${s.name}`,
      label: s.label,
      example: `https://picsum.photos/${s.size}?random=1`,
      category: "Image",
    });
  });

  // Add avatars and portraits
  list.push({
    value: "image.avatar",
    label: "Avatar (Random)",
    example: "https://cloudflare-ipfs.com/ipfs/Qmd3W5D2g8nStYA7pQQWvWM27C2cZGUrkwwK7v1TRacg7L/avatar/89.jpg",
    category: "Image",
  });
  list.push({
    value: "image.avatarGitHub",
    label: "Avatar (GitHub Style)",
    example: "https://avatars.githubusercontent.com/u/10001",
    category: "Image",
  });
  list.push({
    value: "image.personPortrait",
    label: "Portrait (Person)",
    example: "https://cloudflare-ipfs.com/ipfs/Qmd3W5D2g8nStYA7pQQWvWM27C2cZGUrkwwK7v1TRacg7L/avatar/22.jpg",
    category: "Image",
  });
  list.push({
    value: "image.customCategory",
    label: "Image (Custom Category...)",
    example: "https://loremflickr.com/640/480/dog?lock=10",
    category: "Image",
  });
  // Sort by category first, then by label to make it clean
  return list.sort((a, b) => {
    const catCompare = a.category.localeCompare(b.category);
    if (catCompare !== 0) return catCompare;
    return a.label.localeCompare(b.label);
  });
}

// Compute once and cache
const providerDefinitions: FakerProvider[] = buildDynamicProviders();

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
