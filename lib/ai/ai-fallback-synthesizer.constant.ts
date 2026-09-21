/**
 * Fack AI API Architect — Deterministic Domain Synthesizer
 *
 * Provides realistic domain template generation when no external LLM API key
 * is configured, or as a graceful fallback during network or quota failures.
 */

import type {
  GeneratedApi,
  GeneratedEndpoint,
  DetailedPromptResult,
} from "@/lib/types/ai.type";

/**
 * Common mock domain templates for realistic synthesis.
 */
const E_COMMERCE_TEMPLATE: GeneratedApi = {
  name: "Storefront & Commerce Operations Platform API",
  description:
    "Enterprise storefront API for product catalog browsing, multi-item shopping carts, and order checkout fulfillment",
  endpoints: [
    {
      name: "Product Catalog",
      description:
        "Product discovery, catalog categorization, and inventory status",
      basePath: "/products",
      routes: [
        {
          method: "GET",
          path: "/",
          statusCode: 200,
          description: "List all products with sorting and pagination",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "title",
              type: "string",
              fakerProvider: "commerce.productName",
            },
            { name: "price", type: "number", fakerProvider: "commerce.price" },
            {
              name: "description",
              type: "string",
              fakerProvider: "commerce.productDescription",
            },
            {
              name: "category",
              type: "string",
              fakerProvider: "commerce.department",
            },
            {
              name: "inStock",
              type: "boolean",
              fakerProvider: "boolean.boolean",
            },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 40, max: 120 },
          errorRate: 0,
        },
        {
          method: "GET",
          path: "/:id",
          statusCode: 200,
          description: "Retrieve single product details by ID",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "title",
              type: "string",
              fakerProvider: "commerce.productName",
            },
            { name: "price", type: "number", fakerProvider: "commerce.price" },
            {
              name: "description",
              type: "string",
              fakerProvider: "commerce.productDescription",
            },
            {
              name: "category",
              type: "string",
              fakerProvider: "commerce.department",
            },
          ],
          latency: { min: 20, max: 80 },
          errorRate: 0,
        },
        {
          method: "POST",
          path: "/",
          statusCode: 201,
          description: "Create a new product listing",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "title",
              type: "string",
              fakerProvider: "commerce.productName",
            },
            { name: "price", type: "number", fakerProvider: "commerce.price" },
            { name: "status", type: "string", fakerProvider: "lorem.words" },
          ],
          latency: { min: 80, max: 200 },
          errorRate: 0,
        },
      ],
    },
    {
      name: "Shopping Carts",
      description:
        "Shopping cart sessions, cart line items, and subtotal calculation",
      basePath: "/carts",
      routes: [
        {
          method: "GET",
          path: "/",
          statusCode: 200,
          description: "Retrieve current shopping cart and subtotal",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "totalAmount",
              type: "number",
              fakerProvider: "finance.amount",
            },
            {
              name: "currency",
              type: "string",
              fakerProvider: "finance.currencyCode",
            },
            { name: "itemCount", type: "number", fakerProvider: "number.int" },
            { name: "updatedAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 30, max: 90 },
          errorRate: 0,
        },
        {
          method: "POST",
          path: "/items",
          statusCode: 201,
          description: "Add a product item to the shopping cart",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            { name: "productId", type: "string", fakerProvider: "string.uuid" },
            { name: "quantity", type: "number", fakerProvider: "number.int" },
            {
              name: "unitPrice",
              type: "number",
              fakerProvider: "commerce.price",
            },
            { name: "addedAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 50, max: 150 },
          errorRate: 0,
        },
        {
          method: "DELETE",
          path: "/items/:id",
          statusCode: 204,
          description: "Remove item from cart",
          properties: [],
          latency: { min: 30, max: 70 },
          errorRate: 0,
        },
      ],
    },
    {
      name: "Order Fulfillment",
      description:
        "Order checkout processing, invoice calculation, and fulfillment tracking",
      basePath: "/orders",
      routes: [
        {
          method: "POST",
          path: "/",
          statusCode: 201,
          description: "Place a new customer order",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "orderNumber",
              type: "string",
              fakerProvider: "string.alphanumeric",
            },
            { name: "status", type: "string", fakerProvider: "lorem.words" },
            {
              name: "totalAmount",
              type: "number",
              fakerProvider: "finance.amount",
            },
            {
              name: "currency",
              type: "string",
              fakerProvider: "finance.currencyCode",
            },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 100, max: 300 },
          errorRate: 0,
        },
        {
          method: "GET",
          path: "/:id",
          statusCode: 200,
          description: "Get order status and fulfillment tracking",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "orderNumber",
              type: "string",
              fakerProvider: "string.alphanumeric",
            },
            { name: "status", type: "string", fakerProvider: "lorem.words" },
            {
              name: "totalAmount",
              type: "number",
              fakerProvider: "finance.amount",
            },
            {
              name: "currency",
              type: "string",
              fakerProvider: "finance.currencyCode",
            },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
            { name: "updatedAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 40, max: 100 },
          errorRate: 0,
        },
      ],
    },
  ],
};

const SOCIAL_TEMPLATE: GeneratedApi = {
  name: "Social Networking & Community Platform API",
  description:
    "Scalable social engagement API for user identities, chronological content feeds, and social interactions",
  endpoints: [
    {
      name: "User Identity & Profiles",
      description:
        "Member directory, profile discovery, and follower relationship graph",
      basePath: "/users",
      routes: [
        {
          method: "GET",
          path: "/",
          statusCode: 200,
          description: "List discoverable user accounts",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "username",
              type: "string",
              fakerProvider: "internet.username",
            },
            {
              name: "fullName",
              type: "string",
              fakerProvider: "person.fullName",
            },
            {
              name: "avatarUrl",
              type: "string",
              fakerProvider: "image.avatar",
            },
            { name: "bio", type: "string", fakerProvider: "person.bio" },
          ],
          latency: { min: 50, max: 150 },
          errorRate: 0,
        },
        {
          method: "GET",
          path: "/:id",
          statusCode: 200,
          description: "Get user profile details",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "username",
              type: "string",
              fakerProvider: "internet.username",
            },
            {
              name: "fullName",
              type: "string",
              fakerProvider: "person.fullName",
            },
            { name: "bio", type: "string", fakerProvider: "person.bio" },
          ],
          latency: { min: 30, max: 90 },
          errorRate: 0,
        },
        {
          method: "POST",
          path: "/:id/follow",
          statusCode: 200,
          description: "Follow a user account",
          properties: [
            {
              name: "success",
              type: "boolean",
              fakerProvider: "boolean.boolean",
            },
            {
              name: "followedAt",
              type: "string",
              fakerProvider: "date.recent",
            },
          ],
          latency: { min: 60, max: 140 },
          errorRate: 0,
        },
      ],
    },
    {
      name: "Feed & Content Publishing",
      description:
        "Chronological activity streams, post authoring, and social engagement reactions",
      basePath: "/posts",
      routes: [
        {
          method: "GET",
          path: "/",
          statusCode: 200,
          description: "Fetch chronological feed posts",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "author",
              type: "string",
              fakerProvider: "person.fullName",
            },
            {
              name: "content",
              type: "string",
              fakerProvider: "lorem.paragraph",
            },
            { name: "likesCount", type: "number", fakerProvider: "number.int" },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 60, max: 180 },
          errorRate: 0,
        },
        {
          method: "POST",
          path: "/",
          statusCode: 201,
          description: "Create a new post",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "content",
              type: "string",
              fakerProvider: "lorem.paragraph",
            },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 80, max: 200 },
          errorRate: 0,
        },
        {
          method: "POST",
          path: "/:id/likes",
          statusCode: 200,
          description: "Toggle like reaction on a post",
          properties: [
            {
              name: "isLiked",
              type: "boolean",
              fakerProvider: "boolean.boolean",
            },
            { name: "likeCount", type: "number", fakerProvider: "number.int" },
          ],
          latency: { min: 40, max: 100 },
          errorRate: 0,
        },
      ],
    },
  ],
};

const FOOD_DELIVERY_TEMPLATE: GeneratedApi = {
  name: "On-Demand Delivery & Logistics Platform API",
  description:
    "Multi-sided food delivery platform API for restaurant menus, order dispatch, and live courier tracking",
  endpoints: [
    {
      name: "Restaurant Directory & Menus",
      description:
        "Merchant discovery, culinary categorization, and itemized menu catalog",
      basePath: "/restaurants",
      routes: [
        {
          method: "GET",
          path: "/",
          statusCode: 200,
          description: "List nearby restaurants with ratings",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            { name: "name", type: "string", fakerProvider: "company.name" },
            { name: "cuisine", type: "string", fakerProvider: "lorem.words" },
            { name: "city", type: "string", fakerProvider: "location.city" },
            { name: "rating", type: "number", fakerProvider: "number.float" },
            {
              name: "isOpen",
              type: "boolean",
              fakerProvider: "boolean.boolean",
            },
          ],
          latency: { min: 50, max: 130 },
          errorRate: 0,
        },
        {
          method: "GET",
          path: "/:id/menu-items",
          statusCode: 200,
          description: "Retrieve restaurant menu items",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "restaurantId",
              type: "string",
              fakerProvider: "string.uuid",
            },
            {
              name: "name",
              type: "string",
              fakerProvider: "commerce.productName",
            },
            { name: "price", type: "number", fakerProvider: "commerce.price" },
            {
              name: "description",
              type: "string",
              fakerProvider: "commerce.productDescription",
            },
            {
              name: "isAvailable",
              type: "boolean",
              fakerProvider: "boolean.boolean",
            },
          ],
          latency: { min: 40, max: 100 },
          errorRate: 0,
        },
      ],
    },
    {
      name: "Delivery Fulfillment & Courier Telemetry",
      description:
        "Delivery orders, fulfillment status tracking, and GPS courier coordinates",
      basePath: "/orders",
      routes: [
        {
          method: "POST",
          path: "/",
          statusCode: 201,
          description: "Create delivery order",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "orderNumber",
              type: "string",
              fakerProvider: "string.alphanumeric",
            },
            { name: "status", type: "string", fakerProvider: "lorem.words" },
            {
              name: "deliveryAddress",
              type: "string",
              fakerProvider: "location.streetAddress",
            },
            {
              name: "totalAmount",
              type: "number",
              fakerProvider: "finance.amount",
            },
            {
              name: "estimatedDeliveryMinutes",
              type: "number",
              fakerProvider: "number.int",
            },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 80, max: 220 },
          errorRate: 0,
        },
        {
          method: "GET",
          path: "/:id/tracking",
          statusCode: 200,
          description: "Live driver location and delivery ETA",
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            {
              name: "orderStatus",
              type: "string",
              fakerProvider: "lorem.words",
            },
            {
              name: "driverFullName",
              type: "string",
              fakerProvider: "person.fullName",
            },
            {
              name: "latitude",
              type: "number",
              fakerProvider: "location.latitude",
            },
            {
              name: "longitude",
              type: "number",
              fakerProvider: "location.longitude",
            },
            {
              name: "estimatedDeliveryMinutes",
              type: "number",
              fakerProvider: "number.int",
            },
            { name: "updatedAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 30, max: 80 },
          errorRate: 0,
        },
      ],
    },
  ],
};

/**
 * Converts a raw noun into a grammatically correct plural form.
 */
export function toPluralResource(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) {
    return "Items";
  }

  const lower = trimmed.toLowerCase();

  // Standard irregular mapping
  const irregulars: Record<string, string> = {
    person: "People",
    child: "Children",
    man: "Men",
    woman: "Women",
    auth: "Authentication",
    authentication: "Authentication",
    login: "Authentication",
    session: "Sessions",
    inventory: "Inventories",
    category: "Categories",
    company: "Companies",
    library: "Libraries",
    city: "Cities",
    country: "Countries",
    policy: "Policies",
    property: "Properties",
    delivery: "Deliveries",
    currency: "Currencies",
    history: "Histories",
    hospital: "Hospitals",
  };

  if (irregulars[lower]) {
    return irregulars[lower];
  }

  // Already plural patterns
  if (
    lower.endsWith("ies") ||
    lower.endsWith("ses") ||
    lower.endsWith("ches") ||
    lower.endsWith("shes") ||
    lower.endsWith("xes")
  ) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  if (
    lower.endsWith("s") &&
    !lower.endsWith("ss") &&
    !lower.endsWith("us") &&
    !lower.endsWith("is")
  ) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  // Consonant + y -> ies
  if (lower.endsWith("y") && !/[aeiou]y$/.test(lower)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1, -1) + "ies";
  }

  // s, sh, ch, x, z -> es
  if (
    lower.endsWith("s") ||
    lower.endsWith("sh") ||
    lower.endsWith("ch") ||
    lower.endsWith("x") ||
    lower.endsWith("z")
  ) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1) + "es";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1) + "s";
}

/**
 * Synthesizes an enterprise-grade API platform title from a requirement prompt and entities.
 * Ensures consistent Title Case and uppercase "API" suffix.
 */
export function toProfessionalApiName(
  prompt: string,
  entities: string[] = [],
): string {
  const lower = prompt.toLowerCase();

  if (
    lower.includes("ecommerce") ||
    lower.includes("e-commerce") ||
    lower.includes("store") ||
    lower.includes("shop")
  ) {
    return "Storefront & Commerce Operations Platform API";
  }

  if (
    lower.includes("food") ||
    lower.includes("restaurant") ||
    lower.includes("deliver")
  ) {
    return "On-Demand Delivery & Logistics Platform API";
  }

  if (
    lower.includes("social") ||
    lower.includes("post") ||
    lower.includes("feed") ||
    lower.includes("tweet")
  ) {
    return "Social Networking & Community Platform API";
  }

  if (
    lower.includes("hospital") ||
    lower.includes("patient") ||
    lower.includes("doctor") ||
    lower.includes("clinic") ||
    lower.includes("health") ||
    lower.includes("medical")
  ) {
    return "Healthcare & Clinical Practice Platform API";
  }

  if (
    lower.includes("hotel") ||
    lower.includes("booking") ||
    lower.includes("reservation") ||
    lower.includes("travel")
  ) {
    return "Hospitality & Reservation Management API";
  }

  if (
    lower.includes("bank") ||
    lower.includes("payment") ||
    lower.includes("invoice") ||
    lower.includes("finance") ||
    lower.includes("billing")
  ) {
    return "Financial Services & Payment Gateway API";
  }

  if (
    lower.includes("school") ||
    lower.includes("student") ||
    lower.includes("course") ||
    lower.includes("education") ||
    lower.includes("university")
  ) {
    return "Academic Curriculum & Student Records API";
  }

  if (
    lower.includes("inventory") ||
    lower.includes("warehouse") ||
    lower.includes("stock") ||
    lower.includes("supply")
  ) {
    return "Supply Chain & Warehouse Operations API";
  }

  if (
    lower.includes("ticket") ||
    lower.includes("support") ||
    lower.includes("helpdesk") ||
    lower.includes("issue")
  ) {
    return "Customer Support & Incident Management API";
  }

  if (
    lower.includes("property") ||
    lower.includes("real estate") ||
    lower.includes("listing") ||
    lower.includes("rental")
  ) {
    return "Real Estate & Property Management Platform API";
  }

  if (
    lower.includes("crypto") ||
    lower.includes("wallet") ||
    lower.includes("blockchain") ||
    lower.includes("exchange")
  ) {
    return "Digital Asset & Crypto Portfolio API";
  }

  if (
    lower.includes("fleet") ||
    lower.includes("vehicle") ||
    lower.includes("car") ||
    lower.includes("transport")
  ) {
    return "Fleet Telemetry & Dispatch Logistics API";
  }

  if (
    lower.includes("book") ||
    lower.includes("library") ||
    lower.includes("author")
  ) {
    return "Library Catalog & Author Management API";
  }

  // Dynamic synthesis based on identified entities
  if (entities.length >= 2) {
    const first = entities[0].charAt(0).toUpperCase() + entities[0].slice(1);
    const second = entities[1].charAt(0).toUpperCase() + entities[1].slice(1);
    return `${first} & ${second} Operations Platform API`;
  }

  if (entities.length === 1 && entities[0]) {
    const ent = entities[0].charAt(0).toUpperCase() + entities[0].slice(1);
    return `Enterprise ${ent} Management Platform API`;
  }

  // Fallback: clean words from prompt
  const cleaned = prompt
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(" ")
    .filter(
      (w) =>
        w.length > 2 &&
        ![
          "api",
          "create",
          "build",
          "make",
          "with",
          "service",
          "system",
          "that",
          "this",
        ].includes(w.toLowerCase()),
    )
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return cleaned
    ? `${cleaned} Platform API`
    : "Enterprise Operations Platform API";
}

/**
 * Converts a raw resource or entity name into a professional enterprise endpoint title.
 */
export function toProfessionalEndpointName(resourceName: string): string {
  const trimmed = resourceName.trim();
  if (!trimmed) {
    return "Resource Management";
  }

  const lower = trimmed.toLowerCase();
  const commonTitles: Record<string, string> = {
    user: "User Identity & Profiles",
    users: "User Identity & Profiles",
    profile: "User Identity & Profiles",
    profiles: "User Identity & Profiles",
    account: "User Identity & Profiles",
    accounts: "User Identity & Profiles",
    product: "Product Catalog",
    products: "Product Catalog",
    item: "Item Catalog & Inventory",
    items: "Item Catalog & Inventory",
    cart: "Shopping Carts",
    carts: "Shopping Carts",
    order: "Order Fulfillment",
    orders: "Order Fulfillment",
    restaurant: "Restaurant Directory & Menus",
    restaurants: "Restaurant Directory & Menus",
    menu: "Restaurant Directory & Menus",
    menus: "Restaurant Directory & Menus",
    post: "Feed & Content Publishing",
    posts: "Feed & Content Publishing",
    comment: "Comments & Discussions",
    comments: "Comments & Discussions",
    hospital: "Hospital Directory & Facilities",
    hospitals: "Hospital Directory & Facilities",
    patient: "Patient Records & Demographics",
    patients: "Patient Records & Demographics",
    doctor: "Medical Staff & Clinicians",
    doctors: "Medical Staff & Clinicians",
    appointment: "Patient Appointments & Scheduling",
    appointments: "Patient Appointments & Scheduling",
    invoice: "Billing & Invoicing Records",
    invoices: "Billing & Invoicing Records",
    payment: "Payment Processing & Gateway",
    payments: "Payment Processing & Gateway",
    book: "Book Catalog & Editions",
    books: "Book Catalog & Editions",
    author: "Author Profiles & Bibliography",
    authors: "Author Profiles & Bibliography",
    course: "Course Curriculum & Modules",
    courses: "Course Curriculum & Modules",
    student: "Student Records & Enrollment",
    students: "Student Records & Enrollment",
    ticket: "Support Ticket Queue",
    tickets: "Support Ticket Queue",
    inventory: "Inventory & Stock Levels",
    warehouse: "Warehouse Operations & Dispatch",
    shipment: "Logistics & Shipment Tracking",
    shipments: "Logistics & Shipment Tracking",
    vehicle: "Fleet Vehicles & Dispatch",
    vehicles: "Fleet Vehicles & Dispatch",
    hotel: "Hotel Directory & Room Inventory",
    hotels: "Hotel Directory & Room Inventory",
  };

  if (commonTitles[lower]) {
    return commonTitles[lower];
  }

  const words = trimmed.replace(/[_-]+/g, " ").split(" ").filter(Boolean);

  const formattedWords = words.map(
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  );
  const lastWord = formattedWords[formattedWords.length - 1];
  const pluralLastWord = toPluralResource(lastWord);
  formattedWords[formattedWords.length - 1] = pluralLastWord;

  const plural = formattedWords.join(" ");
  return `${plural} Management`;
}

/**
 * Converts a PascalCase or space-delimited string to kebab-case.
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Intelligently generates an API specification matching the user's prompt
 * using template heuristics and keyword matching.
 */
export function synthesizeFallbackApi(prompt: string): GeneratedApi {
  const lower = prompt.toLowerCase();

  if (
    lower.includes("food") ||
    lower.includes("restaurant") ||
    lower.includes("meal") ||
    lower.includes("menu") ||
    lower.includes("deliver")
  ) {
    return JSON.parse(JSON.stringify(FOOD_DELIVERY_TEMPLATE));
  }

  if (
    lower.includes("social") ||
    lower.includes("post") ||
    lower.includes("feed") ||
    lower.includes("follow") ||
    lower.includes("tweet") ||
    lower.includes("comment")
  ) {
    return JSON.parse(JSON.stringify(SOCIAL_TEMPLATE));
  }

  if (
    lower.includes("ecommerce") ||
    lower.includes("e-commerce") ||
    lower.includes("shop") ||
    lower.includes("product") ||
    lower.includes("store") ||
    lower.includes("cart") ||
    lower.includes("order")
  ) {
    return JSON.parse(JSON.stringify(E_COMMERCE_TEMPLATE));
  }

  // Dynamic extraction: extract noun keywords to create custom resources
  const words = lower
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter(
      (w) =>
        w.length > 3 &&
        ![
          "create",
          "with",
          "make",
          "that",
          "this",
          "from",
          "build",
          "api",
          "manage",
          "managing",
          "service",
          "system",
        ].includes(w),
    );

  const rawResource1 = words[0] || "item";
  const pluralResource1 = toPluralResource(rawResource1);
  const basePath1 = `/${toKebabCase(pluralResource1)}`;
  const singularName1 =
    rawResource1.charAt(0).toUpperCase() + rawResource1.slice(1);
  const endpointName1 = toProfessionalEndpointName(pluralResource1);

  const endpoints: GeneratedEndpoint[] = [
    {
      name: endpointName1,
      description: `Domain operations and collection endpoints for ${pluralResource1.toLowerCase()}`,
      basePath: basePath1,
      routes: [
        {
          method: "GET",
          path: "/",
          statusCode: 200,
          description: `List all ${pluralResource1.toLowerCase()} with pagination and sorting`,
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            { name: "name", type: "string", fakerProvider: "lorem.words" },
            {
              name: "description",
              type: "string",
              fakerProvider: "lorem.sentence",
            },
            { name: "status", type: "string", fakerProvider: "lorem.slug" },
            {
              name: "isActive",
              type: "boolean",
              fakerProvider: "boolean.boolean",
            },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
            { name: "updatedAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 40, max: 120 },
          errorRate: 0,
        },
        {
          method: "GET",
          path: "/:id",
          statusCode: 200,
          description: `Retrieve single ${singularName1.toLowerCase()} details by ID`,
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            { name: "name", type: "string", fakerProvider: "lorem.words" },
            {
              name: "description",
              type: "string",
              fakerProvider: "lorem.sentence",
            },
            { name: "status", type: "string", fakerProvider: "lorem.slug" },
            {
              name: "isActive",
              type: "boolean",
              fakerProvider: "boolean.boolean",
            },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 20, max: 70 },
          errorRate: 0,
        },
        {
          method: "POST",
          path: "/",
          statusCode: 201,
          description: `Create a new ${singularName1.toLowerCase()} record`,
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            { name: "name", type: "string", fakerProvider: "lorem.words" },
            { name: "status", type: "string", fakerProvider: "lorem.slug" },
            {
              name: "isActive",
              type: "boolean",
              fakerProvider: "boolean.boolean",
            },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 80, max: 180 },
          errorRate: 0,
        },
        {
          method: "DELETE",
          path: "/:id",
          statusCode: 204,
          description: `Permanently delete ${singularName1.toLowerCase()} by unique identifier`,
          properties: [],
          latency: { min: 30, max: 80 },
          errorRate: 0,
        },
      ],
    },
  ];

  const entities = [pluralResource1];

  const rawResource2 = words[1];
  if (rawResource2 && rawResource2 !== rawResource1) {
    const pluralResource2 = toPluralResource(rawResource2);
    const basePath2 = `/${toKebabCase(pluralResource2)}`;
    const singularName2 =
      rawResource2.charAt(0).toUpperCase() + rawResource2.slice(1);
    const endpointName2 = toProfessionalEndpointName(pluralResource2);
    entities.push(pluralResource2);

    endpoints.push({
      name: endpointName2,
      description: `Domain operations and relational endpoints for ${pluralResource2.toLowerCase()}`,
      basePath: basePath2,
      routes: [
        {
          method: "GET",
          path: "/",
          statusCode: 200,
          description: `List all ${pluralResource2.toLowerCase()} with filters and pagination`,
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            { name: "name", type: "string", fakerProvider: "lorem.words" },
            {
              name: `${rawResource1.toLowerCase()}Id`,
              type: "string",
              fakerProvider: "string.uuid",
            },
            {
              name: "isActive",
              type: "boolean",
              fakerProvider: "boolean.boolean",
            },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 40, max: 110 },
          errorRate: 0,
        },
        {
          method: "POST",
          path: "/",
          statusCode: 201,
          description: `Create a new ${singularName2.toLowerCase()} entry`,
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            { name: "name", type: "string", fakerProvider: "lorem.words" },
            {
              name: `${rawResource1.toLowerCase()}Id`,
              type: "string",
              fakerProvider: "string.uuid",
            },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 50, max: 140 },
          errorRate: 0,
        },
        {
          method: "GET",
          path: "/:id",
          statusCode: 200,
          description: `Retrieve ${singularName2.toLowerCase()} by unique identifier`,
          properties: [
            { name: "id", type: "string", fakerProvider: "string.uuid" },
            { name: "name", type: "string", fakerProvider: "lorem.words" },
            { name: "createdAt", type: "string", fakerProvider: "date.recent" },
          ],
          latency: { min: 30, max: 80 },
          errorRate: 0,
        },
      ],
    });
  }

  const apiName = toProfessionalApiName(prompt, entities);

  return {
    name: apiName,
    description: `Enterprise REST API specification for ${entities.join(" & ").toLowerCase()} lifecycle management`,
    endpoints,
  };
}

/**
 * Synthesizes a rich, multi-section architecture specification from the user's prompt
 * when operating offline or as fallback.
 */
export function synthesizeDetailedPrompt(prompt: string): DetailedPromptResult {
  const lower = prompt.toLowerCase();

  if (
    lower.includes("food") ||
    lower.includes("restaurant") ||
    lower.includes("meal") ||
    lower.includes("menu") ||
    lower.includes("deliver")
  ) {
    return {
      summary:
        "On-demand food delivery architecture supporting restaurant menus, delivery cart ordering, and live GPS driver tracking.",
      entities: ["Restaurants", "Orders", "Drivers"],
      detailedPrompt: `# Food Delivery & Logistics API Specification

## 1. Architectural Scope
Production-grade RESTful mock service simulating a multi-sided food delivery platform. Enables customer discovery of restaurants, menu catalog browsing, transactional cart checkouts, and real-time fulfillment status with driver tracking.

## 2. Core Domain Entities
- **Restaurants**: Merchant profiles, culinary categorizations, operational status, city locations, and aggregate customer ratings.
- **Orders**: Transactional customer delivery orders including destination addresses, item arrays, total cost, and delivery ETAs.
- **Drivers / Tracking**: Courier assignment, location telemetry (lat/long coordinates), and route delivery phases.

## 3. Recommended Endpoint Blueprint
- **Restaurants Resource (\`/restaurants\`)**:
  - \`GET /\`: Filterable listing of open restaurants with ratings and cuisine tags.
  - \`GET /:id/menu\`: Itemized culinary offerings with item IDs, descriptions, and pricing.
- **Orders Resource (\`/orders\`)**:
  - \`POST /\`: Order dispatch and payment simulation returning order status.
  - \`GET /:id/tracking\`: Live courier telemetry and estimated delivery minutes.

## 4. Realistic Data Bindings
- **Faker Providers**: \`company.name\`, \`commerce.productName\`, \`commerce.price\`, \`location.streetAddress\`, \`location.latitude\`, \`location.longitude\`.
- **SLA Bounds**: Latency 30ms - 220ms, 0% error rate default.`,
    };
  }

  if (
    lower.includes("social") ||
    lower.includes("post") ||
    lower.includes("feed") ||
    lower.includes("follow") ||
    lower.includes("tweet") ||
    lower.includes("comment")
  ) {
    return {
      summary:
        "Social media network API with user discovery, chronological feed posts, likes, and relational comments.",
      entities: ["Users", "Posts", "Comments"],
      detailedPrompt: `# Social Networking API Specification

## 1. Architectural Scope
Scalable REST backend specification for social engagement. Supports member profiles, social graph follower relationships, chronological content publishing, engagement metrics, and interaction endpoints.

## 2. Core Domain Entities
- **Users**: Account identities, usernames, full names, avatar image URLs, and profile biographies.
- **Posts**: Rich content feeds, creator attribution, like counters, and creation timestamps.
- **Interactions**: Social graphs (following/followers), post reactions, and comments.

## 3. Recommended Endpoint Blueprint
- **Users Resource (\`/users\`)**:
  - \`GET /\`: Discoverable user directory with bio excerpts and avatars.
  - \`GET /:id\`: Detailed individual profile metadata.
  - \`POST /:id/follow\`: Idempotent follower graph update.
- **Posts Resource (\`/posts\`)**:
  - \`GET /\`: Public activity feed sorted chronologically.
  - \`POST /\`: Publish author post status update.
  - \`POST /:id/likes\`: Toggle like engagement counter.

## 4. Realistic Data Bindings
- **Faker Providers**: \`person.fullName\`, \`internet.username\`, \`image.avatar\`, \`lorem.paragraph\`, \`number.int\`, \`date.recent\`.
- **SLA Bounds**: Latency 30ms - 180ms, 0% error rate default.`,
    };
  }

  if (
    lower.includes("ecommerce") ||
    lower.includes("e-commerce") ||
    lower.includes("shop") ||
    lower.includes("product") ||
    lower.includes("store") ||
    lower.includes("cart") ||
    lower.includes("order")
  ) {
    return {
      summary:
        "Full-featured shopping API supporting product catalog discovery, shopping cart manipulation, and checkout order processing.",
      entities: ["Products", "Cart", "Orders"],
      detailedPrompt: `# E-Commerce Storefront API Specification

## 1. Architectural Scope
Full-featured e-commerce RESTful API designed for web and mobile storefronts. Covers catalog browsing with categorical filters, individual item inspection, user shopping cart management, and order checkout tracking.

## 2. Core Domain Entities
- **Products**: SKU catalog items with titles, pricing, department categories, inventory stock flags, and creation dates.
- **Cart**: Session-bound item collections with item quantities and calculated subtotal amounts.
- **Orders**: Fulfilled customer transactions with purchase line items, order status codes, and currency formatting.

## 3. Recommended Endpoint Blueprint
- **Products Resource (\`/products\`)**:
  - \`GET /\`: Paginated catalog list with sorting and filtering.
  - \`GET /:id\`: Detailed single SKU specifications.
  - \`POST /\`: Inventory ingestion for administrative catalog management.
- **Cart Resource (\`/cart\`)**:
  - \`GET /\`: Active cart items, subtotal calculation, and currency.
  - \`POST /items\`: Add or increment line items.
  - \`DELETE /items/:id\`: Remove item from cart.
- **Orders Resource (\`/orders\`)**:
  - \`POST /\`: Checkout transaction placement.
  - \`GET /:id\`: Order confirmation and fulfillment tracking.

## 4. Realistic Data Bindings
- **Faker Providers**: \`commerce.productName\`, \`commerce.price\`, \`commerce.productDescription\`, \`commerce.department\`, \`finance.amount\`, \`date.recent\`.
- **SLA Bounds**: Latency 20ms - 200ms, 0% error rate default.`,
    };
  }

  const words = lower
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter(
      (w) =>
        w.length > 3 &&
        ![
          "create",
          "with",
          "make",
          "that",
          "this",
          "from",
          "build",
          "api",
          "manage",
          "managing",
          "service",
          "system",
        ].includes(w),
    );

  const rawResource1 = words[0] || "item";
  const pluralResource1 = toPluralResource(rawResource1);
  const basePath1 = `/${toKebabCase(pluralResource1)}`;
  const singularName1 =
    rawResource1.charAt(0).toUpperCase() + rawResource1.slice(1);
  const formattedPlural1 =
    pluralResource1.charAt(0).toUpperCase() + pluralResource1.slice(1);

  const rawResource2 = words[1];
  const entities = [formattedPlural1];
  if (rawResource2 && rawResource2 !== rawResource1) {
    const pluralResource2 = toPluralResource(rawResource2);
    entities.push(
      pluralResource2.charAt(0).toUpperCase() + pluralResource2.slice(1),
    );
  } else {
    entities.push("AuditLogs");
  }

  const apiTitle = toProfessionalApiName(prompt, entities);

  return {
    summary: `Standard RESTful operational API for managing ${basePath1.slice(1)} with full CRUD lifecycle and audit history.`,
    entities,
    detailedPrompt: `# ${apiTitle} Specification

## 1. Architectural Scope
Robust REST API tailored for managing ${basePath1.slice(1)} domain resources based on requirement: "${prompt.slice(0, 100)}". Provides complete CRUD lifecycle endpoints, search, and relational tracking.

## 2. Core Domain Entities
- **${formattedPlural1}**: Primary resource model containing UUID identity, descriptive naming, status slugs, and lifecycle metadata.
- **${entities[1] ?? "AuditLogs"}**: Activity tracking and operational history for ${basePath1.slice(1)} modifications.

## 3. Recommended Endpoint Blueprint
- **${formattedPlural1} Resource (\`${basePath1}\`)**:
  - \`GET /\`: List all ${basePath1.slice(1)} with pagination.
  - \`GET /:id\`: Retrieve individual ${singularName1.toLowerCase()} details.
  - \`POST /\`: Create a new ${singularName1.toLowerCase()} record.
  - \`DELETE /:id\`: Remove ${singularName1.toLowerCase()} by unique identifier.

## 4. Realistic Data Bindings
- **Faker Providers**: \`string.uuid\`, \`lorem.words\`, \`lorem.sentence\`, \`date.recent\`.
- **SLA Bounds**: Latency 20ms - 180ms, 0% error rate default.`,
  };
}
