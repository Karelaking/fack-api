# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: frontend and full-stack developers whose real backend is missing,
unstable, rate-limited, or still under active development, and who need a
realistic, controllable API contract to keep building against.

Secondary: QA engineers who need predictable success and failure scenarios, and
small teams or individuals who run the platform themselves (local machine,
homelab, CI, or air-gapped environments).

## Product Purpose

Fack API's is a self-hostable, node-based mock API platform. A developer
defines projects, endpoints, and routes; builds deeply nested JSON response
schemas on a visual canvas; maps fields to realistic mock-data providers;
simulates latency, failures, and custom headers; and serves those routes as a
live mock backend.

It exists so frontend and mobile teams can build and test independently of a
backend that is not ready. Success means a developer can stand up a realistic,
typed mock API and keep shipping without waiting for the real service.

## Positioning

The mechanism a neighboring product could not truthfully copy: user
configuration is expressed spatially on a node canvas and synthesized into
standard JSON Schema (carrying `x-faker` extensions), which a deterministic
runtime consumes to match dynamic paths and generate payloads. The platform is
local-first and self-hostable with no database server to run, and AI is a
proposer only — the model proposes a specification, deterministic application
code validates and executes it, and no model-generated code ever runs in the
request path.

## Operating Context

- Self-hosted: local development, Docker / Docker Compose, homelab, or CI.
  One Next.js container with SQLite; Postgres is optional for high-volume
  request logging; Nginx is the documented reverse proxy.
- Dashboard work happens in the browser at `/dashboard`: projects, a
  per-project node canvas, schema editor, request console, logs, scenarios,
  and settings.
- Mock traffic is served over project namespaces: `/:projectSlug/...` base-path
  routing or `<slug>.<domain>` subdomain routing.
- Used during decoupled frontend/backend development, including regulated or
  air-gapped environments where a hosted mock service is not acceptable.
- The product must remain fully usable with no AI provider configured.

## Capabilities and Constraints

- Hierarchy is **Project → Endpoint → Route**; routes support GET, POST, PUT,
  DELETE, PATCH.
- Nested response-schema builder supporting objects, arrays, primitives, and
  nullable fields, plus per-field mock-data providers backed by Faker.js
  (mapped through the `x-faker` JSON Schema keyword).
- Chaos simulation per route: latency min/max, error rate, custom headers, and
  conditional rules; project-level scenarios apply a latency multiplier and a
  forced error rate.
- Dynamic route matching via `path-to-regexp` behind a catch-all `[...slug]`
  handler; matched path parameters are injected into generated payloads.
- Bounded LRU cache with TTL and per-project / per-route invalidation.
- Stateful mock workflows (`mock_states`) and outbound webhooks.
- Export and codegen: TypeScript types (`json-schema-to-typescript`), OpenAPI
  generation, and code scaffolding (Express, TypeScript).
- **AI Architect**: natural-language prompt → structured API proposal →
  deterministic validation → reviewable change set → selective apply.
  Provider-agnostic (`ai` SDK with Google and OpenAI adapters); credentials
  stay server-side; project access stays isolated per user.
- Auth: Clerk for the dashboard, project-level role-based access control, and
  HMAC-signed simulated mock Bearer tokens for routes marked auth-required.
- Persistence: SQLite via libSQL/Drizzle by default; Postgres optional for logs.
- Terminology: "project", "endpoint", "route", "canvas", "schema", "provider"
  (mock-data provider — not an AI vendor), "scenario", "chaos".
- Undecided: commercial model and tiers (none was confirmed); any production
  backend generation beyond scaffolding.
- Landing-page copy contains several claims that the shipped architecture does
  not support (for example "zero server storage", "client-side local SQLite &
  IndexedDB persistence", and API keys kept in browser storage). These must be
  reconciled before being reused; do not treat them as product truth.

## Brand Commitments

- Name: **Fack API's** (also written "Fack API"); repository and package name
  `fack-api`; canonical repo `github.com/Karelaking/fack-api`.
- License: MIT; advertised as 100% free and open source, free for commercial
  and open-source use, with no vendor lock-in.
- Existing identity assets: `public/logo-v2.png`, `public/logo.png`,
  `public/logo.svg`, `public/social-preview.png`, and product screenshots under
  `public/screenshots/`.
- Voice: confident, developer-facing, and premium (README describes the product
  as "a premium, self-hostable, node-based mock API platform"). The interface is
  built for dark mode with Tailwind design tokens from `app/globals.css`.

## Evidence on Hand

- `PRD.md` — implementation brief for the Agentic AI API Architect feature,
  including target users, goals, UX states, and acceptance criteria.
- `project.md` — architectural blueprint (control plane vs data plane, React
  Flow canvas, Zustand/Immer state, JSON Schema Faker, path-to-regexp, Docker
  and SQLite strategy).
- `README.md` — feature list, architecture diagram, stack table, setup and
  deployment instructions, and API usage examples.
- `CHANGELOG.md` — semantic-release history through v1.12.0.
- `CONTRIBUTING.md` — local setup and coding/verification conventions.
- Screenshots: `public/screenshots/dashboard.png`, `canvas.png`, `settings.png`.
- Absences future work must not fabricate: no real customer testimonials, case
  studies, logos of real customers, usage benchmarks, or paid pricing exist.

## Product Principles

1. **The specification is the source of truth.** AI proposes; deterministic
   application logic validates and executes. Model-generated code is never
   executed in the request path.
2. **Local-first and self-hostable by default.** The product works with zero
   external services and must never require a paid or hosted service; AI is
   optional, not a precondition.
3. **Visual-first.** API structure is expressed spatially and deep nesting is
   built without hand-writing JSON Schema.
4. **Fidelity over convenience.** Simulation reproduces real backend behavior —
   latency, failures, headers, dynamic path parameters, and stateful flows —
   not just static JSON.
5. **One canonical model.** Editor, runtime, AI, and export all share the same
   Project/Endpoint/Route and JSON Schema model; never introduce a parallel
   competing representation.

## Accessibility & Inclusion

The implementation brief (`PRD.md`, section 12) requires keyboard-accessible
controls, labels for all form controls, visible focus states, validation and
method state that is not conveyed through color alone, confirmation for
destructive actions, and preserving the user's prompt or draft across
recoverable provider errors.
