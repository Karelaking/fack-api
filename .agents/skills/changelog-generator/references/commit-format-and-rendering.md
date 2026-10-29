# Conventional Commit Format & Changelog Rendering

Read this for the commit grammar, the type→section/semver mapping, breaking-change rules, and the Keep a Changelog and GitHub Release Notes output formats.

## Conventional Commit Format

```
<type>(<scope>)<!>: <description>

[optional body]

[optional footer(s)]
```

### Type to Section Mapping

| Commit Type | Changelog Section | SemVer Bump | User-Facing? |
|-------------|------------------|-------------|-------------|
| `feat` | Added | minor | Yes |
| `fix` | Fixed | patch | Yes |
| `perf` | Performance | patch | Yes |
| `security` | Security | patch | Yes |
| `deprecated` | Deprecated | minor | Yes |
| `remove` | Removed | major | Yes |
| `refactor` | Changed | patch | Sometimes |
| `docs` | — | patch | No |
| `test` | — | — | No |
| `build` | — | — | No |
| `ci` | — | — | No |
| `chore` | — | — | No |

### Breaking Change Rules

Breaking changes always trigger a **major** version bump regardless of type:

```
feat(api)!: remove deprecated v1 endpoints

BREAKING CHANGE: The /api/v1/* endpoints have been removed.
Migrate to /api/v2/* before upgrading. See migration guide at docs/v2-migration.md.
```

## Changelog Rendering

### Keep a Changelog Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-03-09

### Added
- User can now export projects as CSV ([#234](https://github.com/org/repo/pull/234))
- Dark mode support for dashboard ([#228](https://github.com/org/repo/pull/228))

### Fixed
- Pagination returning duplicate items on page boundaries ([#231](https://github.com/org/repo/pull/231))
- Login form not showing validation errors on mobile ([#229](https://github.com/org/repo/pull/229))

### Performance
- Reduced dashboard load time by 40% with query optimization ([#232](https://github.com/org/repo/pull/232))

### Security
- Updated jsonwebtoken to 9.0.2 to fix CVE-2024-XXXX ([#233](https://github.com/org/repo/pull/233))

## [1.3.2] - 2026-02-28

### Fixed
- API rate limiter not resetting after window expiry ([#227](https://github.com/org/repo/pull/227))

[1.4.0]: https://github.com/org/repo/compare/v1.3.2...v1.4.0
[1.3.2]: https://github.com/org/repo/compare/v1.3.1...v1.3.2
```

### GitHub Release Notes Format

```markdown
## What's New

- **CSV Export**: Users can now export project data as CSV files (#234)
- **Dark Mode**: Dashboard fully supports dark mode (#228)

## Bug Fixes

- Fixed pagination returning duplicate items on page boundaries (#231)
- Fixed login form validation on mobile devices (#229)

## Performance

- Dashboard load time reduced by 40% through query optimization (#232)

## Security

- Updated jsonwebtoken to patch CVE-2024-XXXX (#233)

**Full Changelog**: https://github.com/org/repo/compare/v1.3.2...v1.4.0
```
