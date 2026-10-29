# Operations Playbook — Pitfalls, Best Practices, Troubleshooting, Success Criteria

Read this before shipping a worktree workflow or when diagnosing problems — common pitfalls, best practices, the troubleshooting table, and the success-criteria bar.

## Common Pitfalls

- **Creating worktrees inside the main repo directory** — always use `../wt-name` to keep them alongside
- **Reusing localhost:3000 across all branches** — causes port conflicts; use deterministic allocation
- **Sharing one DATABASE_URL across worktrees** — each needs its own database or schema
- **Removing a worktree with uncommitted changes** — always check dirty state before removal
- **Forgetting to prune after branch deletion** — run `git worktree prune` to clean metadata
- **Not updating .env ports after worktree creation** — the setup script should handle this automatically

## Best Practices

1. **One branch per worktree, one agent per worktree** — never share
2. **Keep worktrees short-lived** — remove after the branch is merged
3. **Deterministic naming** — use `wt-<topic>` pattern for easy identification
4. **Persist port mappings** — store in `.worktree-ports.json`, not in memory
5. **Run cleanup weekly** — scan for stale and merged-branch worktrees
6. **Include worktree path in terminal title** — prevents wrong-window commits
7. **Never force-remove dirty worktrees** — unless changes are intentionally discarded

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `fatal: '<path>' is already checked out` | Branch is already active in another worktree | Use `git worktree list` to find where the branch is checked out, then switch to a different branch or remove the existing worktree first |
| Port conflict despite deterministic allocation | A non-worktree process is occupying the assigned port | Run `lsof -i :<port>` to identify the process, terminate it or adjust the stride/base in the port allocation formula |
| `.env` file missing after worktree creation | Setup script was not run or `.env` does not exist in the main repo | Copy `.env` manually from the main repo root, or re-run `setup-worktree.sh` which handles env file copying |
| `git worktree prune` reports nothing but stale paths remain | Worktree directory was deleted manually without `git worktree remove` | Run `git worktree prune` to clean orphaned metadata, then verify with `git worktree list` |
| Dependencies fail to install in new worktree | Lockfile references a private registry or cache not available in the worktree path | Ensure `.npmrc`, `.yarnrc.yml`, or pip config files are copied alongside `.env` during setup |
| Docker Compose services start on wrong ports | The `docker-compose.worktree.yml` override was not included in the compose command | Always pass both files: `docker compose -f docker-compose.yml -f docker-compose.worktree.yml up` |
| Worktree shows as dirty immediately after creation | Untracked files from `.env` copy or generated `.worktree-ports.json` | Add `.worktree-ports.json` and copied env files to `.gitignore` in the project |

## Success Criteria

- **Zero port conflicts** across all active worktrees measured by `lsof` checks returning no collisions after setup
- **Worktree creation under 60 seconds** including dependency installation for projects with warm package caches
- **100% env parity** between main repo and worktrees verified by diffing `.env` keys (values may differ for ports)
- **Stale worktree count stays at zero** when cleanup automation runs on a weekly schedule with a 14-day threshold
- **No cross-worktree interference** validated by running concurrent dev servers in 3+ worktrees simultaneously without failures
- **Branch-to-worktree traceability** maintained via `.worktree-ports.json` present in every active worktree with correct metadata
- **Cleanup safety rate of 100%** meaning no worktree with uncommitted changes is ever removed without explicit `--force` confirmation
