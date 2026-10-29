import { ProjectGrid } from "@/components/dashboard/ProjectGrid";

/**
 * Temporary visual harness for the workspace browser. Lives under `/projects`
 * so the proxy passes it through instead of treating it as a mock namespace,
 * and renders outside the authenticated project layout.
 */
export const metadata = {
  robots: { index: false, follow: false },
};

const now = Date.now();

function mockProject(index: number) {
  const endpoints = Array.from(
    { length: (index % 3) + (index === 0 ? 4 : 0) },
    (_, endpointIndex) => ({
      id: `endpoint-${index}-${endpointIndex}`,
      projectId: `project-${index}`,
      name: `Endpoint ${endpointIndex + 1}`,
      description: "",
      basePath: `/resource-${endpointIndex}`,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 30),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
      routes: Array.from({ length: (endpointIndex % 3) + 1 }, (_, routeIndex) => ({
        id: `route-${index}-${endpointIndex}-${routeIndex}`,
        endpointId: `endpoint-${index}-${endpointIndex}`,
        method: (["GET", "POST", "PUT", "PATCH", "DELETE"] as const)[
          (endpointIndex + routeIndex + index) % 5
        ],
        path: `/items/${routeIndex}`,
        statusCode: 200,
        responseSchema: "{}",
        responseTemplate: null,
        latencyMin: 0,
        latencyMax: 0,
        errorRate: 0,
        customHeaders: "{}",
        conditionalRules: "[]",
        isAuthRequired: false,
        isEnabled: true,
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 30),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
      })),
    }),
  );

  return {
    id: `project-${index}`,
    userId: "user_preview",
    name:
      index === 2
        ? "Customer Billing and Subscription Lifecycle Mock Service"
        : [
            "Acme Payments",
            "Identity Service",
            "Customer Billing",
            "Notification Hub",
            "Inventory API",
            "Analytics Gateway",
          ][index] ?? `Workspace ${index + 1}`,
    slug:
      index === 2
        ? "customer-billing-and-subscription-lifecycle-mock-service-for-enterprise-partners"
        : [
            "acme-payments",
            "identity-service",
            "customer-billing",
            "notification-hub",
            "inventory-api",
            "analytics-gateway",
          ][index] ?? `workspace-${index + 1}`,
    description:
      index === 2
        ? "A very long description used to confirm that card copy wraps and clamps cleanly at narrow widths without pushing the metadata row out of the card or creating a horizontal scrollbar on any viewport."
        : [
            "Stripe-compatible checkout, refunds, and webhook payloads for local development.",
            "OIDC discovery, token exchange, and user profile endpoints backed by seeded fixtures.",
            "",
            "Email, SMS, and push delivery simulations with retry and failure scenarios.",
            "Warehouse stock, reservations, and fulfilment routes with stateful mock data.",
            "Event ingestion endpoints with configurable latency and error rates.",
          ][index] ?? "Preview workspace.",
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 60),
    updatedAt: new Date(now - 1000 * 60 * 60 * (index * 5 + 1)),
    isLoggingEnabled: true,
    isCachingEnabled: true,
    version: 1,
    activeScenarioId: null,
    endpoints,
  };
}

export default function PreviewPage() {
  return (
    <main>
      <ProjectGrid
        initialProjects={
          Array.from({ length: 6 }, (_, index) => mockProject(index)) as never
        }
      />
    </main>
  );
}
