# Flag Debt and Cleanup

Reference for identifying, quantifying, and paying down flag debt — the accumulated cost of stale, unowned, or forgotten feature flags in a codebase. Includes the cleanup loop, dead-code detection patterns, safe removal procedures, and PR templates.

---

## What flag debt costs you

Every stale flag has measurable cost:

| Cost | How it shows up |
|------|-----------------|
| **Code complexity** | Branches that never execute, but still need to be read and reasoned about |
| **Test matrix explosion** | N flags = 2^N theoretical combinations; even partial coverage gets exponential |
| **Bug surface** | Inactive code paths atrophy — when re-activated (intentionally or by a bug), they fail |
| **Cognitive load** | "Is this flag still meaningful?" wastes minutes per PR review, every PR |
| **Flag system cost** | Many SaaS providers price per flag, per evaluation, per environment |
| **Risk of mis-flip** | More flags = more places where a wrong toggle causes an incident |
| **Onboarding friction** | New engineers can't tell which flags are live vs vestigial |
| **Compliance audit drag** | Auditors want to see what's gated and why; can't if half the flags are zombies |

A team with 200 active release flags, half of which are stale, isn't agile — it's stuck. Velocity drops because every change has to navigate the maze.

---

## Flag debt categories

### Category 1: Dead — unreferenced

The flag exists in the control plane, but no code reads it. Pure overhead. Zero risk to delete from the control plane.

**How to find:** `scripts/flag_audit.py` cross-references the flag-system export against codebase grep results.

**Remediation:** delete from control plane immediately. No code change needed.

### Category 2: Stranded at 0%

Flag has been at 0% (or off) for > 30-60 days. The team intended to ship something and didn't.

**Likely cause:** project was deprioritized, owner left, the new code path was abandoned.

**Remediation:** confirm with team. Two outcomes:
- "We'll never ship this" → delete flag + the never-reached code
- "We will ship eventually" → set a hard date or kill it

### Category 3: Stranded at 100%

Flag has been at 100% for > 30 days. The feature is live; the flag is now a do-nothing branch.

**Likely cause:** team moved on, removal got deprioritized, no one wants to touch it.

**Remediation:** remove the flag from code. The "true" branch becomes the only branch; delete the "false" branch.

### Category 4: Permanent that should be config

Flag has been at the same value for > 6 months and is not a kill switch. It's effectively configuration, but routed through the flag system.

**Likely cause:** original use case was a flag; situation evolved; nobody re-classified.

**Remediation:** move to your real config system (env var, config service, secrets manager — whatever you use for stable config).

### Category 5: Mis-typed (release flag living as permanent)

Flag was created as a "release flag" but has effectively become an entitlement or kill switch. The taxonomy is now wrong.

**Remediation:** re-type it. Possibly move to a different system (entitlements service, ops dashboard).

### Category 6: Nested / interdependent

A flag whose value only matters if another flag is also set. Multiple of these chained = combinatorial mess.

**Remediation:** refactor into a single decision function with clearly-named inputs. The combined logic lives in code, gated by one flag if needed.

### Category 7: Owned by ghost

Flag's listed owner left the company > 6 months ago. No one has claimed it.

**Remediation:** reassign to current team owning the area. If no team owns it, flip to safe default + plan removal.

---

## The cleanup loop — operational cadence

### Quarterly (minimum)

Run for the whole codebase:

```bash
python3 engineering/feature-flags-architect/scripts/flag_audit.py \
  --path . \
  --flag-export ./flags-export.json \
  --format markdown \
  --output flag-debt-report.md
```

The report:
- Lists every flag in code + control plane
- Categorizes each (1-7 above)
- Recommends action per flag
- Provides a removal sprint plan

Review with team lead. Pick the top 10 candidates. Open PRs.

### Per-PR (zero-cost prevention)

Add to PR template:

```markdown
- [ ] If this PR adds a feature flag, what's the removal trigger?
- [ ] If this PR removes a flag, has the now-dead branch been deleted?
- [ ] If this PR adds an `if flag_x:`, is the evaluation in a single dedicated function?
```

### Per-release (sustainable rhythm)

For each release, the team's flag count should:
- Increase by the number of new release flags shipped this cycle
- Decrease by removals of flags at 100% for > 1 release

If counts only increase, debt accumulates.

---

## How to identify flag references in code

### Pattern 1: Direct SDK calls

```python
# Python
flags.is_enabled("growth.signup_v2.enabled", ...)
flag_client.bool_variation("ops.recs.kill", ...)

# Go
client.BoolVariation("ops.recs.kill", user, false)

# TypeScript
client.getBooleanValue("growth.signup_v2.enabled", false, context)
```

Search regex: extract the flag key (first string literal argument).

### Pattern 2: Indirect via constants

```python
SIGNUP_V2_FLAG = "growth.signup_v2.enabled"
flags.is_enabled(SIGNUP_V2_FLAG, ...)
```

Search for constants assigned to flag-key-shaped strings, then trace usage.

### Pattern 3: Configuration-driven

```python
# config.py
FLAGS = {
    "signup_v2": "growth.signup_v2.enabled",
    "kill_recs": "ops.recs.kill",
}
```

Parse the config dict to extract flag keys.

### Pattern 4: Dynamic / template-generated

```python
flag_key = f"feature.{feature_id}.enabled"
flags.is_enabled(flag_key)
```

These are the hardest to find — the flag key is computed. Best you can do: identify the pattern and flag for human review.

`scripts/flag_audit.py` handles patterns 1-3 via regex; pattern 4 produces a "needs human review" entry.

---

## The audit output format

`scripts/flag_audit.py --format json` output:

```json
{
  "summary": {
    "total_flags_in_control_plane": 142,
    "total_flag_references_in_code": 137,
    "unreferenced_flags": 18,
    "code_references_to_unknown_flags": 13,
    "by_category": {
      "dead_unreferenced": 18,
      "stranded_at_0": 7,
      "stranded_at_100": 24,
      "permanent_should_be_config": 5,
      "ghost_owner": 9,
      "active_healthy": 79
    },
    "recommended_removals_immediate": 18,
    "recommended_removals_after_review": 36
  },
  "flags": [
    {
      "key": "growth.signup_v2.enabled",
      "type_declared": "release",
      "owner": "growth-eng",
      "owner_status": "active",
      "current_value_prod": "100%",
      "days_at_current_value": 67,
      "code_references": [
        {"path": "src/signup/router.py", "line": 42, "function": "route_signup"},
        {"path": "src/signup/router.py", "line": 89, "function": "track_signup"}
      ],
      "category": "stranded_at_100",
      "recommendation": "Remove flag — 67 days at 100%, ready for cleanup",
      "removal_complexity": "low",
      "removal_pr_template_path": "templates/remove-flag-pr.md"
    }
  ]
}
```

---

## Safe removal — step by step

Removing a flag is a code change. Treat it like one.

### Step 1: Verify the flag is at terminal state

For release/experiment flags: must be at 100% (or "winner declared") for the right duration.

```bash
# Check via flag system API:
curl https://flags.example.com/api/v1/flags/growth.signup_v2.enabled \
  -H "Authorization: Bearer ..." | jq .currentValue
```

For ops flags: only remove if the underlying need is gone (dependency retired, risky path replaced). Most kill switches stay forever.

### Step 2: Find all references

```bash
git grep -E "growth\.signup_v2\.enabled" -- '*.py' '*.ts' '*.go'
```

Expect: 1-10 references typically. If > 20, the flag was used too broadly — refactor before removing.

### Step 3: Pick which branch to keep

The "true" (feature-on) branch is kept; the "false" branch is deleted. Or vice versa, depending on what was rolled out.

```python
# Before:
def route_signup(payload):
    if flags.is_enabled("growth.signup_v2.enabled", ...):
        return signup_v2(payload)
    return signup_v1(payload)

# After (flag was at 100%, so v2 is the keeper):
def route_signup(payload):
    return signup_v2(payload)

# Delete signup_v1 function and its dependencies if nothing else uses them.
```

### Step 4: Remove the flag evaluation

Delete the `flags.is_enabled(...)` call. If the flag was the only thing tested, delete the wrapper function too.

### Step 5: Delete the abandoned code path

```python
# Delete signup_v1.py entirely (and its tests) if unused elsewhere.
```

This is the part teams skip — keeping "just in case." Don't. The flag history is in git. The code is dead weight.

### Step 6: Remove tests for the deleted branch

```python
# Delete:
def test_signup_v1_happy_path():
    ...
```

Keep tests for the surviving branch. Verify CI passes.

### Step 7: Delete from the flag control plane

Last. After the code change deploys, after a couple of days of confirmed health, delete the flag entry from the control plane.

This order matters: code change first, flag removal last. If you delete the flag first, your code's default value applies — which may not be what you want.

### Step 8: Update the audit log

Record the removal in your flag inventory / audit log. "Removed `growth.signup_v2.enabled` on 2026-05-27 by @alice, PR #4321."

---

## PR template for flag removal

```markdown
## Flag Removal: <flag-key>

### Why
- Flag was at <100% / 0% / unreferenced> as of <date>
- Type: <release | experiment | ops | permission>
- Owner: <team>

### What this PR does
- Removes flag evaluation in <files>
- Deletes the now-dead code path: <function/module>
- Removes tests for the dead branch: <test files>

### Risk
- [Low/Med/High] explain
- The kept branch has been the only live branch for <N> days
- Backout plan: revert this PR + re-add the flag with same default

### Confirmation
- [ ] Flag at terminal state for required duration
- [ ] All code references in this PR (`git grep` result attached)
- [ ] Deleted code paths verified unused elsewhere
- [ ] CI passes
- [ ] Flag control-plane deletion scheduled for: <date, 3+ days after merge>

### After merge
- [ ] Verify flag eval count drops to zero in monitoring
- [ ] Delete flag from control plane on <date>
- [ ] Update flag inventory
```

---

## Dead-code detection patterns

When a flag is at 100% (or 0%) for long enough, one branch becomes dead code. Spot it with:

### Static analysis

```bash
# Coverage report: which branches have ZERO coverage despite tests running?
coverage run --branch -m pytest
coverage report --show-missing

# Lines with zero hits = either untested OR dead (flag-gated and never reached)
```

### Production tracing

Add tracing to flag evaluations. If `flag.is_enabled(...) == false` is the result for 100% of traffic for 30 days, the false branch is dead in prod.

```python
def is_enabled_traced(flag_key, **context):
    result = flags.is_enabled(flag_key, **context)
    metrics.increment(f"flag.eval.{flag_key}.{result}")
    return result
```

Then dashboard: `flag.eval.<key>.false` rate. If zero for a sustained period: branch is dead in prod.

### Log analysis

For flag-gated code with logging:

```python
if flags.is_enabled("growth.signup_v2.enabled", ...):
    log.info("signup_v2_taken", user_id=user_id)
else:
    log.info("signup_v1_taken", user_id=user_id)
```

Query: `count(signup_v1_taken) for last 30 days`. If zero: v1 is dead.

---

## Removal blockers — what to do

Sometimes flag removal is blocked. Common blockers and fixes:

### Blocker: "We might need to roll back"

If the feature has been at 100% in production for 30+ days without issue, the rollback window is closed. Bugs that emerge now will need a forward-fix, not a flag flip.

Counter-argument when teammates resist: "Git can always restore the code. The flag isn't the rollback mechanism after a feature is fully live — it's just dead-weight branching."

### Blocker: "I don't have time to clean up"

Add flag removal to the original feature's "definition of done." No feature is done until the flag is removed. Track this; teams that ship a lot will accumulate debt fast otherwise.

### Blocker: "The owner left"

Reassign ownership to whoever owns the area now (using `git blame` on the surrounding code as a hint). If no one owns the area, that's a separate problem — but the flag still needs to go.

### Blocker: "We have 50 flags and don't know where to start"

Triage by category (use the audit output):
1. Unreferenced flags — delete from control plane today, zero risk
2. At 100% for > 90 days — easiest code removals
3. At 0% for > 30 days — pick one direction (ship or kill) and execute
4. Permanent-but-should-be-config — move to config
5. Active flags — leave alone, focus on the above first

Set a target: e.g., reduce flag count by 25% per quarter until healthy.

---

## Flag count as a team health metric

Track and report:

| Metric | Healthy range | Warning sign |
|--------|---------------|--------------|
| Active flags per team | < 20 | > 30 |
| Median release-flag age | < 30 days | > 60 days |
| Stale flags (cat 1-5) | < 10% of total | > 25% of total |
| Unowned flags | 0 | > 5 |
| Flags removed per quarter | ≥ flags added | < flags added |

Show these on the team dashboard. Make debt visible.

---

## Anti-patterns in cleanup

### "We'll do it next sprint"

Flag debt cleanup that's always "next sprint" is never. Schedule it explicitly, with an owner, like any other work.

### "We removed the flag but kept both code paths"

Defeats the purpose. The point of removal is dead-code elimination. If you're keeping both paths, the flag should still exist.

### "We deleted the flag from the control plane but left the code"

Now you have orphan code that evaluates a non-existent flag and silently uses the default. Worse than before. Delete the code first.

### "We removed flags in one giant PR"

A 50-flag-removal PR is unreviewable. Batch by team / area, 5-10 flags per PR.

### "We removed it but didn't update the audit log"

Hurts you 6 months later when someone asks "did we ever ship X?" and the answer is buried in git history.

---

## Year-1 to year-3 flag debt trajectories

### Healthy trajectory

Year 1: Flag count grows linearly as the team adopts flag-based shipping. Each new feature = +1 flag. Cleanup begins around month 6.

Year 2: Flag count plateaus. Adds ≈ removals. Median flag age stays under 60 days.

Year 3: Flag count is stable. Quarterly cleanup is a 1-day ritual, not a special project. Mature team.

### Unhealthy trajectory

Year 1: Flag count grows. Some cleanup happens but inconsistently.

Year 2: Flag count keeps growing. Cleanup is "always next quarter." Some flags > 1 year old.

Year 3: Hundreds of flags, half stale. Engineers afraid to touch the flag system. Bug count rises. Production toggles become risky because the team isn't sure what each flag does anymore. Eventually triggers a big-bang "flag bankruptcy" project — expensive and slow.

The cheap path is the healthy one. Make cleanup small, frequent, and visible.

---

## Cheat sheet

| Question | Action |
|----------|--------|
| Is this flag still referenced in code? | `git grep <key>` |
| Is this flag still active in production? | Check control plane current value + days at value |
| Should this flag have been removed? | At 100% for > 1 release, or at 0% > 30 days, or no owner → yes |
| What's the safe removal order? | Code change first → wait → delete from control plane |
| Did we update the audit log? | Always |
| What's our flag count trend? | Should be flat or shrinking |
