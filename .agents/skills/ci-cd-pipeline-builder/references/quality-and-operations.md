# Validation, Pitfalls, Best Practices, Troubleshooting & Success Criteria

Read this before merging a generated pipeline, when a pipeline misbehaves, or when checking a pipeline against the quality bar.

## Validation Checklist

Before merging a generated pipeline:

1. YAML parses without syntax errors
2. All referenced commands exist in the repository (`test`, `lint`, `build`)
3. Cache strategy matches the detected package manager
4. Required secrets are documented (not embedded in YAML)
5. Branch protection rules match organization policy
6. Deployment jobs are gated by protected environments
7. Security scanning runs on the appropriate code paths
8. Artifact retention is set (do not keep build artifacts indefinitely)
9. Concurrency group prevents duplicate runs on the same branch
10. Path filters exclude documentation-only changes from full CI runs

## Common Pitfalls

- **Copying pipelines between projects** without adapting to the actual stack
- **No concurrency control** leading to redundant parallel runs on rapid pushes
- **Missing cache keys** causing cache misses on every run (slow builds)
- **Running full matrix on every PR** when only main needs multi-version testing
- **Hardcoding secrets in YAML** instead of using CI secret stores
- **No path filtering** so documentation changes trigger full build+test+deploy
- **Deploy jobs without environment gates** allowing accidental production deployments
- **No artifact retention policy** causing storage costs to grow indefinitely

## Best Practices

1. **Detect stack first, then generate pipeline** — never guess at build commands
2. **Keep the generated baseline under version control** and customize incrementally
3. **One optimization at a time** — add caching, then matrix, then split jobs
4. **Require green CI before any deployment job** can execute
5. **Use protected environments** for production credentials and manual approval gates
6. **Track pipeline duration and flakiness** as first-class engineering metrics
7. **Separate deploy jobs from CI jobs** to keep feedback fast for developers
8. **Regenerate the pipeline when the stack changes significantly** (new language, new framework)

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Pipeline YAML fails validation | Indentation errors or invalid key names | Run `yamllint` locally before committing; use the CI platform's built-in linter (e.g., `act` for GitHub Actions, `gitlab-ci-lint` for GitLab) |
| Cache misses on every run | Cache key does not include the correct lockfile hash | Verify the `hashFiles()` path matches the actual lockfile location; check the Caching Strategy Reference table above |
| Matrix build times explode | Running full OS + version matrix on every PR | Restrict the full matrix to `main` branch pushes; run a single representative version on PRs |
| Deployment job triggers on PRs | Missing branch/event guard on deploy jobs | Add `if: github.ref == 'refs/heads/main' && github.event_name == 'push'` or equivalent platform condition |
| Service containers fail to start | Health check misconfigured or image not found | Pin the service image to a specific major version; confirm health check command exists in the image |
| Secret not available in workflow | Secret not added to the repository or environment settings | Add the secret via the CI platform's secrets UI; ensure the job references the correct `environment` name |
| Build artifact missing in deploy job | Artifact name mismatch or retention expired | Ensure `upload-artifact` and `download-artifact` use the same `name` value; set `retention-days` high enough to survive the full pipeline |

## Success Criteria

- Pipeline generates valid YAML that passes platform-native linting on first attempt for detected stacks
- Build times stay under 10 minutes for lint + test + build stages combined (excluding deploy)
- Cache hit rate exceeds 90% on repeat runs with unchanged lockfiles
- Security scanning (SAST + dependency + container) executes on every push to `main` without manual triggers
- Deployment to staging is fully automated; production requires exactly one manual approval gate
- Pipeline flakiness rate remains below 2% over a rolling 30-day window
- Zero hardcoded secrets in generated pipeline YAML; all sensitive values reference platform secret stores
