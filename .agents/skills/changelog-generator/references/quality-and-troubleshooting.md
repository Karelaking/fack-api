# Output Quality, Pitfalls, Best Practices, Troubleshooting & Success Criteria

Read this before publishing a generated changelog and when diagnosing parse, bump, scoping, or linting problems.

## Output Quality Checklist

Before publishing generated changelog:

1. Each bullet is user-meaningful, not implementation noise
2. Breaking changes include migration instructions
3. Security fixes are in their own section (not mixed with bug fixes)
4. Duplicate bullets across sections are removed
5. Scope prefixes are consistent and meaningful
6. Empty sections are omitted
7. Links to PRs/commits are correct

## Common Pitfalls

- **Merge commit messages polluting the changelog** — exclude merge commits with `--no-merges`
- **Vague commit messages** — "fix stuff" cannot become a useful release note; enforce linting
- **Missing migration guidance for breaking changes** — require `BREAKING CHANGE:` footer with instructions
- **Docs/chore commits in user-facing changelog** — filter to only user-facing types
- **Overwriting historical entries** — always prepend new entries, never modify existing ones
- **Manual version bumps in monorepos** — use Changesets for coordinated versioning

## Best Practices

1. **Enforce conventional commits in CI** — block merges with non-conforming messages
2. **Scope commits in monorepos** — `feat(ui):` not just `feat:` for package-specific changes
3. **Review generated changelog before publishing** — automation gets you 90%, human editing adds polish
4. **Tag releases after changelog is finalized** — changelog is part of the release, not an afterthought
5. **Keep an [Unreleased] section** — for manual curation between releases
6. **Link to PRs, not commits** — PRs have context and discussion that commits lack
7. **Separate internal and external changelogs** — users do not need to know about CI config changes

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Changelog is empty after generation | All commits use non-user-facing types (`docs`, `chore`, `ci`, `test`) | Ensure feature and fix commits use `feat:` or `fix:` types; review type-to-section mapping |
| Version bump detected as `none` | No commits match bump-triggering types | Verify commits follow Conventional Commit format; check regex pattern matches your type list |
| Breaking changes missing from output | `BREAKING CHANGE:` footer has wrong casing or whitespace | Use exact string `BREAKING CHANGE:` (uppercase, with colon and space) in commit footer |
| Monorepo changelog includes unrelated packages | Scope filter not applied or scope names inconsistent | Standardize scope names across teams; filter commits with `grep -E 'type\(your-scope\):'` |
| Merge commits polluting release notes | `--no-merges` flag omitted from `git log` | Always pass `--no-merges` when collecting commits for changelog generation |
| Commit linter rejects valid messages | Regex pattern missing a valid type or scope contains uppercase | Update the `PATTERN` regex to include all custom types; enforce lowercase scopes |
| Duplicate entries across changelog sections | A breaking change commit also matches its original type section | Deduplicate by checking if a commit already appears in BREAKING CHANGES before adding to type section |

## Success Criteria

- **Commit parse rate above 95%** — fewer than 5% of commits in a release range fail to parse as valid Conventional Commits
- **Zero manual version bump errors** — semantic version is always determined automatically from commit types, never hand-edited
- **Changelog generation under 10 seconds** — full parse-classify-render cycle completes in under 10 seconds for repositories with up to 500 commits per release
- **100% of breaking changes documented** — every commit with `!` suffix or `BREAKING CHANGE:` footer appears in the BREAKING CHANGES section with migration guidance
- **Release notes review time under 15 minutes** — generated changelog requires minimal human editing before publication
- **Commit lint failure rate below 2%** — after team onboarding, fewer than 2% of commits are rejected by the pre-commit hook or CI linter
- **Monorepo scope accuracy at 100%** — scoped changelogs contain only commits relevant to their package with no cross-contamination
