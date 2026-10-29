# Principles, Maturity Model & Experiment Design Loop

Read this when running the chaos discipline end to end: applying the five principles, placing a team on the maturity model, executing the nine-step experiment design loop, or picking the first five experiments for a new program.

## The chaos engineering principles (Principles of Chaos, applied)

Five principles drive every experiment. Skip one and you're not doing chaos engineering — you're either generating noise or producing false confidence.

1. **Define steady state.** What's "normal" for the system? Measured quantitatively (RPS, error rate, latency, conversion). If you can't define it, you can't detect deviation.
2. **Hypothesize that steady state continues under the perturbation.** "If we kill one of the three recommendation pods, P99 latency stays within +50ms of baseline." Specific, falsifiable.
3. **Inject real-world events.** Things that actually happen: a node dies, a network partition, a DNS lookup fails, a downstream API returns 503, a disk fills up.
4. **Run in production (eventually).** Staging chaos finds staging bugs. Many critical failures only show up at production scale, with production traffic. Start in staging; graduate carefully.
5. **Minimize blast radius.** Constrain the experiment so a wrong hypothesis costs you minimum users / requests / dollars. Use `scripts/blast_radius_calculator.py`.

A chaos engineer's job is to find the gap between the hypothesis and reality. The interesting result is "hypothesis disproven" — that's where you learn.

## Chaos maturity model

Four levels. Most teams should target Level 2-3; only mature organizations need Level 4.

| Level | What it looks like | Frequency | Risk tolerance |
|-------|---------------------|-----------|----------------|
| **L0 — None** | Ad-hoc "let's see what happens" exercises, no method | Random | n/a |
| **L1 — Manual, staging** | Hand-run scripts in staging, before-after observation, post-it learnings | Quarterly | Low — staging only |
| **L2 — Automated, staging** | Tooling (Chaos Mesh / Litmus / homegrown) running scheduled experiments in staging, results captured | Weekly to daily | Low |
| **L3 — Production, scheduled** | Targeted production experiments during low-traffic windows, with explicit blast-radius limits and auto-rollback | Weekly | Medium — controlled |
| **L4 — Production, continuous** | Always-on chaos (e.g., Chaos Monkey) in prod; system designed so loss of components is non-events | Continuous | High — by design |

See [chaos-principles-and-maturity.md](chaos-principles-and-maturity.md) for the per-level scorecard, the "first five experiments" list every L0→L1 team should run, and the org/SRE prerequisites for each level.

## The experiment design loop

Every chaos experiment follows this loop. Skipping a step usually means the result is unactionable.

```
1. Define steady state    → quantitative metrics defining "normal"
2. Form hypothesis        → specific, falsifiable prediction
3. Pick variables         → what to vary (one at a time, ideally)
4. Compute blast radius   → who/what is affected; cap the impact
5. Define abort criteria  → when to halt early
6. Run                    → inject; observe; record
7. Analyze                → was hypothesis confirmed or disproven?
8. Act                    → file fixes, update runbooks, retire experiment OR keep it
9. Document               → permanent artifact for future engineers
```

### Step 1: Define steady state

**Bad:** "The service is healthy."
**Good:**
```
SLOs:
  - 99.5% of /search requests return 2xx
  - P95 latency < 200ms
  - P99 latency < 500ms
KPIs:
  - Conversion rate stable within 10% of 7-day MA
  - Active user count stable within 5%
```

If your monitoring can't quantify steady state for the target service, that's your real first problem. Pause chaos; build observability first.

### Step 2: Form a hypothesis

| Bad hypothesis | Good hypothesis |
|----------------|-----------------|
| "Things will be fine if we kill a pod" | "If we kill 1 of 6 search pods, P95 latency stays under 250ms and error rate stays under 0.6% for the duration of the experiment (max 10 min)" |
| "The fallback works" | "If we block all outbound calls to the recommendations service for 5 minutes, the homepage continues to render with static recommendations, and error rate on /home stays under 0.2%" |
| "We can survive a region outage" | "If we fail over from us-east-1 to us-west-2, the failover completes in under 60 seconds, with < 0.5% requests dropped during the cutover and zero data loss" |

A good hypothesis names: the perturbation, the expected outcome, the measurable threshold, the time bound.

### Step 3: Pick variables

Vary one thing at a time when possible. If you inject network latency AND kill a pod simultaneously and the system breaks, you don't know which fault caused it.

Common variables:
- Pod / instance / VM (kill, pause, network-isolate)
- Network (latency, packet loss, partition, bandwidth limit)
- Dependency (block, slow, return error, return malformed response)
- Resource (CPU pressure, memory pressure, disk full, IO throttle)
- State (corrupt cache, expire all tokens, clock skew)
- Traffic (10x spike, replay attack pattern, slowloris)

See [fault-injection-catalog.md](fault-injection-catalog.md) for the full catalog per layer with tool mappings (Chaos Mesh / Litmus / AWS FIS / Gremlin / ChaosToolkit).

### Step 4: Compute blast radius

Use `scripts/blast_radius_calculator.py` with inputs: total users / traffic, % targeted, duration, expected fallback. Output: worst-case affected users, recommended caps, abort-trigger thresholds.

Key rule: blast radius starts tiny and grows only after each level passes. First run of any experiment: 1 pod / 1% of traffic / 1 minute / one region. Expand from there.

### Step 5: Define abort criteria

Before running, write down: at what metric value do we halt the experiment?

```yaml
abort_if:
  - error_rate_for_target > 5%
  - p99_latency_for_target > 1000ms
  - any_dependent_service_alerting
  - on-call_says_so
abort_method:
  - automatic (kill the chaos tool)
  - manual (stop button in the dashboard)
duration_cap: 10 minutes
```

If your abort can't fire in < 30 seconds, the blast radius is too big.

### Step 6: Run

Run during a window with:
- The owner team online and watching
- Active monitoring dashboards open
- Communication channel open (Slack thread for the experiment)
- The abort mechanism tested and at the ready
- An explicit "GO" call by the experiment lead

Record: start time, end time, what was actually injected, all metrics during the window.

### Step 7: Analyze

After the experiment ends, answer:

- Did the hypothesis hold? (yes / no / partial)
- What unexpected behavior did we see?
- What didn't we measure that we wish we had?
- What was the actual blast radius vs. predicted?
- Did the system recover to steady state, and how long did that take?

### Step 8: Act

Each finding generates an action:

| Finding | Action |
|---------|--------|
| Hypothesis confirmed, system resilient | Document; consider expanding blast radius next time; consider Level-up |
| Hypothesis confirmed, system degraded acceptably | Document the degraded-mode behavior; ensure runbook reflects it |
| Hypothesis disproven, real bug found | File P-level bug; chaos experiment becomes regression test |
| Hypothesis disproven, missing instrumentation | File observability task; rerun chaos after adding |
| Hypothesis disproven, fallback broken | Fix fallback; retest; until then, add kill switch on the upstream |

### Step 9: Document

Permanent artifact: experiment name, hypothesis, blast radius, results, actions taken, link to ticket(s), date last run. This is your chaos test catalog — without it, every experiment is one-off.

## First five experiments (for an L0/L1 team)

Run these in staging, in order, before attempting anything in production:

1. **Kill one pod of a stateless service.** Hypothesis: service continues serving traffic with under 2× latency increase for < 30 seconds. Tool: `kubectl delete pod`.
2. **Inject 200ms network latency between service A and service B.** Hypothesis: end-to-end latency increases by ≤ 200ms; no errors. Tool: Chaos Mesh / `tc qdisc`.
3. **Block all outbound network from a service** for 60 seconds. Hypothesis: service either returns degraded responses (caches, fallbacks) or fails fast with a clear error. Tool: Chaos Mesh NetworkChaos.
4. **Fill the disk** of a writeable service to 95%. Hypothesis: service rejects new writes gracefully; alerting fires; no data corruption. Tool: `dd if=/dev/zero of=/var/tmp/fill bs=1M count=...`
5. **Spike traffic 5x** for 5 minutes against the search endpoint. Hypothesis: autoscaling kicks in within 90 seconds; latency stays under SLO; no errors > 1%. Tool: load generator (k6 / Locust / Vegeta).

Each experiment generates its own artifact (hypothesis + result + action items) and starts the team's catalog.
