import { describe, it, expect } from "vite-plus/test";
import {
  expandUserPrompt,
  generateApiSpecification,
} from "../lib/ai/ai-architect.service";
import {
  synthesizeDetailedPrompt,
  synthesizeFallbackApi,
  toPluralResource,
  toKebabCase,
  toProfessionalApiName,
  toProfessionalEndpointName,
} from "../lib/ai/ai-fallback-synthesizer.constant";
import type { GenerationProgressStep } from "../lib/types/ai.type";
import { POST as generateHandler } from "../app/api/ai/generate/route";
import { NextRequest } from "next/server";

describe("AI API Architect — Multi-Stage Pipeline", () => {
  describe("Stage 2: Prompt Detailing & Expansion", () => {
    it("should reject empty prompts with an error", async () => {
      await expect(expandUserPrompt("")).rejects.toThrow(
        "Prompt cannot be empty",
      );
      await expect(expandUserPrompt("   ")).rejects.toThrow(
        "Prompt cannot be empty",
      );
    });

    it("should synthesize detailed specification for e-commerce domain", async () => {
      const result = await expandUserPrompt(
        "Create a store with products and shopping cart",
      );
      expect(result.summary).toContain("shopping");
      expect(result.entities).toContain("Products");
      expect(result.entities).toContain("Cart");
      expect(result.detailedPrompt).toContain(
        "# E-Commerce Storefront API Specification",
      );
      expect(result.detailedPrompt).toContain("/products");
      expect(result.detailedPrompt).toContain("/cart");
    });

    it("should synthesize detailed specification for social media domain", async () => {
      const result = await expandUserPrompt(
        "Build a social feed with posts and followers",
      );
      expect(result.summary).toContain("Social media");
      expect(result.entities).toContain("Users");
      expect(result.entities).toContain("Posts");
      expect(result.detailedPrompt).toContain(
        "# Social Networking API Specification",
      );
      expect(result.detailedPrompt).toContain("/users");
      expect(result.detailedPrompt).toContain("/posts");
    });

    it("should synthesize detailed specification for food delivery domain", async () => {
      const result = await expandUserPrompt(
        "Uber eats clone with restaurants and delivery orders",
      );
      expect(result.summary).toContain("food delivery");
      expect(result.entities).toContain("Restaurants");
      expect(result.entities).toContain("Orders");
      expect(result.detailedPrompt).toContain(
        "# Food Delivery & Logistics API Specification",
      );
      expect(result.detailedPrompt).toContain("/restaurants");
      expect(result.detailedPrompt).toContain("/orders");
    });

    it("should dynamically extract domain entities for custom concepts", () => {
      const result = synthesizeDetailedPrompt(
        "manage hospital medical appointments",
      );
      expect(result.entities).toContain("Hospitals");
      expect(result.detailedPrompt).toContain(
        "Healthcare & Clinical Practice Platform API Specification",
      );
      expect(result.detailedPrompt).toContain("/hospitals");
    });
  });

  describe("Full Pipeline Execution (Intake -> Detailing -> Endpoints)", () => {
    it("should emit expanding_prompt progress step and return detailedPrompt", async () => {
      const emittedSteps: GenerationProgressStep[] = [];

      const result = await generateApiSpecification({
        prompt: "Build an online bookstore with books and author profiles",
        onProgress: (step) => {
          emittedSteps.push(step);
        },
      });

      expect(result.success).toBe(true);
      expect(result.detailedPrompt).toBeDefined();
      expect(result.detailedPrompt).toContain("API Specification");
      expect(result.detailedSummary).toBeDefined();

      // Verify progress step sequence
      const stepIds = emittedSteps.map((s) => s.id);
      expect(stepIds).toContain("understanding");
      expect(stepIds).toContain("inspecting");
      expect(stepIds).toContain("expanding_prompt");
      expect(stepIds).toContain("designing");
      expect(stepIds).toContain("validating");
      expect(stepIds).toContain("checking_conflicts");
      expect(stepIds).toContain("complete");

      // Verify generated endpoints exist and are valid
      expect(result.generation).toBeDefined();
      expect(result.generation!.endpoints.length).toBeGreaterThan(0);
      for (const ep of result.generation!.endpoints) {
        expect(ep.routes.length).toBeGreaterThan(0);
        for (const route of ep.routes) {
          expect(route.path.startsWith("/")).toBe(true);
        }
      }
    });

    it("should return detailedPrompt in POST /api/ai/generate response", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt:
            "Design a restaurant reservation system with tables and bookings",
        }),
      });

      const res = await generateHandler(req);
      expect(res.status).toBe(200);

      const json = (await res.json()) as {
        success: boolean;
        detailedPrompt?: string;
        detailedSummary?: string;
        generation?: { endpoints: Array<{ name: string }> };
      };

      expect(json.success).toBe(true);
      expect(json.detailedPrompt).toBeDefined();
      expect(typeof json.detailedPrompt).toBe("string");
      expect(json.detailedSummary).toBeDefined();
      expect(json.generation?.endpoints.length).toBeGreaterThan(0);
    });
  });

  describe("Professional REST Naming Conventions", () => {
    it("should correctly pluralize English nouns and irregulars", () => {
      expect(toPluralResource("category")).toBe("Categories");
      expect(toPluralResource("library")).toBe("Libraries");
      expect(toPluralResource("company")).toBe("Companies");
      expect(toPluralResource("delivery")).toBe("Deliveries");
      expect(toPluralResource("person")).toBe("People");
      expect(toPluralResource("child")).toBe("Children");
      expect(toPluralResource("box")).toBe("Boxes");
      expect(toPluralResource("wish")).toBe("Wishes");
      expect(toPluralResource("batch")).toBe("Batches");
      expect(toPluralResource("user")).toBe("Users");
      expect(toPluralResource("products")).toBe("Products");
    });

    it("should correctly convert PascalCase and multi-word names to kebab-case", () => {
      expect(toKebabCase("OrderItems")).toBe("order-items");
      expect(toKebabCase("PaymentMethods")).toBe("payment-methods");
      expect(toKebabCase("ShippingAddresses")).toBe("shipping-addresses");
      expect(toKebabCase("Users")).toBe("users");
    });

    it("should enforce idiomatic camelCase property names and standard id primary keys in templates", () => {
      const ecom = synthesizeFallbackApi("online clothing store");
      for (const endpoint of ecom.endpoints) {
        // URIs must be lowercase kebab-case
        expect(endpoint.basePath).toBe(endpoint.basePath.toLowerCase());
        expect(endpoint.basePath.startsWith("/")).toBe(true);

        for (const route of endpoint.routes) {
          for (const prop of route.properties) {
            // camelCase naming check (no snake_case or PascalCase properties)
            expect(/^[a-z][a-zA-Z0-9]*$/.test(prop.name)).toBe(true);
            // No redundant entityId on primary keys (e.g. not orderId inside /orders)
            expect(prop.name).not.toBe("orderId");
            expect(prop.name).not.toBe("cartId");
            expect(prop.name).not.toBe("itemId");
          }
        }
      }
    });

    it("should synthesize professional enterprise platform names", () => {
      expect(toProfessionalApiName("online ecommerce store")).toBe(
        "Storefront & Commerce Operations Platform API",
      );
      expect(toProfessionalApiName("food delivery app")).toBe(
        "On-Demand Delivery & Logistics Platform API",
      );
      expect(toProfessionalApiName("social network feed")).toBe(
        "Social Networking & Community Platform API",
      );
      expect(toProfessionalApiName("hospital patient records")).toBe(
        "Healthcare & Clinical Practice Platform API",
      );
      expect(toProfessionalApiName("hotel booking reservations")).toBe(
        "Hospitality & Reservation Management API",
      );
      expect(toProfessionalApiName("banking invoice payments")).toBe(
        "Financial Services & Payment Gateway API",
      );
      expect(toProfessionalApiName("school student courses")).toBe(
        "Academic Curriculum & Student Records API",
      );
      expect(
        toProfessionalApiName("manage gym workouts", ["Workouts", "Trainers"]),
      ).toBe("Workouts & Trainers Operations Platform API");
    });

    it("should format endpoint names into professional domain titles", () => {
      expect(toProfessionalEndpointName("products")).toBe("Product Catalog");
      expect(toProfessionalEndpointName("cart")).toBe("Shopping Carts");
      expect(toProfessionalEndpointName("orders")).toBe("Order Fulfillment");
      expect(toProfessionalEndpointName("users")).toBe(
        "User Identity & Profiles",
      );
      expect(toProfessionalEndpointName("hospitals")).toBe(
        "Hospital Directory & Facilities",
      );
      expect(toProfessionalEndpointName("books")).toBe(
        "Book Catalog & Editions",
      );
      expect(toProfessionalEndpointName("authors")).toBe(
        "Author Profiles & Bibliography",
      );
      expect(toProfessionalEndpointName("courses")).toBe(
        "Course Curriculum & Modules",
      );
      expect(toProfessionalEndpointName("students")).toBe(
        "Student Records & Enrollment",
      );
      expect(toProfessionalEndpointName("custom_widgets")).toBe(
        "Custom Widgets Management",
      );
    });
  });
});
