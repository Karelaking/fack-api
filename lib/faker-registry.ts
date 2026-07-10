/**
 * Fack API's — Faker.js Provider Registry
 *
 * This module provides a categorized catalog of all available Faker.js data
 * providers. It is consumed by the FakerProviderSelect component in the
 * Edit Bar to let users pick realistic mock data generators for each field.
 *
 * Each provider maps to a Faker.js method path (e.g., "person.firstName")
 * which is embedded in the JSON Schema as an `x-faker` extension keyword.
 *
 * @see https://fakerjs.dev/api/
 */

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Provider Definitions ────────────────────────────────────────────────────

const providerDefinitions: FakerProvider[] = [
  // Person
  { value: "person.firstName", label: "First Name", example: "John", category: "Person" },
  { value: "person.lastName", label: "Last Name", example: "Doe", category: "Person" },
  { value: "person.fullName", label: "Full Name", example: "John Doe", category: "Person" },
  { value: "person.gender", label: "Gender", example: "Female", category: "Person" },
  { value: "person.jobTitle", label: "Job Title", example: "Software Engineer", category: "Person" },
  { value: "person.bio", label: "Bio", example: "Passionate developer...", category: "Person" },

  // Internet
  { value: "internet.email", label: "Email", example: "john@example.com", category: "Internet" },
  { value: "internet.username", label: "Username", example: "johndoe42", category: "Internet" },
  { value: "internet.url", label: "URL", example: "https://example.com", category: "Internet" },
  { value: "internet.ip", label: "IPv4 Address", example: "192.168.1.1", category: "Internet" },
  { value: "internet.ipv6", label: "IPv6 Address", example: "2001:0db8::1", category: "Internet" },
  { value: "internet.userAgent", label: "User Agent", example: "Mozilla/5.0...", category: "Internet" },
  { value: "internet.password", label: "Password", example: "x7K#mP9...", category: "Internet" },

  // Location
  { value: "location.streetAddress", label: "Street Address", example: "123 Main St", category: "Location" },
  { value: "location.street", label: "Street Name", example: "Broadway", category: "Location" },
  { value: "location.buildingNumber", label: "Building Number", example: "45A", category: "Location" },
  { value: "location.city", label: "City", example: "San Francisco", category: "Location" },
  { value: "location.county", label: "County", example: "Orange County", category: "Location" },
  { value: "location.state", label: "State", example: "California", category: "Location" },
  { value: "location.stateAbbr", label: "State Abbreviation", example: "NY", category: "Location" },
  { value: "location.zipCode", label: "Zip Code", example: "94102", category: "Location" },
  { value: "location.country", label: "Country", example: "United States", category: "Location" },
  { value: "location.countryCode", label: "Country Code (ISO 2-letter)", example: "US", category: "Location" },
  { value: "location.timeZone", label: "Timezone", example: "Europe/London", category: "Location" },
  { value: "location.latitude", label: "Latitude", example: "37.7749", category: "Location" },
  { value: "location.longitude", label: "Longitude", example: "-122.4194", category: "Location" },

  // Commerce
  { value: "commerce.productName", label: "Product Name", example: "Ergonomic Keyboard", category: "Commerce" },
  { value: "commerce.price", label: "Price", example: "29.99", category: "Commerce" },
  { value: "commerce.department", label: "Department", example: "Electronics", category: "Commerce" },
  { value: "commerce.productDescription", label: "Product Description", example: "A sleek...", category: "Commerce" },

  // Finance
  { value: "finance.amount", label: "Amount", example: "542.50", category: "Finance" },
  { value: "finance.currencyCode", label: "Currency Code", example: "USD", category: "Finance" },
  { value: "finance.accountNumber", label: "Account Number", example: "12345678", category: "Finance" },
  { value: "finance.creditCardNumber", label: "Credit Card", example: "4111-1111-...", category: "Finance" },

  // Date
  { value: "date.past", label: "Past Date", example: "2023-06-15T...", category: "Date" },
  { value: "date.future", label: "Future Date", example: "2027-03-22T...", category: "Date" },
  { value: "date.recent", label: "Recent Date", example: "2026-07-08T...", category: "Date" },
  { value: "date.birthdate", label: "Birthdate", example: "1990-05-12T...", category: "Date" },
  { value: "date.anytime", label: "Random Date", example: "2025-11-12T...", category: "Date" },

  // Lorem / Text
  { value: "lorem.word", label: "Word", example: "lorem", category: "Text" },
  { value: "lorem.words", label: "Words", example: "lorem ipsum dolor", category: "Text" },
  { value: "lorem.sentence", label: "Sentence", example: "Lorem ipsum...", category: "Text" },
  { value: "lorem.paragraph", label: "Paragraph", example: "Quisquam est...", category: "Text" },
  { value: "lorem.slug", label: "Slug", example: "lorem-ipsum-dolor", category: "Text" },

  // Number
  { value: "number.int", label: "Integer", example: "42", category: "Number" },
  { value: "number.float", label: "Float", example: "3.14", category: "Number" },

  // Identifiers
  { value: "string.uuid", label: "UUID", example: "a1b2c3d4-...", category: "Identifier" },
  { value: "string.nanoid", label: "Nano ID", example: "V1StGXR8_Z5...", category: "Identifier" },
  { value: "string.alphanumeric", label: "Alphanumeric", example: "abc123", category: "Identifier" },

  // Image
  { value: "image.url", label: "Image URL", example: "https://picsum.photos/...", category: "Image" },
  { value: "image.avatar", label: "Avatar URL", example: "https://avatars.io/...", category: "Image" },

  // Phone
  { value: "phone.number", label: "Phone Number", example: "+1-555-123-4567", category: "Phone" },
  { value: "phone.imei", label: "IMEI", example: "35-209900-176148-1", category: "Phone" },

  // Company
  { value: "company.name", label: "Company Name", example: "Acme Corp", category: "Company" },
  { value: "company.catchPhrase", label: "Catch Phrase", example: "Innovate synergies", category: "Company" },
  { value: "company.buzzPhrase", label: "Buzz Phrase", example: "leverage agile...", category: "Company" },

  // Color
  { value: "color.human", label: "Color Name", example: "indigo", category: "Color" },
  { value: "color.rgb", label: "RGB Color", example: "#4287f5", category: "Color" },

  // System
  { value: "system.fileName", label: "File Name", example: "report.pdf", category: "System" },
  { value: "system.mimeType", label: "MIME Type", example: "application/json", category: "System" },
  { value: "system.filePath", label: "File Path", example: "/usr/local/bin/...", category: "System" },

  // Database
  { value: "database.column", label: "Column Name", example: "created_at", category: "Database" },
  { value: "database.type", label: "Column Type", example: "varchar", category: "Database" },
  { value: "database.engine", label: "DB Engine", example: "InnoDB", category: "Database" },
];

// ─── Grouped Categories ─────────────────────────────────────────────────────

/**
 * Returns all providers grouped by category for the searchable dropdown.
 * Categories are sorted alphabetically, providers within each category
 * maintain their defined order.
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
 * Useful for validation and lookup operations.
 */
export function getAllProviders(): FakerProvider[] {
  return providerDefinitions;
}

/**
 * Looks up a provider by its Faker.js method path.
 * Returns undefined if the provider is not found.
 */
export function getProviderByValue(value: string): FakerProvider | undefined {
  return providerDefinitions.find((p) => p.value === value);
}
