# Lint Fix Plan

**Date:** 2026-07-21
**Status:** Ready to execute
**Total issues:** 34 (12 errors, 22 warnings)

---

## Group 1: Errors (12) — Must fix for CI to pass

### 1A. `no-explicit-any` (6 errors in `lib/cache.ts`)

- **Lines 4, 7, 9, 13, 33, 37** — Replace `any[]` with proper `Route[]` type
- Import `Route` from `@/db/schema`, type all cache maps and functions properly

### 1B. `prefer-const` (2 errors in `lib/mock-handler-core.ts`)

- **Lines 39-40** — Change `let matchedPath` and `let matchedMethod` to `const` (they are never reassigned)

### 1C. `react/no-unescaped-entities` (1 error in `components/dashboard/ProjectSettings.tsx`)

- **Line 178** — Replace `'` with `&apos;` or use a JSX template

### 1D. `react-hooks/set-state-in-effect` (1 error in `components/edit-bar/EditBar.tsx`)

- **Line 115** — `setMethod(route.method)` etc. inside `useEffect`. Fix: use `useState` initializer or `useMemo` to derive initial state, or add eslint-disable comment with rationale since this is an intentional sync pattern

### 1E. `no-explicit-any` in `components/edit-bar/EditBar.tsx`

- **Line 214** — `setMethod(e.target.value as any)`. Fix: cast to `Route["method"]` or use a union type `"GET" | "POST" | "PUT" | "DELETE" | "PATCH"`

### 1F. `no-explicit-any` in `components/canvas/FlowCanvas.tsx`

- **Line 244** — `selectedRouteNode.data as any`. Fix: cast to a proper `RouteNodeData` type (or inline type assertion with the known shape)

---

## Group 2: Warnings (22) — Should fix for clean lint

### 2A. Unused imports (15 warnings) — Remove dead imports

| File                                            | Imports to remove                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `components/canvas/RouteNode.tsx`               | `RiExternalLinkLine`, `RiFileCopyLine`, `toast`                                        |
| `components/dashboard/DashboardBreadcrumbs.tsx` | `RiGitBranchLine`, `RiPulseLine`, `RiSettings2Line`, `RiFileHistoryLine`               |
| `components/dashboard/DashboardSidebar.tsx`     | `RiFolderSharedLine`                                                                   |
| `components/dashboard/ProjectSettings.tsx`      | `slugify`                                                                              |
| `components/edit-bar/EditBar.tsx`               | `RiFileCopyLine`, `RiArrowDownSLine`, `cn`, `projectSlug`, `customDomain`, `endpoints` |

### 2B. Unused variable (1 warning)

- `components/dashboard/DashboardBreadcrumbs.tsx:97` — `activeTab` is assigned but never used. Remove the variable.

### 2C. React hooks exhaustive-deps (3 warnings in `FlowCanvas.tsx`)

- **Line 206** — Add `customDomain`, `onOpenEdit`, `projectSlug` to deps
- **Line 233** — Remove `customDomain`, `onOpenEdit`, `onSelectRoute`, `projectSlug` from deps (they're stable references and cause unnecessary re-renders, but lint wants them listed; add eslint-disable comment with rationale)
- **Line 367** — Add `customDomain`, `onOpenEdit`, `projectSlug` to deps

### 2D. `import/no-anonymous-default-export` (1 warning)

- `commitlint.config.ts` — Assign to a named `module.exports` or `const config = {...}; export default config;`

### 2E. Coverage directory ignored (1 warning)

- `coverage/lcov-report/block-navigation.js` — Add `coverage/` to `globalIgnores` in `eslint.config.mjs`

---

## Group 3: ESLint config improvement

- Add `coverage/**` to `globalIgnores` in `eslint.config.mjs` to prevent linting generated coverage files

---

## Execution Order

1. Fix `eslint.config.mjs` — add `coverage/**` to ignores
2. Fix `lib/cache.ts` — type properly with `Route[]`
3. Fix `lib/mock-handler-core.ts` — `let` → `const`
4. Fix `commitlint.config.ts` — named export
5. Fix all unused import warnings across 5 component files
6. Fix `ProjectSettings.tsx` — unescaped entity
7. Fix `EditBar.tsx` — set-state-in-effect + any
8. Fix `FlowCanvas.tsx` — any + hooks deps
9. Run `pnpm run lint` to verify zero errors
10. Run `pnpm run test` to confirm no regressions

---

## Risk Assessment

| Fix                           | Risk   | Notes                                                                     |
| ----------------------------- | ------ | ------------------------------------------------------------------------- |
| Remove unused imports         | Low    | Pure dead code removal                                                    |
| Fix `prefer-const`            | Low    | No behavioral change                                                      |
| Fix `no-unescaped-entities`   | Low    | HTML entity replacement                                                   |
| Type `cache.ts`               | Medium | Need to verify cached shape matches `Route[]` (may be flattened/joined)   |
| EditBar `set-state-in-effect` | Medium | Legitimate "sync form state from props" pattern — may need eslint-disable |
| FlowCanvas `as any`           | Low    | Just needs a proper type cast                                             |
| ESLint config                 | Low    | Pure config change                                                        |
