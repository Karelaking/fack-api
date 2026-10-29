# Rollout and Kill Switch Playbook

Operational reference for ramping a feature behind a flag, computing blast radius before each step, designing kill switches that actually work, and wiring monitoring/alerting so flag flips don't go unobserved.

---

## The rollout decision tree

Before touching a flag in production, answer:

```
1. What's the worst case if this is fully wrong?
   - User sees broken UI → light-touch rollout
   - User can't complete core action (signup, checkout) → standard
   - User loses data, or data corrupted → conservative + dual-write
   - Money moved incorrectly → conservative + canary cohorts you can refund
   - Compliance / legal violation → don't ramp on prod; staging-only until audited

2. Can you detect a regression?
   - In seconds via metrics → fast ramp OK
   - In minutes via metrics → standard ramp
   - Only after customer reports → slow ramp + active monitoring
   - Only at month-end (billing, batch jobs) → don't ramp on real money

3. Can you roll back instantly?
   - Yes, flag flip with no DB changes → fast ramp OK
   - Yes, but some writes happened → standard, plan for cleanup
   - Partial — some side effects irreversible → conservative + cohort-based
   - No → don't put it behind a flag; build a migration with explicit cutover

4. How big is the blast radius?
   - Single user → ramp on yourself first
   - Single team/account → use account-scoped rollout, not %
   - Geographic → ramp by country
   - All users → use ramp profile below
```

---

## Ramp profiles by change type

### Aggressive ramp (UI / cosmetic / additive)

**Use when:** UI change, additive feature, no backend change, low business impact

```
T+0h:    Dogfood (internal users)
T+2h:    1% production
T+6h:    10% production
T+12h:   50% production
T+24h:   100% production
T+48h:   Schedule flag removal
```

**Watch:** Frontend error rate, page load time, CSS regression reports.

### Standard ramp (new feature, backend changes, customer-visible)

**Use when:** Standard new feature with backend logic, dual code paths, normal risk

```
Day 0:     Dogfood (internal + alpha testers)
Day 1-2:   1% production
Day 3-4:   5%
Day 5-7:   25%
Day 8-10:  50%
Day 11-14: 100%
Day 15+:   Observation
Day 21:    Remove flag
```

**Watch:** Application error rate, latency p99, business KPI (conversion, retention), cost metrics, support ticket volume.

### Cautious ramp (backend migration with dual-write)

**Use when:** Replacing a backend system, migrating data, dual-write strategy

```
Week 1: Dual-write enabled. Read from old. Compare writes for drift.
Week 2: Read from new for 1% (with shadow-read from old + compare)
Week 3: Read from new for 10%
Week 4: Read from new for 50%
Week 5: Read from new for 100%
Week 6: Stop writing to old
Week 7: Verify quiescence
Week 8: Decommission old
```

**Watch:** Write drift between systems, read consistency, query latency, error rates split by old/new path.

### Conservative ramp (schema change, irreversible writes, money)

**Use when:** Operations that can't be undone — billing, compliance-recorded events, irrevocable state changes

```
Week 1-2: Internal accounts only. Manual audit of every write.
Week 3-4: 10 designated "audit cohort" accounts.
Week 5-6: 1% of accounts, by explicit allowlist (not random)
Week 7-8: 10% of accounts, segmented by tier (free first)
Week 9-10: 50% of accounts, by region
Week 11-12: 100%
```

**Critical:** Use explicit cohort lists, not random percentages. You must be able to enumerate exactly which accounts were affected by which version, in case of a reversal.

### Phased ramp (third-party dependency swap)

**Use when:** Swapping a payment provider, SSO vendor, observability vendor, CDN

```
Phase 1: Internal traffic only
Phase 2: 1 small customer (with explicit consent)
Phase 3: Free-tier accounts in one region
Phase 4: Free-tier accounts globally
Phase 5: SMB tier
Phase 6: Enterprise tier (with notice + opt-out)
Phase 7: Decommission old vendor
```

**Watch:** Failed call rate, latency, error class distribution, customer escalations. Be ready to revert the entire phase, not just incrementally.

---

## Blast radius math

Before each ramp step, compute the expected impact of a regression.

### Inputs

| Input | Symbol | Source |
|-------|--------|--------|
| Total users | `N` | Analytics / data warehouse |
| % at this step | `p` | Flag rule |
| Sessions per user per day | `s` | Analytics |
| Time to detect (minutes) | `t_d` | SLO / monitoring config |
| Time to mitigate (minutes) | `t_m` | Runbook estimate |
| Severity (sessions impacted = bad) | `S` | Per-step decision |

### Formula

```
exposed_users_per_step = N × p
sessions_at_risk = exposed_users_per_step × s × (t_d + t_m) / 1440
```

(1440 = minutes in a day; this gives sessions during the detect+mitigate window.)

### Example

System with 10M users, ramping a payment-page change.

| Step | p | exposed_users | sessions | If broken, sessions affected before mitigation (t_d=5min, t_m=10min) |
|------|---|---------------|----------|----------------------------------------------------------------------|
| 1%   | 0.01 | 100,000 | 200,000/day | ~2,083 sessions in 15 min |
| 10%  | 0.10 | 1,000,000 | 2,000,000/day | ~20,833 sessions |
| 50%  | 0.50 | 5,000,000 | 10,000,000/day | ~104,167 sessions |
| 100% | 1.0 | 10,000,000 | 20,000,000/day | ~208,333 sessions |

Use this to decide: can you tolerate 2,083 broken sessions to learn at 1%? Probably yes. Can you tolerate 100k? Probably not — extend hold time, improve detection, or shrink steps.

`scripts/rollout_simulator.py` does this calculation for you and outputs a recommended ramp schedule.

---

## Monitoring during a ramp

For every ramp step, define **stop conditions** before increasing %. Each metric has a threshold; if any breaches, ramp halts and the team investigates.

### Standard stop conditions (template)

| Metric | Baseline | Stop threshold | Window |
|--------|----------|----------------|--------|
| HTTP 5xx rate | <0.1% | >0.3% on flagged path | 5 min |
| p99 latency | 200ms | >400ms on flagged path | 10 min |
| Error log volume | 100/min | >2× baseline | 5 min |
| Business KPI (conversion) | 12% | <11% sustained | 1h |
| Cost per request | $0.0001 | >2× | 30 min |
| Support tickets tagged "<feature>" | 0 | >5 in an hour | 1h |

### Variant-aware metrics

Split every metric by flag variant. A metric that looks fine in aggregate can hide a 5x regression in the 1% variant. Most monitoring tools (Datadog, Prometheus + tags, Honeycomb) support this natively if you tag your metrics with the flag variant.

### Pre-ramp checklist

Before flipping the next step, verify:

- [ ] Previous step's hold time elapsed
- [ ] All stop conditions green for the full hold window
- [ ] No active incident on the system
- [ ] Owner is online and watching
- [ ] Runbook for rollback is current

If any answer is "no", don't ramp.

---

## Kill switch design — full spec

### Anatomy of a kill switch

```
Flag name:        ops.<team>.<dependency>.kill_switch
Default state:    ON (feature enabled)
Type:             ops
Owner:            <team>
Page rotation:    <pagerduty rotation>
Runbook URL:      <wiki link>
Fail mode:        open / closed
```

### The five-question test

A kill switch is well-designed if you can answer all five:

1. **What does flipping it do?** Clear, one-sentence description. ("Disables vector search; falls back to keyword search.")
2. **What's the degraded mode?** What does the user experience? ("Search still works but ranking is less accurate; latency drops 30ms.")
3. **What metrics will tell us it worked?** ("Vector-search call rate drops to 0; keyword-search rate increases by ~95%; user-perceived latency drops.")
4. **Who can flip it without paging the owner?** ("Anyone in #oncall + the runbook link.")
5. **How will we know to unflip it?** ("Original dependency healthy for 30 minutes per /health endpoint; manually verified by SRE-on-call.")

If you can't answer all five, the kill switch is incomplete.

### Kill switch placement

A kill switch should sit at the boundary of a single, replaceable code path:

```python
# GOOD: kill switch wraps the entire feature, single entry point
def get_recommendations(user_id):
    if not flags.is_enabled("ops.recs.kill_switch", default=True):
        return get_static_recommendations(user_id)
    return recommendations_service.fetch(user_id)

# BAD: kill switch wraps a tiny part, leaves the rest exposed
def get_recommendations(user_id):
    results = recommendations_service.fetch(user_id)
    if flags.is_enabled("ops.recs.rerank_kill", default=True):
        return rerank(results)
    return results  # still vulnerable if upstream fetch fails
```

### Testing the kill switch

A kill switch that's never tested is no kill switch. Test it:

- **In staging, monthly.** Flip the switch, verify fallback works, flip back.
- **In production, quarterly.** Flip during a low-traffic window, watch metrics, flip back within 15 minutes. (Some orgs do this as a chaos exercise.)
- **In CI, every commit.** Both flag states run through the test suite.

### Common kill switch failure modes

| Failure | Cause | Mitigation |
|---------|-------|------------|
| Switch flipped, but feature still runs | Cached client SDK didn't refresh | Force SDK refresh; check SDK version / cache TTL |
| Switch flipped, fallback also broken | Fallback never tested in prod-like conditions | Quarterly fallback tests; CI runs fallback path |
| Switch flipped, but new traffic still hits old code | Rolling deploy in progress; old pods still using old default | Wait for rollout to settle; ensure all pods see new flag |
| Switch flipped, but it controls the wrong thing | Flag drift — name no longer matches behavior | Quarterly kill switch review; rename or refactor |
| Switch can't be flipped — control plane down | Single point of failure | Multi-region flag service; fallback to embedded defaults |

---

## Cohort-based rollout (for irreversible changes)

For changes you can't randomly sample (billing changes, schema migrations, irrevocable events), use named cohorts.

### Cohort design

| Cohort | Why | Size |
|--------|-----|------|
| Internal | Employees, can be told what to do | Whatever your headcount is |
| Audit | Hand-picked test accounts you control end-to-end | 10-50 |
| Friendly customers | Customers who've consented to early access | 100-1000 |
| Free tier | Lower-stakes population | Whatever fraction makes sense |
| SMB | Middle tier | n/a |
| Enterprise | Highest stakes, opt-in only | n/a |

### Cohort flag rule

```json
{
  "flag": "release.billing.new_invoice_model",
  "rules": [
    {"if": "account.cohort == 'internal'", "value": true},
    {"if": "account.cohort == 'audit'", "value": true},
    {"if": "account.cohort == 'friendly' and now > '2026-06-01'", "value": true},
    {"if": "account.tier == 'free' and now > '2026-06-15'", "value": true},
    {"if": "account.tier == 'smb' and now > '2026-07-01'", "value": true},
    {"if": "account.tier == 'enterprise' and account.opted_in", "value": true},
    {"default": false}
  ]
}
```

### Why not percentage?

A random 1% selection means you can't tell a customer support escalation "you're on the new system" — you don't know who's on it. Cohorts give you:

- Exact list of affected accounts (for support, audit, refund)
- Reversibility — you know who to revert
- Predictable comms — you can notify the cohort before, during, after

---

## Rollback procedure

### Standard rollback (release flag)

1. Detect regression (alert or report)
2. Verify it's flag-related (not a coincident deploy / infra issue)
3. Flip flag to previous % (last good state)
4. Confirm recovery in metrics within 5-15 minutes
5. Log the flip in incident channel with timestamp
6. Continue incident response — root cause, fix, retry

### Rollback for cohort-based release

If you've ramped via cohorts, rollback = remove the cohort from the rule, not flip to 0%:

```json
// During incident:
{
  "rules": [
    {"if": "account.cohort == 'internal'", "value": true},
    {"if": "account.cohort == 'audit'", "value": true},
    // remove the broken cohort:
    // {"if": "account.tier == 'free' and now > '2026-06-15'", "value": true},
    {"default": false}
  ]
}
```

This keeps internal/audit cohorts on the new code so the team can keep debugging while customers fall back.

### Rollback when dual-write was in flight

If you're mid-migration and need to roll back:

1. Stop writing to new system (flip dual-write flag off)
2. Confirm all writes going to old system only
3. Identify drift accumulated during dual-write window — script reconciliation
4. Plan re-migration with the bug fixed

Don't try to "fix forward" if the bug is in the write path — accumulated bad data is hard to remediate.

---

## Wiring alerting for flag flips

Every prod flag flip should generate an event in your monitoring system. Best practice:

1. **Webhook from flag system to monitoring/event-bus** on every change in prod
2. **Tag with**: flag name, who flipped, old → new value, environment
3. **Show on dashboards**: overlay flag flips on metric graphs (so you can correlate)
4. **Alert on**: any flip of an `ops` flag in prod (kill switch use = incident in progress)
5. **Alert on**: any flip of an `entitlement` flag (legal/billing implication)
6. **Don't alert on**: release flag ramp steps (too noisy, expected)

### Slack / chatops integration

Common pattern: flag flip → bot posts to `#flags-prod` channel:

```
@growth.eng flipped release.growth.signup_v2.enabled
  from 5% → 25%
  reason: "metrics green at 5%, advancing per plan"
  ticket: GROWTH-1234
```

Searchable, auditable, low-friction.

---

## Anti-patterns specific to rollouts

### "We'll just ramp slower next time"

After an incident, the impulse is to be more cautious. Don't extend ramp time without changing the underlying problem. If you couldn't detect the regression at 1%, you won't detect it any better at 0.1% — fix detection.

### "Ramp by deploying to fewer pods"

Some teams use canary deploys instead of flags. Both have a role — but canary deploys are coarse (everyone on those pods sees the new code), don't allow per-user targeting, and don't allow rollback without redeploy. Use flags where you need user-level control.

### "100% in one step after passing 10%"

Tempting after a smooth ramp, but skips the highest-traffic step. The jump from 10% → 100% might still surface issues that only appear at full load. Use 50% as a real waypoint.

### "Skipping the canary because the change is small"

The change isn't the only thing that can break. Code paths interact. Skip the 1% canary only if you have an exceptional reason (e.g., security fix that must roll fast).

### "Flag the test in the test code"

Don't read prod flags from test fixtures. Tests should run both branches deterministically. Most SDKs ship a test harness — use it.

---

## Runbook template (kill switch)

```markdown
# Runbook: <feature> Kill Switch

## Flag
- Name: `<flag-name>`
- Type: ops
- Default: ON (feature enabled)
- Fail mode: <open|closed>

## When to flip OFF
- <symptom 1, e.g. "Recommendations API error rate > 10%">
- <symptom 2>
- <upstream dependency outage>

## How to flip
1. Open flag console: <URL>
2. Set `<flag-name>` to OFF
3. Add justification: "Incident <INC-ID> — flipping per runbook"
4. Save

## Expected behavior after flip
- <metric 1 expected change>
- <metric 2 expected change>
- User experience: <description>

## Validation
- Confirm <metric> drops to <value> within 2 minutes
- Confirm fallback path active via <log query / metric>
- If validation fails, escalate to <oncall name>

## When to flip back ON
- <recovery condition 1>
- <recovery condition 2>
- Confirmation by oncall lead

## Post-flip actions
- File incident report
- Schedule blameless post-mortem within 5 business days
- Update this runbook if procedure differed from documented
```

Generate runbooks per flag with `scripts/kill_switch_runbook.py`.

---

## Summary

| Phase | What to do | Tool |
|-------|-----------|------|
| Plan | Pick ramp profile, compute blast radius, define stop conditions | `rollout_simulator.py` |
| Execute | Flip per schedule, watch metrics, halt on threshold breach | Flag console + dashboard |
| Defend | Kill switches on all risky paths, runbooks attached, tested quarterly | `kill_switch_runbook.py` |
| Recover | Flag-based rollback, cohort-aware, post-incident review | Incident channel + flag log |
| Clean up | Remove flag at 100% + 1 release | `flag_audit.py` |
