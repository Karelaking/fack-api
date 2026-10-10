import { describe, it, expect } from "vite-plus/test";
import { parseOpenApiDocument } from "../lib/services/import.service";

describe("OpenAPI Import Service", () => {
  it("should successfully parse a basic OpenAPI document", () => {
    const doc = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: {
        "/users": {
          get: {
            summary: "List users",
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            summary: "Create user",
          },
        },
        "/users/{id}": {
          get: {
            summary: "Get user by ID",
          },
        },
      },
    };

    const result = parseOpenApiDocument(doc);
    expect(result.name).toBeTruthy();
    expect(result.endpoints.length).toBe(1); // Groups under /users
    expect(result.endpoints[0].basePath).toBe("/users");
    expect(result.endpoints[0].routes.length).toBe(3); // GET /users, POST /users, GET /users/{id}

    const getUsersRoute = result.endpoints[0].routes.find(
      (r) => r.method === "GET" && r.path === "/",
    );
    expect(getUsersRoute).toBeTruthy();
    expect(getUsersRoute?.properties.length).toBe(1); // The top level 'items' array
    expect(getUsersRoute?.properties[0].type).toBe("array");
    expect(getUsersRoute?.properties[0].arrayItemType).toBe("object");
    expect(getUsersRoute?.properties[0].arrayItemChildren?.length).toBe(2);
  });
});
