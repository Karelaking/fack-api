# Fack API — Agentic AI API Architect

## Product Requirements Document (PRD) and Implementation Brief for Google Antigravity

**Document status:** Implementation-ready proposal  
**Product:** Fack API  
**Repository:** https://github.com/Karelaking/fack-api  
**Primary implementation environment:** Google Antigravity  
**Document date:** 9 October 2026  
**Initial release target:** MVP / Phase 1  
**Product category:** Open-source, self-hostable AI-assisted mock API design and simulation platform

---

## 1. Instructions for Antigravity

Use this document as the product and engineering specification for implementing the feature in the existing Fack API repository.

### Mandatory operating rules

1. **Inspect before changing.** Read the repository README, package manifest, source tree, database schema, current route configuration model, dynamic route runtime, schema editor, React Flow canvas, Zustand stores, tests, and existing project conventions before proposing code changes.
2. **Preserve existing functionality.** Fack API already provides a visual node-based mock API workflow, nested JSON schema configuration, Faker-powered response generation, dynamic route matching, chaos testing, caching, TypeScript type export, and SQLite/Drizzle persistence. Extend these capabilities; do not replace them with a parallel implementation.
3. **Create an implementation plan before coding.** Map each requirement in this PRD to the actual files/modules that should change. Identify the existing abstractions to reuse, the data-model migrations needed, and any assumptions that require confirmation.
4. **Implement incrementally.** Start with the Phase 1 vertical slice in Section 14. Complete and test each increment before proceeding.
5. **Use the repository's actual stack and versions.** The README describes Next.js 16, React 19, TypeScript, Tailwind CSS 4, React Flow (`@xyflow/react`), Zustand/Immer, Drizzle ORM, SQLite/libSQL, `json-schema-faker`, Faker.js, `path-to-regexp`, `json-schema-to-typescript`, and Vitest. Verify current package versions and actual code before relying on these details.
6. **Do not invent APIs or framework patterns.** Follow the current codebase's established patterns. Prefer small, typed modules and reuse existing route, schema, project, cache, and persistence services.
7. **No unvalidated AI output may become executable behavior.** The model proposes declarative API definitions. The application validates and persists them. Never execute arbitrary model-generated JavaScript or eval model-generated code as part of route handling.
8. **Keep model-provider integration replaceable.** Define a small provider abstraction; do not bind core domain logic to a single vendor or SDK.
9. **Do not expose secrets.** API keys must be handled server-side, excluded from logs and client bundles, and never persisted in plaintext unless the existing architecture has an explicitly reviewed secure secret-storage mechanism.
10. **Do not claim tests passed without running them.** Run the relevant test, lint, type-check, and build commands available in the repository and report actual outcomes.
11. **Do not silently delete or rewrite existing user work.** Inspect the git status first if tools allow it, preserve unrelated changes, and avoid destructive migrations.
12. **If a requirement conflicts with the existing architecture,** explain the conflict and propose the smallest compatible design before implementing a breaking change.

### Required Antigravity workflow

- Step A: Repository reconnaissance and architecture summary.
- Step B: Requirement-to-code mapping and phased implementation plan.
- Step C: Identify data-model changes and backward-compatibility risks.
- Step D: Implement the MVP in small, reviewable increments.
- Step E: Add automated tests and run quality gates.
- Step F: Summarize files changed, migrations, configuration required, tests run, known limitations, and suggested next steps.

Do not start by generating the entire system in one large code change.

---

## 2. Executive summary

Fack API is an open-source, self-hostable mock API platform that lets developers configure and simulate API endpoints through a visual interface. The product currently emphasizes manually configured routes, visual route topology, nested response schemas, generated mock data, and developer workflow decoupling.

This PRD introduces an **Agentic AI API Architect**. A user describes an application's purpose and behavior in natural language. The system analyzes the request, proposes a coherent API surface, infers route methods and paths, creates request/response schemas and field constraints, identifies relationships and ambiguities, validates the proposal, and lets the user review and apply the changes.

The core product principle is:

> **The API specification is the source of truth. AI proposes and edits it; deterministic application logic validates and executes it.**

The MVP must produce useful, editable, validated mock API definitions using Fack API's existing runtime. Production backend code generation is explicitly out of scope for the MVP.

### Product vision

Make API design as approachable as describing an application's requirements, while retaining the precision, transparency, control, and reproducibility expected by developers.

### Value proposition

- Reduce the time required to define a realistic API surface manually.
- Help developers discover routes and fields they may have missed.
- Preserve full human control over generated routes and schemas.
- Keep generated definitions compatible with the existing mock API runtime.
- Enable future outputs such as OpenAPI, test suites, TypeScript types, and backend scaffolds from one canonical specification.

---

## 3. Problem statement

Developers building a frontend often need a realistic backend contract before the production backend is ready. Manually creating every route, HTTP method, parameter, request field, response field, validation rule, and mock-data provider is repetitive and error-prone.

A naive prompt-to-code feature is not sufficient because it may:

- Generate duplicate or conflicting endpoints.
- Infer incorrect fields or omit required workflow routes.
- Ignore the existing project configuration.
- Return inconsistent schemas across related routes.
- Accidentally expose sensitive fields.
- Overwrite existing routes during regeneration.
- Produce output that looks plausible but is invalid for the current runtime.
- Treat business operations as generic CRUD operations.
- Make changes that are hard to inspect, reverse, or test.

Fack API should solve these problems with structured planning, deterministic validation, a review-and-apply workflow, and integration with the current route and schema architecture.

---

## 4. Goals and non-goals

### 4.1 MVP goals

1. Accept a natural-language description of an application or a requested API change.
2. Analyze existing project definitions before generating or modifying routes.
3. Infer relevant resources, routes, HTTP methods, parameters, request bodies, response schemas, and basic access assumptions.
4. Generate valid, typed, declarative route definitions compatible with the existing Fack API model or an explicitly mapped extension.
5. Validate schema structure and route conflicts before applying a proposal.
6. Show a reviewable proposal with additions, changes, assumptions, warnings, and unresolved questions.
7. Allow the user to edit, approve, reject, or selectively apply proposed changes.
8. Persist approved definitions through the existing Drizzle/SQLite data layer.
9. Run approved mock routes through the existing runtime without arbitrary code execution.
10. Provide clear loading, failure, retry, empty, and success states.
11. Add automated tests for the planning/validation pipeline and route application behavior.
12. Keep AI-provider credentials server-side and make the provider integration replaceable.

### 4.2 Non-goals for the MVP

- Generating a complete production backend with business logic.
- Executing arbitrary generated JavaScript, shell commands, SQL, or code.
- Automatically deploying generated production services.
- Fully autonomous changes without user approval.
- Multi-agent distributed infrastructure or a separate microservice fleet.
- Automatic creation of production database migrations from natural language.
- Guaranteed discovery of every requirement from an ambiguous prompt.
- Replacing the existing visual canvas or schema editor.
- Building a general-purpose AI coding agent inside Fack API.
- Requiring a paid AI service for all existing Fack API functionality.

### 4.3 Future scope

- Incremental conversational editing and change-impact analysis.
- Stateful mock workflows and scenario simulation.
- Automated positive, negative, boundary, and authorization test generation.
- OpenAPI import/export and Postman collection import.
- SDK and client-type generation.
- Version comparison and breaking-change detection.
- Optional backend scaffolding for Express, Fastify, or NestJS.
- Frontend-repository analysis and endpoint-usage suggestions.
- Team collaboration, comments, and approval workflows.
- Additional AI provider adapters and model selection.
- Safe MCP tools for inspecting specs, proposing changes, and running tests.

---

## 5. Target users and primary use cases

### Primary users

- Frontend developers who need mock endpoints before a backend exists.
- Full-stack developers who want to draft an API from product requirements.
- Hackathon teams that need a working API surface quickly.
- Students learning REST API design.
- QA engineers who need predictable mock responses and failure scenarios.
- Small teams that want a self-hostable API design and mocking workflow.

### Primary user stories

**US-01 — Generate a first API**
As a developer, I want to describe my application in natural language so that Fack API proposes the routes and fields I need.

**US-02 — Generate only part of an API**
As a developer, I want to describe a specific feature, such as product search or order tracking, so that the system adds only relevant routes instead of regenerating the entire project.

**US-03 — Inspect the reasoning**
As a developer, I want to see why a route or field was suggested, including assumptions and confidence, so that I can review decisions before applying them.

**US-04 — Avoid route duplication**
As a developer, I want the system to compare its proposal with existing definitions so that it does not silently create duplicate method/path combinations.

**US-05 — Edit before applying**
As a developer, I want to accept or reject individual proposed routes and fields so that I retain control over the API contract.

**US-06 — Use the existing runtime**
As a developer, I want accepted routes to work with Fack API's current mock runtime so that I can test my frontend immediately.

**US-07 — Recover from errors**
As a developer, I want understandable validation and provider errors, plus a safe retry option, so that a failed generation does not corrupt my project.

**US-08 — Keep existing routes**
As a developer, I want existing manual routes to remain unchanged unless I explicitly approve a modification or deletion.

---

## 6. User experience and workflows

### 6.1 Entry points

Add an AI generation entry point to the existing project/workspace experience. Reuse current navigation and design-system components.

Recommended entry points:

- “Generate API with AI” action from a project.
- “Add routes with AI” action from the existing route canvas.
- “Generate fields” action from a selected route's schema editor, if this can be added without disrupting current workflows.

The precise placement must be decided after repository reconnaissance.

### 6.2 Initial generation flow

1. User opens a project and selects “Generate API with AI.”
2. User enters a description of the application, feature, or workflow.
3. Optional configuration lets the user provide conventions such as API prefix, naming style, version, pagination format, authentication assumptions, or desired resource names.
4. The server loads the current project and relevant route definitions.
5. The planning service generates a structured proposal.
6. Deterministic validators check the proposal.
7. The user sees proposed routes grouped by resource or tag, plus warnings and assumptions.
8. The user can inspect a route, review its request and response schemas, edit fields, and select which changes to apply.
9. The user approves the selected changes.
10. The application revalidates the proposal against the latest project state.
11. Approved changes are persisted atomically where the current persistence model permits it.
12. The user can open the canvas or request console and test the new routes.

### 6.3 Incremental route flow

When the user asks to add or modify a feature:

1. Load existing definitions.
2. Generate a change proposal, not a replacement project.
3. Match proposed routes against existing routes by stable identity and normalized method/path.
4. Classify changes as add, modify, unchanged, conflict, or remove.
5. Do not propose deletions unless the user explicitly asks for removal or the UI clearly marks them as optional recommendations.
6. Show a diff.
7. Apply only selected and approved changes.

### 6.4 UX states

The UI must support:

- Idle / empty prompt.
- Submitting.
- Planning / generating.
- Validating.
- Proposal ready.
- Validation warnings.
- Clarification required.
- Provider configuration missing.
- Provider timeout / rate limit / network failure.
- Invalid structured model output.
- Stale proposal because project state changed.
- Applying changes.
- Apply success.
- Apply failure with rollback or no partial writes.
- Retry without losing the user's prompt.
- Cancel generation when feasible.
- No existing routes.
- Existing routes found and protected.

### 6.5 Clarifying questions

The AI must not ask questions for every optional detail. It should make safe, clearly labeled assumptions for low-risk choices and ask for clarification when ambiguity materially changes behavior or security.

Examples of high-impact ambiguity:

- Are endpoints public or authenticated?
- Which role can modify a resource?
- Can a user access only their own records or all records?
- Is a destructive operation allowed?
- Is a field supplied by the client or generated by the server?
- Does cancellation remain possible after payment or dispatch?

Questions and answers should be part of the generation task state so the user does not have to restart.

---

## 7. Functional requirements

Priority definitions: **P0 = required for MVP**, **P1 = next release**, **P2 = later**.

### FR-01 — Natural-language input (P0)

- Accept a meaningful text description of an application or feature.
- Enforce a configurable maximum prompt size.
- Reject blank prompts with a clear inline validation message.
- Preserve the original prompt in the generation record where appropriate.
- Never treat text in a prompt as permission to bypass system security controls.

### FR-02 — Project context inspection (P0)

- Load the target project and its current route/schema definitions.
- Load relevant project conventions if they exist.
- Pass only the necessary context to the model.
- Apply project isolation to all reads and writes.
- If context is too large, use bounded summaries and relevant-route selection rather than sending the entire project indiscriminately.

### FR-03 — Resource and route planning (P0)

Infer and propose, where relevant:

- Resource/entity names.
- REST paths and HTTP methods.
- Operation summaries and tags.
- Path parameters.
- Query parameters such as pagination, sorting, filtering, and search.
- Request-body schemas.
- Response schemas and common error responses.
- Basic dependency and relationship metadata.
- Likely workflow/action routes where generic CRUD is insufficient.
- Assumptions and unresolved questions.

The system must not blindly generate full CRUD for every inferred resource. Route choices must reflect the described business actions.

### FR-04 — Field and schema generation (P0)

Support the schema types supported by the current implementation, with a clear mapping from generated JSON Schema to the application's existing schema model:

- String.
- Number.
- Integer.
- Boolean.
- Object.
- Array.
- Nullability, represented according to the JSON Schema version in use.
- Required and optional properties.
- Nested objects and arrays.
- Enums and supported string formats.
- Numeric and string constraints.
- Defaults where appropriate.
- Read-only and write-only annotations when supported.
- Reusable schema references where feasible.

Generate separate request and response schemas when their fields differ. Avoid requiring clients to supply server-generated IDs, timestamps, computed totals, or internal fields.

### FR-05 — Structured AI output (P0)

- Use the chosen provider's structured-output or tool/function-call support where available.
- Validate every response with a local runtime schema.
- Reject malformed, truncated, overlarge, or unsupported output.
- Use bounded repair attempts with concise validation feedback.
- Never use a model response directly as a database query or executable program.
- Record sanitized failure information without logging secrets or full sensitive payloads.

### FR-06 — Deterministic validation (P0)

Validate at least:

- Required manifest properties.
- Allowed HTTP methods.
- Path syntax.
- Duplicate normalized method/path combinations.
- Invalid or duplicate parameter names.
- Schema syntax and supported JSON Schema version.
- Unsupported schema features.
- Invalid internal references.
- Inconsistent request/response schema definitions.
- Conflicts with existing routes.
- Invalid tags or operation identifiers where required.
- Maximum route count, schema depth, and schema size.
- Basic dangerous or sensitive response-field warnings.

Validation must be implemented in normal application code, not delegated solely to an LLM.

### FR-07 — Reviewable proposal (P0)

For every proposed route, display:

- HTTP method and path.
- Summary and resource/tag.
- Request parameters and request body.
- Response schemas and common errors.
- Authentication/authorization assumptions.
- Generated fields and their constraints.
- Warnings, unresolved questions, and assumptions.
- Change classification: add, modify, unchanged, conflict.
- Select/accept/reject controls.

Allow the user to review an individual route without accepting the entire proposal.

### FR-08 — Apply and persist (P0)

- Require explicit user approval before applying a generated proposal.
- Revalidate immediately before writing.
- Check that the project state has not changed since proposal generation.
- Use a transaction when supported by the persistence architecture.
- Preserve unrelated and unselected existing routes.
- If an operation fails, avoid leaving a partially applied set of changes.
- Return clear success or failure feedback.
- Keep generated routes compatible with the existing runtime's expected data structures.

### FR-09 — Mock runtime integration (P0)

- Accepted routes must resolve through the existing route matcher.
- Reuse the current JSON Schema/Faker-based response generation system where compatible.
- Respect current project namespaces, caching, and chaos-testing behavior.
- Ensure cache invalidation after route changes.
- Do not allow unvalidated route definitions to reach the runtime.
- If a proposed schema cannot be represented by the current runtime, show a clear compatibility error instead of silently degrading it.

### FR-10 — AI provider configuration (P0)

- Define a provider-agnostic interface for text generation and structured results.
- Keep credentials on the server.
- Allow a supported provider/model to be configured through server-side environment variables or the existing settings pattern.
- Do not require AI configuration for normal, non-AI Fack API functionality.
- Show a clear error when no provider is configured.
- Add provider-specific adapters only when their SDKs and API contracts are verified against current documentation.
- Do not log API keys, authorization headers, or secrets.

### FR-11 — Existing visual editor compatibility (P0)

- Newly approved routes should be visible in the existing route list/canvas.
- Existing manual routes must continue to work.
- If the current data model requires canvas node positions, assign sensible defaults or use the existing layout behavior.
- Do not create a separate, competing route model.
- Preserve existing schema editor functionality.

### FR-12 — Observability and usage limits (P0)

Track non-sensitive task metadata:

- Project and generation/task identifiers.
- Status and timestamps.
- Model/provider identifier, if safe.
- Duration and retry count.
- Number of proposed routes.
- Validation outcome.
- Token/usage information if the provider exposes it and it is safe to store.

Apply bounded request size, timeout, retry count, output size, and route/schema limits. Avoid retaining sensitive prompt content longer than the product's existing data policy permits.

### FR-13 — Conversational editing (P1)

- Allow requests such as “Add a search query to products” or “Make phone optional.”
- Compute a minimal change set against the current manifest.
- Show diffs and dependency impact.
- Avoid full-project regeneration.
- Support undo/rollback using persisted versions.

### FR-14 — Test generation (P1)

Generate test cases from the route contract, including:

- Valid requests.
- Missing required fields.
- Invalid field types.
- Boundary values.
- Unknown enum values.
- Unauthorized/forbidden cases when authorization is implemented.
- Not-found cases.
- Relevant workflow constraints.

Tests must run in a controlled environment and must not call external production services by default.

### FR-15 — OpenAPI export (P1)

Generate an OpenAPI 3.x document from the canonical route specification, after validating mappings and references. Preserve descriptions, parameters, request bodies, responses, and security metadata where represented.

### FR-16 — Version diff and breaking-change checks (P1)

Compare versions and identify route removals, method/path changes, required-field changes, type changes, and response contract changes.

### FR-17 — Production backend scaffolding (P2)

Potentially generate framework-specific scaffolding. This is not production-ready by default and must not be described as a secure, deployable backend without build/test/security gates and explicit review.

---

## 8. Canonical API specification

The **canonical API specification** is the central domain model shared by AI generation, the editor, validation, persistence, mock runtime, and export pipelines.

### 8.1 Design requirements

- Use the existing persisted route/schema model where possible.
- If an extension is required, implement a mapping layer instead of forcing every subsystem to adopt a redundant representation.
- Keep the model typed, versioned, validated, and serializable.
- Separate route identity from visual canvas position.
- Separate the AI proposal from the approved persisted specification.
- Track which fields/routes are generated, manually edited, or inherited from existing definitions when useful.
- Store only information required for the product; do not persist private chain-of-thought. Store concise rationales, assumptions, and validation findings instead.

### 8.2 Illustrative route definition

The following is conceptual. Antigravity must adapt it to the actual repository model rather than copying it blindly.

```ts
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RouteProposal = {
  id: string;
  method: HttpMethod;
  path: string;
  operationId: string;
  summary: string;
  tags: string[];

  parameters: {
    path: Record<string, unknown>;
    query: Record<string, unknown>;
    headers: Record<string, unknown>;
  };

  requestBody?: {
    required: boolean;
    schema: Record<string, unknown>;
  };

  responses: Record<
    string,
    {
      description: string;
      schema?: Record<string, unknown>;
    }
  >;

  security: {
    authenticationRequired: boolean | "unknown";
    roles: string[];
    notes?: string[];
  };

  assumptions: string[];
  warnings: string[];
  rationale: string;
};
```

Do not store the entire AI proposal as unvalidated arbitrary JSON and then trust it. Validate both the envelope and all nested definitions. Prefer explicit discriminated unions and versioned schemas for the production implementation.

### 8.3 Proposal envelope

A generation response should conceptually include:

- Schema/version identifier.
- Short summary of the proposed changes.
- Inferred resources.
- Proposed routes.
- Reusable schemas or relationships, if supported.
- Assumptions.
- Clarifying questions.
- Validation warnings.
- Conflicts with existing definitions.
- A bounded rationale for key design decisions.

The model should return structured data, not a block of code that the application must parse.

---

## 9. Agentic planning design

### 9.1 MVP architecture: one orchestrator, logical specialist steps

Do not start with multiple autonomous microservices. Implement a normal TypeScript orchestration service that invokes typed, bounded planning steps. These steps may initially share one provider/model.

Recommended logical roles:

1. **Requirement analyst:** extracts actors, resources, operations, business rules, and ambiguity.
2. **API planner:** proposes resources, routes, methods, and dependencies.
3. **Schema planner:** creates request/response schemas and field constraints.
4. **Consistency reviewer:** identifies duplicate routes, missing dependencies, and mismatched schemas.
5. **Security reviewer:** flags public/private ambiguity, sensitive fields, and risky access assumptions.
6. **QA planner:** proposes contract tests when enabled.

For the MVP, these may be sequential steps with structured inputs/outputs. Split them into separate agents only when it demonstrably improves quality or maintainability.

### 9.2 Orchestrator responsibilities

- Create and persist a generation task.
- Load only the required project context.
- Invoke planning steps with bounded timeouts.
- Validate each structured result.
- Retry only recoverable errors and within a fixed budget.
- Run deterministic validators.
- Produce a reviewable proposal.
- Never apply changes before explicit approval.
- Support cancellation where feasible.
- Record sanitized status and errors.
- Ensure duplicate submission/retry cannot apply the same proposal twice.

### 9.3 Model-independent interface

Use a small internal interface appropriate to the installed SDK, for example:

```ts
interface StructuredGenerationProvider {
  generateStructured<T>(input: {
    systemInstruction: string;
    prompt: string;
    schema: unknown;
    timeoutMs: number;
  }): Promise<{
    value: T;
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
    };
    model?: string;
  }>;
}
```

This is illustrative, not a mandate to adopt a particular SDK. Adapt it to real provider capabilities and repository conventions.

### 9.4 Security boundary

The model is not an authority. It cannot:

- Write directly to the database.
- Execute code.
- Run shell commands.
- Publish routes.
- Override application authorization.
- Read unrelated projects.
- Change server configuration.
- Retrieve environment secrets.

All operations are performed by trusted application services with validated, scoped inputs.

---

## 10. Data persistence and lifecycle

First inspect the existing Drizzle schema and relationships. Prefer extending existing project/route records and adding only the tables needed for reliable proposals and versioning.

Potential concepts (names are illustrative):

- **GenerationTask:** task ID, project ID, status, prompt or approved retention reference, provider/model metadata, timestamps, sanitized error.
- **GenerationProposal:** task ID, base project revision, validated proposal payload, validation report, creation time.
- **SpecificationVersion:** project ID, version/revision, canonical snapshot or normalized changes, author/action metadata, timestamp.
- **Project revision token:** optimistic-concurrency field or equivalent to detect stale proposals.

Avoid adding all of these tables if existing records can safely represent the same concepts. The design must follow the current data model.

### Persistence rules

- Every operation is scoped to the owning project and any existing user/tenant boundary.
- Apply operations must be atomic when feasible.
- A proposal is not an active route until approved.
- Rejected or failed proposals must not mutate active routes.
- Stale proposals must be revalidated and, if necessary, regenerated.
- Migrations must be backward-compatible with existing projects.
- Add migration and rollback guidance consistent with the repository's workflow.
- Avoid storing secrets or unnecessary sensitive prompt content.
- Keep route runtime reads fast; do not require an LLM call to serve a mock request.

---

## 11. API/service contracts for the feature

Use the repository's current server action, route handler, or service conventions. Do not introduce a new public endpoint style without inspecting the existing architecture.

The feature needs the following logical operations:

### Generate proposal

Input:

- Project identifier.
- Natural-language prompt.
- Optional safe generation preferences.
- Optional task/correlation identifier.

Behavior:

- Authenticate and authorize the caller using the existing security model.
- Load project context.
- Generate and validate a proposal.
- Persist the proposal as pending review.
- Return task/proposal identifiers, structured changes, assumptions, and validation results.

### Read proposal/status

Input:

- Project identifier and proposal/task identifier.

Behavior:

- Verify project ownership/access.
- Return status and proposal.
- Do not expose provider secrets or sensitive internal diagnostics.

### Apply selected proposal changes

Input:

- Project identifier.
- Proposal identifier.
- Selected route/change IDs.
- Expected project revision.
- Idempotency key or equivalent if consistent with existing patterns.

Behavior:

- Verify authorization and proposal ownership.
- Revalidate selected changes and conflicts.
- Reject stale revisions with a clear conflict response.
- Apply changes transactionally where supported.
- Invalidate related runtime/cache entries.
- Return applied changes and any failures.

### Reject/cancel proposal

Allow the user to reject a proposal and, where feasible, cancel an in-progress generation. Rejection must not modify active routes.

### Field-generation operation

Optional MVP subflow if the existing schema editor can support it cleanly:

- Input: project, route, current schema, and field-generation prompt.
- Output: a schema patch with assumptions and validation results.
- Apply only after review.
- Do not replace unrelated schema fields.

These are logical contracts, not fixed URL paths. Determine exact routing from the existing codebase.

---

## 12. UI requirements

Reuse the current component library, Tailwind configuration, accessibility conventions, and design language.

### Main generation panel

Components:

- Prompt textarea.
- Optional preferences/collapsible advanced settings.
- Generate button.
- Clear validation and configuration messaging.
- Progress status.
- Retry/cancel actions where feasible.

### Proposal review view

Components:

- Proposal summary.
- Route list grouped by resource/tag.
- Method/path labels.
- Change classification.
- Route selection controls.
- Request schema viewer/editor.
- Response schema viewer/editor.
- Assumptions and warnings.
- Conflict and validation panel.
- Apply selected changes action.
- Reject proposal action.

### Route detail

The user should be able to inspect and edit:

- HTTP method and path.
- Path/query/header parameters.
- Request-body fields.
- Response fields.
- Field type, required status, nullability, constraints, and mock-data configuration supported by the current editor.
- Basic security assumptions.
- Generated versus manually edited content where available.

### Accessibility and usability

- Keyboard-accessible controls.
- Labels for all form controls.
- Clear focus states.
- Do not communicate method or validation state through color alone.
- Confirm destructive actions.
- Do not lose prompt or draft edits on recoverable provider errors.
- Use the existing responsive layout patterns.

---

## 13. Quality attributes and security

### Reliability

- Bounded provider timeouts and retries.
- No infinite repair loops.
- Failed generation must not corrupt project data.
- Repeated apply requests must not duplicate changes.
- Stale project revisions must be detected.

### Performance

- Existing mock requests must not call the AI provider.
- Keep the generation UI responsive during long-running model calls.
- Enforce maximum prompt, route count, schema depth, and output size.
- Use background jobs only if the existing deployment architecture requires them.

### Security

- Server-side provider credentials only.
- Existing authorization checks on all project/proposal operations.
- Strict project isolation.
- Input validation and output validation.
- No arbitrary model-generated code execution.
- Sanitize provider errors before displaying them.
- Avoid logging credentials, authorization headers, or sensitive prompt payloads.
- Treat imported documents and prompt content as untrusted.
- Explicit review for ambiguous or potentially destructive changes.
- Restrict generated route definitions to a safe declarative feature set.

### Maintainability

- Small, single-purpose modules.
- Typed interfaces and runtime validation at trust boundaries.
- Keep provider adapters separate from domain logic.
- Keep UI components separate from generation orchestration.
- Avoid circular dependencies between AI planning and route runtime.
- Add comments for non-obvious security and consistency decisions.

### Portability

- Existing non-AI functionality continues to work when no provider is configured.
- Provider integration is replaceable.
- The canonical spec remains exportable and provider-independent.

---

## 14. Phased implementation plan

### Phase 0 — Repository reconnaissance (mandatory)

Antigravity must:

1. Inspect the repository structure and current branch/status.
2. Identify project/workspace, route, endpoint, schema, cache, and persistence models.
3. Trace the current route creation/editing flow.
4. Trace how the dynamic mock runtime loads and matches routes.
5. Inspect the current JSON schema builder and TypeScript type exporter.
6. Identify current auth/access controls and settings conventions.
7. Identify testing, lint, type-check, build, and migration commands.
8. Produce a short architecture map and a file-by-file implementation plan.

**Exit criteria:** no code changes until the existing architecture and integration points are understood.

### Phase 1 — MVP vertical slice (P0)

Implement:

1. Provider-independent structured-generation interface.
2. Server-side provider adapter for one selected, verified provider.
3. Runtime schemas for the proposal envelope and route proposal.
4. Project-context loading.
5. Initial route planner.
6. Deterministic schema and route validation.
7. Proposal review UI.
8. Selective approval and safe persistence.
9. Existing runtime integration.
10. Unit and integration tests.

**Definition of done:** a user can describe a simple application, review generated routes and fields, approve them, and successfully call those routes through the existing mock runtime.

### Phase 2 — Robustness and editing (P1)

Implement:

- Incremental changes.
- Diff and impact view.
- Stale proposal detection.
- Specification version history.
- Better ambiguity/clarification handling.
- Generated-field UI flow.
- Additional schema constraints and references.
- OpenAPI export.
- AI-generated contract tests.

### Phase 3 — Advanced simulation (P1/P2)

Implement:

- Stateful mock workflows.
- Scenario presets.
- Cross-route state and relationships.
- More advanced failure/latency scenarios.
- Import from OpenAPI/Postman.
- Test reports and coverage.
- Optional team approvals.

### Phase 4 — Backend scaffolding (P2)

Only after the specification, validation, and testing layers are reliable:

- Generate framework-specific backend scaffolds.
- Run build and test gates.
- Add static analysis and dependency checks.
- Present generated code as a reviewable artifact.
- Never represent scaffold output as production-secure without appropriate verification.

---

## 15. MVP acceptance criteria

The MVP is complete only when all applicable criteria pass.

### Generation

- [ ] A valid natural-language prompt can generate a structured proposal.
- [ ] The proposal contains route methods, paths, summaries, and request/response schemas.
- [ ] Nested objects, arrays, required fields, and supported constraints are represented correctly.
- [ ] Existing routes are included in conflict analysis.
- [ ] The AI can propose business-action routes rather than blindly producing CRUD.
- [ ] Ambiguous security-sensitive requirements are clearly flagged.

### Validation

- [ ] Malformed model output is rejected.
- [ ] Duplicate method/path pairs are detected.
- [ ] Invalid schemas and unsupported features are reported.
- [ ] Invalid references and parameter conflicts are detected.
- [ ] Bounded repair/retry behavior is tested.
- [ ] No generated code is executed by the mock runtime.

### Review and persistence

- [ ] The user can inspect each proposed route.
- [ ] The user can select which routes to apply.
- [ ] Rejected changes do not mutate active routes.
- [ ] Existing unselected routes remain unchanged.
- [ ] A stale proposal cannot overwrite newer project edits silently.
- [ ] Apply failures do not leave partial changes where transactions are supported.

### Runtime

- [ ] Approved routes work with the current route matcher.
- [ ] Existing mock data generation still works.
- [ ] Cache invalidation is correct after changes.
- [ ] Existing manually configured routes continue to work.
- [ ] Non-AI runtime requests do not call the AI provider.

### Security and configuration

- [ ] Missing provider configuration produces a useful message.
- [ ] Provider secrets never appear in client-side code or logs.
- [ ] Project/proposal access checks are enforced.
- [ ] Prompt/output size and retry limits are enforced.
- [ ] Untrusted model output cannot directly execute arbitrary code.

### Quality gates

- [ ] Tests cover proposal validation, conflict detection, apply behavior, and error cases.
- [ ] Existing tests continue to pass.
- [ ] Lint passes.
- [ ] Type-check passes if available.
- [ ] Production build passes if supported by the environment.
- [ ] Database migration/upgrade behavior is verified where applicable.
- [ ] Documentation describes setup, provider configuration, limitations, and test commands.

---

## 16. Testing strategy

### Unit tests

- Prompt/request validation.
- Proposal envelope validation.
- Route path normalization.
- Duplicate route detection.
- Schema validation and unsupported-feature handling.
- Conflict resolution.
- Security warning generation.
- Change-set calculation.
- Provider error normalization.
- Retry/timeout limits.

### Integration tests

- Generation task creation and persistence.
- Project-context loading with isolation.
- Proposal persistence and retrieval.
- Selective application.
- Atomic apply behavior.
- Stale revision rejection.
- Cache invalidation.
- Runtime matching of approved routes.
- No mutation on rejection/failure.

### UI tests

- Blank prompt validation.
- Loading and error states.
- Proposal rendering.
- Route selection.
- Schema inspection.
- Apply/reject interactions.
- Retry preserving the prompt.
- Stale proposal messaging.

### End-to-end test

1. Create or select a test project.
2. Submit a prompt for a simple resource such as a library or product catalog.
3. Receive a proposal.
4. Verify routes and schemas.
5. Approve selected routes.
6. Call an approved route over HTTP.
7. Validate the response against the generated schema.
8. Confirm the existing routes still behave as before.
9. Reject a second proposal and verify that no active route changes.

Use deterministic fake provider responses in most automated tests. Do not require live paid model calls in the normal test suite.

---

## 17. Suggested initial prompt for manual verification

Use this prompt to test the MVP after implementation:

> Build a mock API for a small library management application. Visitors can browse and search books. Authenticated members can view their profile and see their borrowed books. Librarians can add books and update book availability. A loan has a member, a book, a borrowed date, a due date, and a status. Include pagination for book listing, search by title or author, appropriate request and response fields, realistic mock data, and consistent error responses. Flag any authentication or authorization assumptions instead of silently treating every route as public.

Expected behavior:

- Propose book, member/profile, and loan-related endpoints appropriate to the prompt.
- Generate query parameters for book search and pagination.
- Generate nested or referenced fields consistently.
- Identify member versus librarian access assumptions.
- Avoid requiring server-generated IDs from clients unnecessarily.
- Show the proposal before applying it.
- Validate and apply selected routes.
- Allow the user to call the new mock routes successfully.
- Do not claim that real authentication or a real loan-processing backend exists if the product only simulates responses.

---

## 18. Risks and mitigations

| Risk                                          | Mitigation                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Hallucinated or incomplete routes             | Structured output, deterministic validation, visible assumptions, user review                |
| Overwriting existing routes                   | Proposal/diff workflow, explicit selection, revision checks                                  |
| Incompatible schemas                          | Map generated JSON Schema to existing schema model and test runtime compatibility            |
| Provider outage or rate limit                 | Bounded retries, clear errors, preserve drafts, configurable provider adapter                |
| Sensitive data exposure                       | Server-only secrets, output checks, sanitized logs, security warnings                        |
| Excessive model cost/latency                  | Prompt/context limits, route selection, bounded repair attempts, usage metadata              |
| Complex multi-agent behavior                  | Begin with one orchestrator and logical planning stages                                      |
| Feature creep into production code generation | Explicit MVP boundary; keep backend scaffolding out of Phase 1                               |
| Regression in existing Fack API features      | Preserve existing model/runtime, add regression tests, make changes incremental              |
| Runtime instability from stateful mocks       | Keep stateful workflows out of MVP unless existing architecture already supports them safely |

---

## 19. Success metrics

Establish a baseline during implementation and measure these metrics without retaining unnecessary sensitive content.

### Product metrics

- Time from prompt submission to reviewable proposal.
- Percentage of proposals that pass deterministic validation.
- Percentage of proposed routes accepted with minimal editing.
- Average number of manual corrections per generated route.
- Percentage of approved routes that work on the first runtime test.
- Percentage of generation tasks completed without unrecoverable errors.

### Quality metrics

- Duplicate/conflicting route rate.
- Invalid schema rate.
- Existing-route regression rate.
- Stale proposal detection correctness.
- Test pass rate for generated route contracts.
- Security findings per proposal, classified by severity.

### MVP targets

Treat initial targets as hypotheses to evaluate, not guarantees:

- 100% of applied proposals pass deterministic validation.
- Zero silent overwrites of existing unselected routes.
- Zero arbitrary model-generated code execution in the mock runtime.
- All critical apply and rejection flows covered by automated tests.
- At least one end-to-end scenario demonstrates prompt-to-working-mock-route behavior.

---

## 20. Deliverables expected from Antigravity

1. A repository-specific implementation plan.
2. An architecture note explaining where AI planning integrates with the existing application.
3. Typed route proposal and generation-task contracts.
4. Provider abstraction and one working provider adapter, subject to verified credentials/configuration.
5. Deterministic proposal validation and route conflict detection.
6. UI for prompt input, proposal review, and selective application.
7. Persistence changes and migrations, if needed.
8. Integration with the existing mock runtime and cache invalidation.
9. Unit, integration, and end-to-end tests.
10. Updated documentation and environment-variable example without secrets.
11. A final report listing files changed, commands run, test results, limitations, and follow-up work.

### Final implementation instruction

Prioritize a small, working, tested vertical slice over broad but incomplete abstractions. Keep Fack API usable without AI configuration. Reuse the existing project, route, schema, runtime, cache, and persistence architecture wherever practical. Make every AI-generated change reviewable and reversible. Do not implement future-phase functionality merely because it is listed in this PRD.
