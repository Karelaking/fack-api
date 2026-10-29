# Generation Workflow, Commit Linting & Monorepo Strategy

Read this when implementing the parse→bump→render pipeline, enforcing commit format via hooks/CI, or scoping changelogs in a monorepo.

## Generation Workflow

### Step 1: Collect Commits

```bash
# Get commits between two tags
git log v1.3.2..HEAD --pretty=format:'%H %s' --no-merges

# Get commits with full body (for breaking change detection)
git log v1.3.2..HEAD --pretty=format:'%H%n%s%n%b%n---COMMIT_END---' --no-merges
```

### Step 2: Parse and Classify

```python
import re
from dataclasses import dataclass
from typing import Optional

@dataclass
class ParsedCommit:
    hash: str
    type: str
    scope: Optional[str]
    description: str
    body: Optional[str]
    breaking: bool
    breaking_description: Optional[str]

COMMIT_PATTERN = re.compile(
    r'^(?P<type>feat|fix|perf|refactor|docs|test|build|ci|chore|security|deprecated|remove)'
    r'(?:\((?P<scope>[^)]+)\))?'
    r'(?P<breaking>!)?'
    r':\s*(?P<description>.+)$'
)

def parse_commit(hash: str, message: str) -> Optional[ParsedCommit]:
    lines = message.strip().split('\n')
    subject = lines[0]
    body = '\n'.join(lines[1:]).strip() if len(lines) > 1 else None

    match = COMMIT_PATTERN.match(subject)
    if not match:
        return None  # Non-conventional commit

    breaking = bool(match.group('breaking'))
    breaking_desc = None

    if body and 'BREAKING CHANGE:' in body:
        breaking = True
        bc_match = re.search(r'BREAKING CHANGE:\s*(.+)', body, re.DOTALL)
        if bc_match:
            breaking_desc = bc_match.group(1).strip()

    return ParsedCommit(
        hash=hash,
        type=match.group('type'),
        scope=match.group('scope'),
        description=match.group('description'),
        body=body,
        breaking=breaking,
        breaking_description=breaking_desc,
    )
```

### Step 3: Determine Version Bump

```python
def determine_bump(commits: list[ParsedCommit]) -> str:
    """Determine semver bump from parsed commits."""
    if any(c.breaking for c in commits):
        return 'major'
    if any(c.type == 'feat' for c in commits):
        return 'minor'
    if any(c.type in ('fix', 'perf', 'security', 'refactor') for c in commits):
        return 'patch'
    return 'none'

def bump_version(current: str, bump: str) -> str:
    """Apply bump to a semver string."""
    major, minor, patch = map(int, current.lstrip('v').split('.'))
    if bump == 'major':
        return f"{major + 1}.0.0"
    elif bump == 'minor':
        return f"{major}.{minor + 1}.0"
    elif bump == 'patch':
        return f"{major}.{minor}.{patch + 1}"
    return current
```

### Step 4: Render Changelog

```python
SECTION_MAP = {
    'feat': 'Added',
    'fix': 'Fixed',
    'perf': 'Performance',
    'security': 'Security',
    'deprecated': 'Deprecated',
    'remove': 'Removed',
    'refactor': 'Changed',
}

def render_changelog(version: str, date: str, commits: list[ParsedCommit], repo_url: str) -> str:
    sections: dict[str, list[str]] = {}

    # Breaking changes get their own section
    breaking = [c for c in commits if c.breaking]
    if breaking:
        sections['BREAKING CHANGES'] = []
        for c in breaking:
            desc = c.breaking_description or c.description
            scope = f"**{c.scope}**: " if c.scope else ""
            sections['BREAKING CHANGES'].append(f"- {scope}{desc}")

    # Group remaining by section
    for commit in commits:
        section = SECTION_MAP.get(commit.type)
        if not section:
            continue
        if section not in sections:
            sections[section] = []
        scope = f"**{commit.scope}**: " if commit.scope else ""
        link = f"([{commit.hash[:7]}]({repo_url}/commit/{commit.hash}))"
        sections[section].append(f"- {scope}{commit.description} {link}")

    # Render
    lines = [f"## [{version}] - {date}", ""]
    for section_name in ['BREAKING CHANGES', 'Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Performance', 'Security']:
        if section_name in sections:
            lines.append(f"### {section_name}")
            lines.extend(sections[section_name])
            lines.append("")

    return '\n'.join(lines)
```

## Commit Linting

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/commit-msg
# Validates commit message follows Conventional Commit format

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")
FIRST_LINE=$(head -1 "$COMMIT_MSG_FILE")

PATTERN='^(feat|fix|perf|refactor|docs|test|build|ci|chore|security|deprecated|remove)(\([a-z0-9-]+\))?!?:\s.{1,72}$'

if ! echo "$FIRST_LINE" | grep -qE "$PATTERN"; then
  echo "ERROR: Commit message does not follow Conventional Commits format."
  echo ""
  echo "Expected: <type>(<scope>): <description>"
  echo "Example:  feat(auth): add OAuth2 login flow"
  echo ""
  echo "Valid types: feat, fix, perf, refactor, docs, test, build, ci, chore, security"
  echo ""
  echo "Your message: $FIRST_LINE"
  exit 1
fi

# Check description length
DESC_LENGTH=$(echo "$FIRST_LINE" | sed 's/^[^:]*: //' | wc -c)
if [ "$DESC_LENGTH" -gt 72 ]; then
  echo "ERROR: Commit description exceeds 72 characters ($DESC_LENGTH chars)."
  exit 1
fi
```

### CI Linting

```yaml
# .github/workflows/lint-commits.yml
name: Lint Commits
on:
  pull_request:

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g @commitlint/cli @commitlint/config-conventional
      - run: |
          npx commitlint --from ${{ github.event.pull_request.base.sha }} \
                          --to ${{ github.event.pull_request.head.sha }}
```

## Monorepo Strategy

### Scoped Changelogs

In a monorepo, each package maintains its own changelog filtered by scope:

```bash
# Get commits scoped to a specific package
git log v1.3.0..HEAD --pretty=format:'%H %s' --no-merges | \
  grep -E '^\w+ (feat|fix|perf|refactor)\(ui\):'

# Example output:
# abc1234 feat(ui): add date picker component
# def5678 fix(ui): button alignment on mobile
```

### Per-Package Changelog Location

```
packages/
  ui/
    CHANGELOG.md        ← @repo/ui changes only
    package.json
  api/
    CHANGELOG.md        ← @repo/api changes only
    package.json
CHANGELOG.md            ← infrastructure / cross-cutting changes
```

## Release Workflow Integration

```
PR merges to main
      │
      v
CI detects new commits since last tag
      │
      v
Parse commits → determine bump → generate changelog
      │
      v
Create draft GitHub Release with generated notes
      │
      v
Human reviews and edits release notes
      │
      v
Publish release → triggers deployment pipeline
```
