# Flag Types and Patterns

Deep reference on the four flag types, code patterns per type, evaluation context, server-vs-client trade-offs, naming conventions, and storage models. Provider-agnostic — applies to LaunchDarkly, Statsig, Unleash, Flagsmith, ConfigCat, GrowthBook, OpenFeature, and homegrown systems.

---

## The four flag types in depth

### 1. Release flags

**Purpose:** Decouple code deploy from feature release. Ship the new code paths dark, then ramp users in via flag flips.

**Lifetime:** Days to weeks. Long-lived release flags (> 90 days) are usually a sign that:
- The team is afraid to remove the old code path (technical debt accruing)
- The team is afraid to fully roll out (incomplete confidence, often signals product quality issues)
- The flag has silently become a permanent permission gate (re-type it)

**Owner:** The engineer who shipped the feature. Ownership transfers if they leave the team.

**Evaluation contexts (typical):**
- `user_id` — for stable hash-based rollout (same user always sees the same variant during a ramp)
- `country` — for regional rollout (EU before US, or vice versa)
- `account_tier` — for plan-aware rollout (paying customers first, or last)
- `internal_user_flag` — for dogfooding (employees see the new version 100%)

**Lifecycle hooks:**
- On flag creation: open removal ticket with target date
- At 100% rollout: alert flag owner to schedule removal
- At 100% + 14 days: auto-create removal PR (advanced systems do this)

**Code pattern (server-side, Python):**

```python
def get_signup_v2_enabled(user_id: str, country: str) -> bool:
    return flags.is_enabled(
        flag="growth.signup_v2.enabled",
        context={"user_id": user_id, "country": country},
        default=False,
    )

def signup_flow(user_id: str, country: str, payload: dict) -> SignupResult:
    if get_signup_v2_enabled(user_id, country):
        return signup_v2(payload)
    return signup_v1(payload)
```

**Key rules:**
- Single-purpose evaluation function. Don't inline `flags.is_enabled(...)` in business logic.
- Default value matches **old** behavior. New feature is opt-in via the flag.
- Both branches are tested in CI. Don't let the "old" path rot while the flag is at 50%.

---

### 2. Ops flags (kill switches, throttles, circuit breakers)

**Purpose:** Turn off risky behavior fast, without a deploy. Most common use: protect against external dependency failure, runaway compute cost, or pathological traffic.

**Lifetime:** Permanent or long-lived. These don't expire — they sit at "on" for years and only flip during incidents.

**Owner:** Platform / SRE team owns the flag; the dependent service team owns the fallback behavior.

**Evaluation contexts (typical):**
- None / global — most kill switches are boolean and apply to all traffic
- `region` — disable a feature in one region only (e.g., when a regional vendor is down)
- `request_route` — throttle by endpoint (disable expensive `/search` while protecting `/login`)

**Lifecycle hooks:**
- Quarterly review: confirm the kill switch still does what its name implies (kill-switch drift is common)
- After any prod flip: post-incident review documents what triggered the flip

**Code pattern:**

```python
def with_recommendations_kill_switch(user_id: str) -> List[Recommendation]:
    if not flags.is_enabled("ops.recommendations_enabled", default=True):
        return get_static_recommendations(user_id)
    try:
        return recommendations_service.fetch(user_id, timeout=200)
    except (TimeoutError, ServiceUnavailable):
        return get_static_recommendations(user_id)
```

**Key rules:**
- Default value matches **current healthy** behavior. Flipping the switch falls back to a degraded mode.
- Fallback path is tested in CI **as the primary path** sometimes. It will run in production, so it must work.
- Include the fallback latency / quality in capacity planning. The fallback should not itself overload anything.
- Kill switches and circuit breakers stack: the kill switch is the human-controlled big red button, the circuit breaker is the automated trip.

**Fail-open vs fail-closed:**

| Scenario | Fail-open (allow traffic) | Fail-closed (block) |
|----------|---------------------------|---------------------|
| Auth check | ✗ — never. Failed auth check = no access. | ✓ |
| Payment processing | ✗ — never charge or refund without verifying. | ✓ |
| Recommendations / personalization | ✓ — fall back to popular/static results | ✗ |
| Search | ✓ — fall back to keyword search if vector search down | ✗ |
| Feature flag system itself | ✓ — return defaults if flag service down | ✗ (defaults must be safe) |
| Rate limiting | Context-dependent. Open = let through, closed = deny. Usually closed for abuse, open for legitimate spikes. | Context-dependent |

Document the fail mode in the flag description and the runbook. A flag that fails the wrong way during an incident is worse than no flag at all.

---

### 3. Experiment flags

**Purpose:** Causal measurement. Show variant A to one group, variant B to another, measure the difference.

**Lifetime:** Test duration — typically 2-6 weeks, including ramp-up and statistical-power period.

**Owner:** Product manager or data scientist running the experiment.

**Evaluation contexts (typical):**
- `user_id` — hash to a stable bucket so the same user always sees the same variant
- `experiment_id` — explicit assignment from an experimentation platform
- `segment` — pre-defined cohorts (e.g., "free tier signups in last 30 days")

**Lifecycle hooks:**
- Hypothesis + sample-size calc before launch
- Pre-registered guardrails (what regression would stop the test)
- Stopping rule: hit sample size, hit time cap, or guardrail breached
- Decision recorded: ship winner, kill experiment, iterate

**Code pattern:**

```python
def get_pricing_variant(user_id: str) -> Literal["control", "discount_10", "discount_20"]:
    return flags.get_variant(
        flag="growth.pricing_test_2026_q2",
        context={"user_id": user_id},
        default="control",
    )

def render_pricing_page(user_id: str) -> Response:
    variant = get_pricing_variant(user_id)
    track("pricing_page_view", {"user_id": user_id, "variant": variant})
    if variant == "discount_10":
        return render_template("pricing.html", discount=0.10)
    if variant == "discount_20":
        return render_template("pricing.html", discount=0.20)
    return render_template("pricing.html", discount=0)
```

**Key rules:**
- Variant assignment must be stable per user for the duration of the test.
- Log the variant on every relevant event (view, click, conversion). Without this, analysis is impossible.
- Don't change the experiment definition mid-flight — that invalidates the statistical conclusion.
- After ship/kill decision, remove the flag and the losing variant's code path. Experiments that hang around become release-flag debt.

**Holdout pattern:**

For long-running features (e.g., a recommendation model), keep 1-5% of users in a permanent "no feature" group to measure the ongoing contribution. The holdout flag never goes to 100%.

---

### 4. Permission flags (entitlements)

**Purpose:** Gate features by plan, role, beta-list, or per-user opt-in.

**Lifetime:** Permanent. These are part of the product's pricing / packaging model.

**Owner:** Product, billing, or a dedicated entitlements team.

**Evaluation contexts (typical):**
- `account_id` — entitlements are usually per-account, not per-user
- `plan_id` — derived from billing system
- `role` — from auth/IAM system
- `beta_program_member` — explicit opt-in list

**Lifecycle hooks:**
- Plan/pricing change → update the flag rules
- Customer support overrides — must be logged + time-bounded
- Migration off the flag system: when permission rules harden, move them to a proper entitlements service (don't use a flag system for entitlements at scale; flag systems are optimized for low-latency boolean checks, not for paid-feature catalogs)

**Code pattern:**

```python
def can_use_advanced_analytics(account_id: str) -> bool:
    return flags.is_enabled(
        flag="entitlement.advanced_analytics",
        context={"account_id": account_id},
        default=False,
    )

@require_entitlement("advanced_analytics")
def get_cohort_analysis(account_id: str, ...):
    ...
```

**Key rules:**
- These flags don't expire — but consolidate them. Don't have 50 permission flags per plan; have one `plan_id` field driving a lookup table.
- Audit trail is critical: legal/billing implications.
- Customer-support-issued overrides need expiration. "Free trial of Pro for 30 days" should auto-revert.

**Moving off flags for entitlements:**

When you have > 10-15 permission flags, build a real entitlements service. The flag system becomes the wrong tool: you want declarative plan→feature mappings, not per-feature boolean rules.

---

## Evaluation context — the universal input

Every flag evaluation takes a **context** (sometimes called "user object", "evaluation context", "target attributes"). The schema you choose shapes what rollout strategies are possible.

### Minimum viable context

```json
{
  "user_id": "u_4f3a...",
  "account_id": "acc_b2c1...",
  "country": "DE",
  "internal": false
}
```

### Recommended context

```json
{
  "user_id": "u_4f3a...",
  "user_email_hash": "sha256:...",
  "account_id": "acc_b2c1...",
  "account_tier": "pro",
  "account_age_days": 412,
  "country": "DE",
  "region": "eu-west-1",
  "platform": "web",
  "app_version": "2.14.3",
  "internal": false,
  "beta_program": ["b_growth_2026"],
  "experiment_assignments": {"pricing_test_2026_q2": "discount_10"}
}
```

### Anti-patterns

- **PII in context.** Pass hashes, not email addresses. Most flag systems log evaluations; you don't want PII in those logs.
- **Mutable identifiers.** `session_id` is fine for analytics but unstable for rollout (user gets different variants on reload). Use `user_id` or `account_id`.
- **Computed-at-evaluation context.** If `account_age_days` is computed from a DB read on every flag evaluation, your latency budget is gone. Cache or pre-compute.
- **Context bloat.** Passing 50 attributes "just in case" makes the flag system slow and the rules unmaintainable. Pass what's needed for current rollout rules.

---

## Naming conventions

A good name tells you: type, owner, what it controls, optional ramp step.

```
<type>.<owner>.<feature>[.<step>]
```

Examples:

| Name | Type | Owner | What |
|------|------|-------|------|
| `release.growth.signup_v2.enabled` | release | growth team | New signup flow |
| `release.payments.psp_swap.dual_write` | release | payments team | Step 1 of payment provider migration |
| `release.payments.psp_swap.read_from_new` | release | payments team | Step 2 of payment provider migration |
| `ops.platform.recommendations.kill` | ops | platform | Kill switch for recs service |
| `ops.platform.search.vector_enabled` | ops | platform | Toggle vector vs keyword search |
| `experiment.growth.pricing_2026_q2` | experiment | growth | Pricing A/B test |
| `entitlement.product.advanced_analytics` | permission | product | Pro-plan analytics feature |
| `entitlement.product.api_v2_beta` | permission | product | Beta program for API v2 |

### Anti-name-patterns

- `feature_flag_42` — meaningless
- `test_flag_johndoe` — temporary debug flag that lived forever
- `new_thing` — vague, will be replaced by `newer_thing` in 6 months
- `disable_old_thing` — inverted logic, confusing; prefer positive "enable the new thing"
- All-caps Java-style `ENABLE_FOO_BAR_BAZ` — fine if your linter enforces it; don't mix conventions in one codebase

---

## Server-side vs client-side evaluation

### Server-side evaluation

The application server evaluates the flag and returns the result (or different responses) to the client.

**Pros:**
- Flag values never reach the client; competitive intel / pricing details stay private
- Rules can use server-only context (account tier, internal IP, etc.)
- Single source of truth — every request goes through the same evaluation

**Cons:**
- Adds latency (network call or in-process eval) to every request
- Client can't render different UI variants without a server round-trip

**Use when:**
- The flag controls API behavior, data returned, or pricing
- The flag depends on sensitive context (internal users, account tier)
- You want a single audit log of every evaluation

### Client-side evaluation

The client (browser / mobile app) evaluates the flag, often after fetching rules + targeting on app load.

**Pros:**
- Zero per-request latency once rules are loaded
- Client can switch UI variants without server round-trips
- Works in offline / edge scenarios

**Cons:**
- Flag rules and values are visible to anyone who inspects the app — assume **public information**
- Client out-of-sync with control plane until next refresh
- Multiple clients (web, iOS, Android) need consistent SDKs and rules

**Use when:**
- The flag controls UI only (button color, layout variant)
- The application must work offline
- You're OK with the rules being public

### Hybrid

For most production systems, use both:
- Server-side for backend-sensitive flags (payments, auth, data access)
- Client-side for UI-only flags (theme, layout, copy)
- Bridge: server sends a "feature flags this user has" payload in the initial page response, client uses it for UI variants

---

## Storage and evaluation models

### Centralized (SaaS or self-hosted flag service)

The flag service stores rules. Apps either:
- **Server SDK with local cache** — SDK polls or streams rules, evaluates locally with sub-millisecond latency. Most common.
- **Remote evaluation** — every flag check hits the flag service. Simpler, slower, requires very high flag-service availability.

### Embedded (flags in code / config files)

Flag rules ship with the binary. Changes require a deploy. Fine for very simple feature toggles, terrible for rapid rollback.

### Database-backed (homegrown)

Flag rules in Postgres/DynamoDB/Redis. App reads on every check (with cache). Works if you control eval latency and have good caching.

**Comparison table:**

| Model | Eval latency | Time-to-flip | Operational burden | When to use |
|-------|--------------|--------------|--------------------|--------------------|
| SaaS centralized + local cache | <1ms | seconds | Low | Default for most teams |
| Self-hosted (Unleash, Flagsmith) + local cache | <1ms | seconds | Medium | Compliance / cost reasons |
| Remote eval | 10-50ms | seconds | Medium | Simple, low-traffic apps |
| Embedded | <0.1ms | deploy cycle | Low | Few flags, deploy cycle acceptable |
| Database-backed homegrown | Variable | seconds (depends on cache TTL) | High | Niche; usually not justified |

---

## Logging and observability

Every flag evaluation should be observable. Minimum:

| Field | Purpose |
|-------|---------|
| `flag_key` | which flag |
| `variant` | what was returned |
| `user_id` / `account_id` | who got which variant |
| `timestamp` | when |
| `reason` | why (matched rule X, fell to default, etc.) |
| `eval_duration_ms` | for latency monitoring |

Aggregate per flag:
- Evaluation count (rate) — sudden drops indicate code path no longer reached → candidate for removal
- Variant distribution — does it match the configured rollout percentage?
- Evaluation latency p50 / p95 / p99 — catch flag service degradation

Dashboard: flag-level view + flag-system-level view. Alert on:
- Flag service error rate
- Flag service eval latency p99 above SLO
- Sudden variant distribution shift (rule mis-configured)

---

## Migration patterns — moving from no flags to flags

If you're starting from zero, don't try to flag-ize the whole codebase at once. Three-step plan:

1. **Build the foundation.** Pick a provider, wire the SDK, deploy a hello-world flag. Get observability and alerting in place. (1 sprint)
2. **Flag new work.** Every new feature ships behind a release flag. No new "deploy = release" launches. (Ongoing)
3. **Retrofit risky paths.** Identify the 5-10 highest-risk code paths (payments, auth, data writes) and add kill switches. Don't try to retrofit everything. (1-2 sprints)

After a quarter, audit: what fraction of releases went through a flag? Aim for 100% of customer-visible features.

---

## Provider feature comparison (high level, not exhaustive)

| Capability | LaunchDarkly | Statsig | Unleash | Flagsmith | ConfigCat | GrowthBook | OpenFeature |
|------------|--------------|---------|---------|-----------|-----------|------------|-------------|
| Hosted SaaS | ✓ | ✓ | ✓ (paid) | ✓ | ✓ | ✓ | n/a (spec) |
| Self-hosted | ✓ (Enterprise) | ✗ | ✓ (OSS) | ✓ (OSS) | ✓ (paid) | ✓ (OSS) | n/a |
| Experiments built-in | Partial | ✓ (strong) | Partial | Partial | ✗ | ✓ (strong) | n/a |
| Audit log | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a |
| Free tier | ✓ (small) | ✓ (generous) | ✓ (OSS) | ✓ (OSS) | ✓ (small) | ✓ (OSS) | OSS spec |
| Use as abstraction | OpenFeature provider available | OpenFeature provider available | OpenFeature provider available | OpenFeature provider available | OpenFeature provider available | OpenFeature provider available | Universal |

**Recommendation:** use the OpenFeature spec as your abstraction in code. The provider becomes a swap. This skill's patterns work with OpenFeature SDKs natively.

---

## Common questions

**Q: How many flags is too many?**
A: There's no absolute number, but per-team caps work well (e.g., "no team has > 20 active release flags"). System-wide, the metric to watch is age distribution — if median release-flag age is > 60 days, you have debt.

**Q: Should I use one flag system for all four types?**
A: For < 50 flags, yes — operational overhead of multiple systems isn't worth it. At larger scale, entitlements (type 4) often graduate to a dedicated service.

**Q: How do I test code behind a flag?**
A: Test both branches in CI. Most SDKs provide a test harness that lets you set flag values per-test. Don't rely on the prod flag system in tests.

**Q: Can I use flags for incident rollback?**
A: Only if the flag was added before the incident. Adding a flag mid-incident is too late — you'd be deploying new code during a fire. The point of flags is that the flip is instant and codeless.

**Q: How do I handle flag system outages?**
A: Defaults. Every flag evaluation in your code passes a default value (matching old/safe behavior). If the flag system is unavailable, defaults apply, and the system degrades to "no new features rolled out" — survivable.

---

## Summary cheatsheet

| Question | Answer |
|----------|--------|
| What type is this flag? | Release / Ops / Experiment / Permission — one only |
| What's the default value? | Matches the old / safe behavior |
| Who owns it? | Named person or team |
| When will it be removed? | Specific date or trigger — never "TBD" |
| Who can flip it? | Per the governance matrix |
| What's the rollout plan? | Use `scripts/rollout_simulator.py` |
| What happens if the flag service is down? | Defaults apply — verified safe |
| How will we observe it? | Eval count + variant distribution per flag |
| What's the cleanup trigger? | 100% for 1 release (release), winner shipped (experiment), code removed (permission consolidated), incident retired (ops) |
