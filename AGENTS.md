<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:graphify-agent-rules -->

# Graphify Codebase Navigation

Before attempting to answer any architectural, relational, or structural questions about this codebase:

1. Check if `graphify-out/graph.json` exists. If it does, always read `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` first to find relevant modules, boundaries, and connections instead of doing broad manual text searches or scanning all files.
2. If source files have changed, update the knowledge graph by running:
   `& "$env:APPDATA\Python\Python314\Scripts\graphify.exe" . --code-only`
3. Leverage the communities defined in `graphify-out/` to locate context and seams when making updates.

<!-- END:graphify-agent-rules -->

<!-- BEGIN:commit-style-agent-rules -->

# Commit Message Rules

Always follow the **Conventional Commits** specification when writing git commit messages.
This ensures a highly readable and automated project history.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Allowed Types

- **feat**: A new feature for the user, not a new feature for build script.
- **fix**: A bug fix for the user, not a fix to a build script.
- **docs**: Documentation only changes (e.g., README.md, comments).
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **perf**: A code change that improves performance.
- **test**: Adding missing tests or correcting existing tests.
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation.
- **revert**: Reverts a previous commit.

## Scope (Optional)

A scope may be provided to specify the section of the codebase the commit affects.
Use lowercase scopes. Recommended scopes for this project:

- `canvas`
- `mock-engine`
- `dashboard`
- `db`
- `auth`
- `ui`

## Description Rules

- Use the **imperative, present tense**: "change" not "changed" nor "changes".
- Do not capitalize the first letter (e.g., "fix: resolve login bug", not "fix: Resolve login bug").
- No dot (.) at the end.

## Body Rules (Optional)

- Use the body to explain **what** and **why**, instead of **how**.
- Separate the body from the description with a blank line.
- Wrap the body at 72 characters.

## Breaking Changes

Any commit that introduces a breaking change must:

1. Append a `!` after the type/scope (e.g., `feat(api)!: change response format`).
2. Include a footer starting with `BREAKING CHANGE:` followed by a space and a description of the change.

## Examples

- `feat(canvas): add active route summary panel`
- `fix(auth): handle missing first_name in clerk metadata update`
- `refactor(ui): redesign route node to follow shadcn system`

<!-- END:commit-style-agent-rules -->
