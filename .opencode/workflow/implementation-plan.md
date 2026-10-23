# Implementation Plan — Live Agent Canvas

Baseline: `main @ c79b3fb`; `npx tsc --noEmit` exit 0; `vp test run` 129/129.
Preexisting working-tree noise (must not be committed): `.impeccable/critique/**`,
`.opencode/agents/**`, `.opencode/skills/**`, and one unrelated CSS one-liner in
`app/projects/[...slug]/layout.tsx`.

---

## S1 — Agent session store, provider, and streaming client
**Status:** COMMITTED — `8287b4f`
**Objective:** Own the agent session state and the SSE transport outside React UI.
**Requirements:** FR-1, FR-3, FR-10, NFR-5
**Files:** `stores/agent-store.ts`, `stores/agent-store-provider.tsx`,
`lib/ai/agent-client.ts`, `test/agent-client.test.ts`
**Approach:**
- `agent-client.ts`: pure `readSseEvents()` async generator over a `ReadableStream`
  + `streamApiGeneration()` that POSTs `/api/ai/generate`, emits progress/complete,
  throws a typed error on `error` events / non-2xx.
- `agent-store.ts`: zustand vanilla store — `status` (`idle | running | ready |
  applying | error`), `prompt`, `steps`, `result`, `resolutions`, `error`, plus
  `startRun`, `cancel`, `setResolution`, `discard`, `retry`, `markApplied`.
- `agent-store-provider.tsx`: `createStore` + context (mirrors `stores/store-provider.tsx`).
**Acceptance:** new unit tests parse multi-event SSE chunks incl. errors; provider
compiles; nothing user-visible changes yet.
**Verification:** `npx tsc --noEmit`, `vp test run`
**Commit:** `feat(ai): add agent session store and streaming client`

---

## S2 — Preview node derivation (pure)
**Status:** COMMITTED — `dcca1ec`
**Deviation:** the module is named `buildDraftPlan()` (not `buildPreviewNodes()`),
and route/path matching for conflicts uses exact id first then a method+path-suffix
fallback, because generated route paths may be relative while server conflict paths
are absolute.
**Objective:** Turn an `ApiChangeSet` + live endpoints/routes into draft canvas nodes.
**Requirements:** FR-4, FR-5, NFR-2
**Files:** `components/canvas/preview-nodes.ts`, `test/preview-nodes.test.ts`
**Approach:** `buildPreviewNodes({ changeSet, endpoints, routes, projectSlug })` →
`Node[]` with deterministic ids (`preview-group-*`, `preview-route-*`), `parentId`
wired to either the real group or a draft group, and `data.draft` =
`{ kind: "create"|"update"|"delete", conflict: boolean, order: number }`.
Updates/deletes re-use the **existing** node id so they overlay in place.
**Acceptance:** creates land in the right group; update/delete target existing ids;
conflicts flagged; order is stable.
**Verification:** `vp test run` (new tests)
**Commit:** `feat(canvas): derive draft preview nodes from an agent change set`

---

## S3 — Draft visuals in node components
**Status:** COMMITTED — `dcca1ec`
**Objective:** Make draft nodes visually unmistakable.
**Requirements:** FR-5, FR-6, NFR-4
**Files:** `components/canvas/RouteNode.tsx`, `components/canvas/EndpointGroupNode.tsx`,
`app/globals.css`
**Approach:** optional `data.draft` → dashed indigo ring, translucent tint, badge
(`NEW`/`EDITED`/`DELETED`) + conflict alert icon; suppress the enable switch, edit
button and handles while draft; entrance keyframes in `globals.css` with
`animation-delay` from `draft.order` and a `motion-reduce:animate-none` guard.
**Acceptance:** draft nodes render distinctly; real nodes unchanged; reduced-motion safe.
**Verification:** `npx tsc --noEmit`, `vp test run`
**Commit:** `feat(canvas): style draft nodes for agent previews`

---

## S3b — Read-only draft node container
**Status:** DROPPED — not needed
**Deviation:** instead of a separate `DraftRouteNode.tsx` container, the existing
`endpointGroup` / `routeNode` types gained an optional `data.draft` mark and the
canvas renders them with `draggable: false` / `selectable: false`, while
`handleNodeClick` returns early for draft nodes. This avoided duplicating the node
visuals in a second component.
**Objective:** Register the draft node types so React Flow renders them without
route/node interaction handlers.
**Files:** `components/canvas/DraftRouteNode.tsx`
**Approach:** thin wrapper mapping `data.draft` onto `RouteNode` with interaction
handlers removed, keeping the shared visual language.
**Verification:** `npx tsc --noEmit`
**Commit:** included with S3

---

## S4 — Wire previews into the canvas
**Status:** COMMITTED — `dcca1ec`
**Deviation:** the draft plan is read directly from the agent store inside
`FlowCanvas` instead of being passed down as a `preview` prop, so the canvas and the
composer share one source of truth.
**Objective:** Render drafts on `FlowCanvas` and refit the viewport when they appear.
**Requirements:** FR-4, FR-6, NFR-1
**Files:** `components/canvas/FlowCanvas.tsx`, `components/canvas/CanvasContainer.tsx`
**Approach:** `FlowCanvas` gains a `preview?: ApiChangeSet | null` prop; reconciliation
appends `buildPreviewNodes(...)` after real nodes; a `useEffect` refits the viewport
when the draft count changes; real node interaction is untouched.
**Acceptance:** drafts appear/disappear without disturbing real node positions.
**Verification:** `npx tsc --noEmit`, `vp test run`
**Commit:** `feat(canvas): render agent draft nodes on the flow canvas`

---

## S5 — Floating composer, timeline, apply and retry
**Status:** COMMITTED — `dcca1ec`
**Deviation:** the run clock is derived from interval-driven state rather than
`Date.now()` during render, and expansion is derived from the current outcome key
instead of being set from effects, to satisfy the `react(purity)` and
`react(set-state-in-effect)` lint rules.
**Objective:** Replace the modal with an on-canvas composer that drives the store.
**Requirements:** FR-2, FR-3, FR-6…FR-11
**Files:** `components/ai/AgentComposer.tsx`, `components/canvas/CanvasContainer.tsx`
**Approach:** collapsible floating bar docked bottom-centre of the canvas; idle →
prompt + presets; running → live phase timeline + elapsed + cancel; ready → change
summary chips + conflict resolver (`ConflictResolutionDialog`) + spec disclosure
(`ApiChangeSetPreview`) + Apply/Discard; error → persistent card + Retry.
Applies via `POST /api/ai/apply` then `router.refresh()`.
**Acceptance:** AC-1…AC-7 satisfied end-to-end.
**Verification:** `npx tsc --noEmit`, `vp test run`
**Commit:** `feat(ai): add floating canvas composer for the API architect`

---

## S6 — Remove the modal and rewire the trigger
**Status:** COMMITTED — `dcca1ec`
**Objective:** Delete the modal path and point the header action at the composer.
**Files:** delete `components/ai/AiArchitectDialog.tsx`; edit
`app/projects/[...slug]/layout.tsx`, `components/dashboard/HeaderNewProjectButton.tsx`
**Approach:** drop the modal import/mount; rename the trigger event to
`open-agent-composer` in both dispatcher and composer.
**Acceptance:** no modal code remains; header button opens the composer.
**Verification:** `npx tsc --noEmit`, `vp test run`, grep shows no dangling references.
**Commit:** `refactor(ai): remove the modal architect in favour of the canvas composer`
**Note:** `AiPromptForm.tsx` and `GenerationProgress.tsx` were also deleted, since the
composer owns the prompt and the phase timeline now.

---

## Outcome

Stages S1–S6 are delivered in two commits instead of six. S1 shipped on its own
because it is self-contained and verifiable in isolation (verified with the rest of
the work stashed: `tsc` exit 0, 140 tests passing). S2–S6 landed together as
`dcca1ec`, because the draft visuals, the canvas wiring and the composer mount all
depend on the store provider being mounted, so splitting them further would have
produced commits that type-check but crash at runtime.

| Commit | Contents | Requirements |
| --- | --- | --- |
| `8287b4f` | streaming client, agent session store, provider, transport tests | FR-3, FR-10, NFR-5 |
| `dcca1ec` | draft plan derivation, draft node visuals, canvas wiring, composer, modal removal | FR-1, FR-2, FR-4…FR-11, NFR-1…NFR-4 |

See `.opencode/workflow/requirement-verification.md` for the per-requirement evidence.
