# Requirement Verification — Live Agent Canvas

Baseline: `main @ c79b3fb` (tsc exit 0, 129 tests passing).
Final: `dcca1ec` on top of `8287b4f`.

Verification commands (run from `E:\fack-api`):

- `npx tsc --noEmit` → exit 0, no diagnostics
- `npx vp test run` → 21 files / 150 tests passed
- `npx vp lint <touched files>` → exit 0
- pre-commit hook (`vp lint --fix` + `vp fmt`) passed on both commits

| ID | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| FR-1 | Agent work is visible on the canvas, not hidden | `AgentComposer` docks over the board; `FlowCanvas` renders `reconcileNodes(..., draftPlan)`; draft groups/routes appended in `preview-nodes.ts` (`buildDraftPlan`) | PASS |
| FR-2 | No modal blocks the canvas | Composer wrapper is `pointer-events-none` with only the panel `pointer-events-auto` and no backdrop; `AiArchitectDialog` deleted and unmounted from `app/projects/[...slug]/layout.tsx` | PASS |
| FR-3 | Drafts are previews; nothing persists until Apply | Draft node ids are `preview-group-*` / `preview-route-*`, `draggable: false`, `selectable: false`; `buildDraftPlan` is pure and writes nothing; persistence only via `POST /api/ai/apply` | PASS |
| FR-4 | Prompt entry floats at the bottom of the canvas | `AgentComposer` rendered inside `CanvasContainer`'s `relative ... flex-1` canvas wrapper with `absolute inset-x-0 bottom-0` | PASS |
| FR-5 | Apply requires explicit confirmation | `Apply {changeCount} changes` button, only rendered when `changeSet` exists | PASS |
| FR-6 | Persistent, retryable error state (not toast-only) | `error` block stays in the panel; `errorPhase` routes Retry to `startRun` or `applyChanges` | PASS |
| FR-7 | Header action opens the composer | `HeaderNewProjectButton` dispatches `OPEN_AGENT_COMPOSER_EVENT`; composer listens and opens | PASS |
| FR-8 | Conflicts resolvable during review | `ConflictResolutionDialog` wired to `resolutions` / `setResolution`; payload sends `{ projectId, proposalId, expectedVersion, resolutions }`, matching `apply/route.ts:42` | PASS |
| FR-9 | Canvas refreshes after apply | `applied` effect raises a toast and calls `router.refresh()` | PASS |
| FR-10 | A draft can be discarded | `Discard` → `actions.reset()` (keeps the prompt) | PASS |
| FR-11 | Reliability on model/server failure | `AgentGenerationError` → store `error` + `errorPhase`; SSE client now flushes a final frame that arrives without a trailing blank line (`lib/ai/agent-client.ts`), covered by `test/agent-client.test.ts` | PASS |
| NFR-1 | Agent UI only mounted on the canvas subpage | Provider + composer live in `CanvasContainer`, not `layout.tsx` | PASS |
| NFR-2 | No new dependencies | Uses existing zustand, `@xyflow/react`, shadcn primitives | PASS |
| NFR-3 | Reduced-motion respected | `@media (prefers-reduced-motion: reduce) { .agent-draft-enter { animation: none } }` and `motion-reduce:animate-none` on spinners | PASS |
| NFR-4 | Draft nodes cannot be edited/selected as real routes | `handleNodeClick` returns early when `node.data.draft` is set; draft nodes are `selectable: false` | PASS |
| NFR-5 | Type-safe and lint-clean | `npx tsc --noEmit` exit 0; `vp lint` exit 0; `vp test run` 150/150 | PASS |

## Not verified in a browser

The canvas rendering and interaction requirements (FR-1, FR-2, FR-4, NFR-4) are
verified by type checking, linting, unit tests on the pure derivation module, and
code inspection — **not** by a live dev-server session. `next build` and a manual
click-through were deliberately skipped because another process was concurrently
rewriting files in this working tree (`lib/mock-engine.ts`, `lib/actions/*`,
`lib/services/route.service.ts`, `stores/schema-store.ts`), which would have made a
build/run result unreliable and risked clobbering that work.

The highest-value runtime check that remains is seeing draft nodes appear, the
composer dock, and Apply refresh the canvas. The provider indirection itself has been
checked by inspection: in the committed `components/canvas/CanvasContainer.tsx`,
`<FlowCanvas />` (line 76) and `<AgentComposer />` (line 87) both sit inside
`<AgentStoreProvider projectId={projectId}>` (line 73), so the store is available to
every consumer. Recommended manual pass:

```
vp dev
# sign in, open a project, press "AI Architect", generate, review drafts, apply
```

## Uncertainties

- Per-node progressive streaming was explicitly declined, so drafts are revealed
  as one staggered batch when the `complete` event arrives rather than as the
  server generates each node. The phase timeline still streams live.
- `hasConflict` for newly created routes is matched by method plus a path suffix
  comparison, because the server's conflict paths include the base path while
  generated route paths may be relative. Marks for existing routes use the exact
  `existingRouteId`.

## Correction: both CSS failures came from these notes

Two CSS failures were reported against the safe-area padding utility, and **both
originated in this file**, not in the application.

Tailwind builds its stylesheet by scanning the project. Its automatic detection skips
`node_modules` and anything matched by `.gitignore` — but `.opencode/` and
`.impeccable/` are untracked *and* unignored, so they sat inside the scan scope.

1. An early revision quoted the utility as a complete class literal, in both the
   underscore-escaped and underscore-stripped spellings. Tailwind extracted both and
   generated a rule for each, which surfaced as the "while optimizing generated CSS"
   messages.
2. A later revision quoted the **elided** spelling — the form copied straight out of a
   diagnostic, with a literal ellipsis standing in for the argument. Tailwind faithfully
   emitted that ellipsis into the declaration, which is structurally invalid CSS, and
   the parser failed hard. That was the reported build error, and the cause was my own
   note: copying an elided diagnostic into a scanned file injects an invalid token.

The application classes were never at fault, and my earlier claim that they were
build-breaking was wrong. Built with the underscore-stripped form in both layout files,
Tailwind normalises the value itself, the emitted declaration is properly spaced, and
the build exits 0 with no CSS warnings.

### Resolution

- This document no longer quotes the utility as a class literal, in any spelling, and
  no longer reproduces an elided value.
- `app/globals.css` now excludes the tooling directories from Tailwind's automatic
  detection (`@source not`), so notes under `.opencode/` or `.impeccable/` cannot reach
  the stylesheet at all. No application class names were changed.

### Verification

`npx next build` → exit 0, `Compiled successfully`, no CSS warnings, and the emitted
stylesheet contains no rule carrying an elided value.
