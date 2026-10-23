# Refined Prompt — Live Agent Canvas (Fack AI API Architect)

## 1. Original user objective

> "I have an AI agent workflow… The changes that the agent performs should be
> visible on the canvas in real time, not in a modal. I want the agent's actions
> to be visualized live on the canvas instead of a modal progress list. Optimize
> the UX." Plus: "it sometimes doesn't work" — reliability must improve.

## 2. Existing architecture (verified)

| Concern | Location |
|---|---|
| Trigger | `components/dashboard/HeaderNewProjectButton.tsx` dispatches `open-ai-architect-dialog` (canvas subpage only) |
| Current UI | `components/ai/AiArchitectDialog.tsx` — full-screen modal; mounted in `app/projects/[...slug]/layout.tsx` |
| Transport | `POST /api/ai/generate` (SSE: `progress` + `complete` + `error`) → `lib/ai/ai-architect.service.ts::generateApiSpecification` (6 phases) |
| Apply | `POST /api/ai/apply` → transactional writes → `computeCanvasLayout` → `persistCanvasState` |
| Canvas | `app/projects/[...slug]/page.tsx` → `CanvasContainer` → `FlowCanvas` (+ `RouteNode`, `EndpointGroupNode`) |
| Canvas refresh | `router.refresh()` after apply; `FlowCanvas` reconciles nodes from DB rows |
| Unused | `lib/ai/ai-tools.service.ts` (11 agent tools) — only referenced by tests |

## 3. Confirmed product decisions

1. **Ghost preview nodes** — generated-but-unapplied endpoints/routes render as
   draft nodes beside real ones; nothing is persisted until Apply.
2. **Floating canvas composer** — prompt input docks over the canvas; the canvas
   is never covered by a modal.
3. **Explicit confirmation** — the user reviews drafts and clicks Apply.
4. **Clear error + retry state on canvas** — failures surface as a persistent,
   actionable error card with Retry (not a transient toast).
   *(No streaming-protocol rewrite: the server contract stays `progress`/`complete`/`error`.)*

## 4. Functional requirements

- **FR-1** The agent UI must render on the canvas page without a modal backdrop;
  the canvas remains fully visible and interactive during generation.
- **FR-2** The composer is a floating, collapsible bar docked at the bottom of the
  canvas; it opens from the header "AI Architect" action.
- **FR-3** The composer shows the live 6-phase activity timeline while running,
  including elapsed time and a cancel action.
- **FR-4** Completed generation renders **draft** endpoint-group and route nodes on
  the canvas: additions as new draft nodes, updates as draft-marked existing nodes,
  deletions as struck-through existing nodes, conflicts as flagged nodes.
- **FR-5** Draft nodes are visually distinct and clearly labelled (NEW / EDITED /
  DELETED / CONFLICT) and are not interactive (no toggle, no edit).
- **FR-6** Draft nodes animate in sequentially so the result reads as the agent
  materialising the API.
- **FR-7** Conflicts are resolvable inline (Replace / Keep Existing / Create as /v2)
  before applying.
- **FR-8** An explicit **Apply N changes** action commits via `POST /api/ai/apply`,
  then refreshes the canvas and clears all draft state.
- **FR-9** **Discard** clears draft state without touching the project.
- **FR-10** On any generation failure the composer shows a persistent error card
  with the message and a **Retry** action that re-runs the same prompt.
- **FR-11** The full architecture specification remains inspectable on demand
  (collapsible disclosure) without a modal.

## 5. Non-functional requirements

- **NFR-1** No regression to existing canvas behaviour (drag, select, edit, save layout, add route).
- **NFR-2** Preview derivation is a pure, unit-tested function.
- **NFR-3** `npx tsc --noEmit` and `vp test run` stay green.
- **NFR-4** Accessible: live region for phase updates; `motion-reduce` respected;
  draft nodes labelled for screen readers.
- **NFR-5** Follow existing conventions: Tailwind v4 + `cn()`, base-ui `@base-ui/react`
  primitives, zustand `createStore` + context provider pattern, kebab-case module
  filenames, PascalCase components.

## 6. Non-goals

- No change to the server generation contract or the 6-phase pipeline.
- No embedding of the unused `agentTools` loop.
- No auto-apply, no persistence of drafts across reloads.
- No changes to the mock engine, DB schema, or migrations.

## 7. Assumptions

- The AI Architect action is only reachable on the canvas subpage, so the agent UI
  may live in the canvas subtree.
- `changeSet` (built server-side) is the authoritative draft description.
- Corridor: the existing unrelated one-line change in
  `app/projects/[...slug]/layout.tsx` is **not** part of this work.

## 8. Acceptance criteria

- AC-1 A modal no longer appears for generation; no backdrop blocks the canvas.
- AC-2 While running, the phase timeline updates live over the canvas.
- AC-3 On completion, draft nodes appear on the canvas with correct change badges.
- AC-4 Applying persists exactly the reviewed changes and clears drafts.
- AC-5 Discarding leaves the project unchanged.
- AC-6 A forced failure (e.g. offline) shows an error card with a working Retry.
- AC-7 Existing tests plus new preview/SSE tests pass; type-check clean.

## 9. Uncertainties

- Real-time per-node streaming is **not** delivered (server returns the whole spec
  at once); drafts appear with a sequential entrance animation instead.
  This was confirmed with the user.
