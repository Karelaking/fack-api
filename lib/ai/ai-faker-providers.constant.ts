/**
 * Fack AI API Architect — Approved Faker Providers Registry
 *
 * Implements a controlled registry of approved Faker.js providers to prevent
 * AI hallucinations while providing realistic mock data fields.
 */

import { getProviderByValue } from "@/lib/faker-registry";

/**
 * Curated list of popular, REST-optimized Faker providers.
 */
export const APPROVED_FAKER_PROVIDERS = [
  // Identifiers & Core
  "string.uuid",
  "string.nanoid",
  "string.alphanumeric",
  "number.int",
  "number.float",
  "boolean.boolean",

  // Person & Auth
  "person.fullName",
  "person.firstName",
  "person.lastName",
  "person.jobTitle",
  "person.gender",
  "person.bio",
  "internet.email",
  "internet.username",
  "internet.password",
  "image.avatar",

  // Web & Network
  "internet.url",
  "internet.ip",
  "internet.ipv6",
  "internet.userAgent",

  // Commerce & E-commerce
  "commerce.productName",
  "commerce.price",
  "commerce.productDescription",
  "commerce.department",
  "commerce.isbn",

  // Location & Address
  "location.city",
  "location.country",
  "location.streetAddress",
  "location.zipCode",
  "location.state",
  "location.latitude",
  "location.longitude",

  // Dates & Times
  "date.recent",
  "date.past",
  "date.future",
  "date.anytime",

  // Content & Text
  "lorem.sentence",
  "lorem.paragraph",
  "lorem.words",
  "lorem.slug",

  // Company & Organization
  "company.name",
  "company.catchPhrase",

  // Finance
  "finance.amount",
  "finance.currencyCode",
  "finance.currencyName",
  "finance.accountNumber",
  "finance.creditCardNumber",

  // System & Tech
  "system.mimeType",
  "system.fileExtension",
  "system.semver",
] as const;

export type ApprovedFakerProvider = (typeof APPROVED_FAKER_PROVIDERS)[number];

const APPROVED_PROVIDER_SET = new Set<string>(APPROVED_FAKER_PROVIDERS);

/**
 * Validates whether a given provider key is in the curated registry or valid Faker registry.
 */
export function isValidFakerProvider(provider: string): boolean {
  if (APPROVED_PROVIDER_SET.has(provider)) {
    return true;
  }
  const registered = getProviderByValue(provider);
  return registered !== undefined;
}

/**
 * Returns a fallback provider if the requested provider is invalid.
 */
export function normalizeFakerProvider(provider?: string): string | undefined {
  if (!provider) {
    return undefined;
  }
  if (isValidFakerProvider(provider)) {
    return provider;
  }
  return "lorem.words";
}
