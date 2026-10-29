# Cleanup Automation & Multi-Agent Workflows

Read this when automating worktree cleanup, coordinating multiple agents across worktrees, or deciding whether a scenario warrants a new worktree.

## Cleanup Automation

```bash
#!/bin/bash
# cleanup-worktrees.sh — Safe worktree cleanup
set -euo pipefail

STALE_DAYS="${1:-14}"
DRY_RUN="${2:-true}"

echo "Scanning worktrees (stale threshold: ${STALE_DAYS} days)..."
echo ""

git worktree list --porcelain | while read -r line; do
  case "$line" in
    worktree\ *)
      WT_PATH="${line#worktree }"
      ;;
    branch\ *)
      BRANCH="${line#branch refs/heads/}"
      # Skip main worktree
      if [ "$WT_PATH" = "$(git rev-parse --show-toplevel)" ]; then
        continue
      fi

      # Check if branch is merged
      MERGED=""
      if git branch --merged main | grep -q "$BRANCH" 2>/dev/null; then
        MERGED=" [MERGED]"
      fi

      # Check for uncommitted changes
      DIRTY=""
      if [ -d "$WT_PATH" ]; then
        cd "$WT_PATH"
        if [ -n "$(git status --porcelain)" ]; then
          DIRTY=" [DIRTY - has uncommitted changes]"
        fi
        cd - > /dev/null
      fi

      # Check age
      if [ -d "$WT_PATH" ]; then
        AGE_DAYS=$(( ($(date +%s) - $(stat -f %m "$WT_PATH" 2>/dev/null || stat -c %Y "$WT_PATH" 2>/dev/null)) / 86400 ))
        STALE=""
        if [ "$AGE_DAYS" -gt "$STALE_DAYS" ]; then
          STALE=" [STALE: ${AGE_DAYS} days old]"
        fi
      fi

      echo "$WT_PATH ($BRANCH)$MERGED$DIRTY$STALE"

      if [ -n "$MERGED" ] && [ -z "$DIRTY" ] && [ "$DRY_RUN" = "false" ]; then
        echo "  -> Removing merged clean worktree..."
        git worktree remove "$WT_PATH"
      fi
      ;;
  esac
done

echo ""
git worktree prune
echo "Done. Run with 'false' as second arg to actually remove."
```

## Multi-Agent Workflow Pattern

When running multiple AI agents (Claude Code, Cursor, Copilot) on the same repo:

```
Agent Assignment:
───────────────────────────────────────────────────
Agent 1 (Claude Code)  → wt-feature-auth   (port 3010)
Agent 2 (Cursor)       → wt-feature-billing (port 3020)
Agent 3 (Copilot)      → wt-bugfix-login   (port 3030)
Main repo              → integration (main) (port 3000)
───────────────────────────────────────────────────

Rules:
- Each agent works ONLY in its assigned worktree
- No agent modifies another agent's worktree
- Integration happens via PRs to main, not direct merges
- Port conflicts are impossible due to deterministic allocation
```

## Decision Matrix

| Scenario | Action |
|----------|--------|
| Need isolated dev server for a feature | Create a new worktree |
| Quick diff review of a branch | `git diff` in current tree (no worktree needed) |
| Hotfix while feature branch is dirty | Create dedicated hotfix worktree |
| Bug triage with reproduction branch | Temporary worktree, cleanup same day |
| PR review with running code | Worktree at PR branch, run tests |
| Multiple agents on same repo | One worktree per agent |

## Validation Checklist

After creating a worktree, verify:

1. `git worktree list` shows the expected path and branch
2. `.worktree-ports.json` exists with unique port assignments
3. `.env` files are present and contain worktree-specific ports
4. `pnpm install` (or equivalent) completed without errors
5. Dev server starts on the allocated port
6. Database connects on the allocated DB port
7. No port conflicts with other worktrees or services
