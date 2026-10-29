# Chaos Principles and Maturity Model

Deep reference on the five Principles of Chaos as applied in practice, the four-level maturity model, level-up criteria, "first five experiments" every L0/L1 team runs, and the org/SRE prerequisites for each level.

---

## The five principles of chaos engineering

### Principle 1: Build a hypothesis around steady-state behavior

A chaos experiment is a falsifiable scientific experiment. Steady state is the null hypothesis — what's happening when nothing is wrong.

**Quantify steady state in three categories:**

| Category | Examples | Source |
|----------|----------|--------|
| **System** | RPS, error rate, latency p50/p95/p99, queue depth | Monitoring / APM |
| **Business** | conversion rate, signups, transactions per hour, revenue per minute | Analytics / data warehouse |
| **User** | active sessions, error reports, support tickets | Frontend / support |

A team that can't define steady state in quantitative, time-series terms has an observability problem, not a chaos problem. Fix that first.

**Sanity check:** if someone wakes you at 3am and asks "is the system healthy?", you should be able to point at 3-5 numbers and say yes or no.

### Principle 2: Vary real-world events

The faults you inject should resemble what actually happens. From most-common to least-common:

| Fault | How often (typical) | Why it matters |
|-------|---------------------|----------------|
| Single instance/pod dies | Daily | Auto-scaling groups handle this routinely; but interactions can surprise |
| Network latency spike | Multiple times per day | Slow networks affect timeouts, retries, queue depth |
| Dependency slow/error | Multiple times per day | Upstream variance is the norm, not the exception |
| Disk fills / IO throttle | Weekly | Logs, caches, queues fill in interesting ways |
| Single AZ degraded | Monthly | AZ-level events test cross-AZ assumptions |
| Cache flush / clear | Weekly to monthly | Cold-cache behavior is often pessimal |
| Clock skew | Quarterly | TLS, JWT, distributed coordination all rely on time |
| Full region outage | Yearly | Test multi-region recovery posture |
| Bad data injection | Quarterly | Validates data quality, idempotency, dead-letter handling |

Don't inject "destroy the universe." Inject "AZ went bad for 5 minutes."

### Principle 3: Run experiments in production

Production has real traffic, real data, real user expectations. Staging chaos finds staging bugs. To find production bugs, you must (eventually) experiment in production.

**This is graduated, not all-at-once:**

```
L1: Staging only
L2: Staging + production canary cells (1% of users / 1 pod)
L3: Production with controlled blast radius (1-5% of users / brief duration)
L4: Continuous production chaos as system property
```

Don't skip levels. A team that goes from L0 to L3 will cause an incident; the incident will set chaos back by years.

### Principle 4: Automate experiments to run continuously

Manual experiments find issues once. Automated experiments find regressions. Both are valuable, but the discipline scales only with automation.

Automation tiers:

| Tier | What's automated | Effort |
|------|------------------|--------|
| 0 | Nothing | n/a |
| 1 | Scripts to inject + observe (no scheduling) | 1-2 sprints |
| 2 | Scheduled chaos in staging, results captured | 1-2 quarters |
| 3 | Scheduled chaos in production canary | 2-3 quarters |
| 4 | Continuous chaos as a property of the system; system designed assuming partial loss | Year-plus |

### Principle 5: Minimize blast radius

A chaos experiment that takes down 100% of users isn't an experiment, it's an outage. The discipline of chaos is **maximizing learning per unit of user impact**.

**Heuristics:**
- Start with 1 instance / 1% of traffic / 1 minute
- Increase only after the prior level passes cleanly
- Always have an abort mechanism that fires in < 30 seconds
- Pre-define the "we halt" thresholds; don't reason in the moment

Use `scripts/blast_radius_calculator.py` to compute worst-case impact before the run.

---

## Maturity model — the four levels

### Level 0 — None

**What:** No chaos practice. Ad-hoc "let's restart this service and see" exercises.

**Symptoms:** Outages reveal predictable surprises ("we didn't realize that service couldn't restart cleanly"). Runbooks are written from memory after incidents, not exercised before.

**Move to L1 by:** Pick one service, one fault type, one staging environment. Run the first experiment from the "first five" list below. Write up the result.

### Level 1 — Manual, staging only

**What:** Engineer-driven experiments in staging. Documented, not automated. Quarterly or post-incident cadence.

**Prerequisites:**
- A staging environment representative enough that staging-side findings predict prod
- Basic observability (request rates, error rates, latencies)
- A team norm that "we will run chaos on our service"

**Typical activities:**
- Run 1-2 experiments per service per quarter
- Document hypothesis + result in a shared place
- Gameday once or twice a year per team

**Level-up to L2 when:**
- The team has run 10+ documented experiments without a major incident
- Tooling friction is what's preventing more frequent runs (i.e., you've outgrown manual)

### Level 2 — Automated, staging only

**What:** Chaos tooling running scheduled experiments in staging. Results captured in dashboards or reports. Engineers consult before deploying high-risk changes.

**Prerequisites (in addition to L1):**
- A chaos tool selected and deployed (Chaos Mesh, Litmus, ChaosToolkit, AWS FIS in non-prod, etc.)
- A way to capture and review results (could be Grafana dashboard + Confluence page)
- A team norm that "chaos failures block deploys" or at least "chaos failures get triaged"

**Typical activities:**
- Daily or weekly scheduled experiments per service
- Failures generate tickets automatically
- Quarterly gamedays escalate from "one scenario" to "full afternoon, three scenarios"

**Level-up to L3 when:**
- Staging experiments aren't finding new issues (they all pass, or pass after the first few runs)
- You have confidence that the next class of issues only appears in production
- Org has explicit risk acceptance for prod chaos with controls

### Level 3 — Production, scheduled

**What:** Targeted production experiments during low-traffic windows, with explicit blast-radius limits, auto-rollback, and observer rotation.

**Prerequisites (in addition to L2):**
- Production chaos approved by leadership in writing
- Customer comms / incident-response process informed
- Auto-rollback mechanism tested
- Blast-radius caps published per experiment type
- Monitoring with alerting that distinguishes chaos from real incidents

**Typical activities:**
- Weekly production chaos in a small canary cell or region
- Quarterly multi-team gamedays in production
- Chaos failures are P-level incidents with full process

**Level-up to L4 when:**
- The system has been redesigned assuming partial loss of components
- The team is comfortable with the idea that random kill events should be non-events

### Level 4 — Production, continuous

**What:** Chaos is a property of the system. Random instance termination, random network blips, random AZ degradation occur continuously by design. The system survives because it's built to.

**Prerequisites (in addition to L3):**
- Stateless service tier with auto-recovery in seconds
- Multi-AZ / multi-region by default for stateful tier
- Mature SRE practice with explicit error budgets
- Engineering culture that treats "service died and was replaced in 30 seconds" as normal

**Typical activities:**
- Continuous chaos (e.g., Chaos Monkey style) running 24/7
- Periodic "Disaster Day" exercises: kill an entire region, see what happens
- Chaos investment is part of every service's CI

---

## "First five experiments" — for an L0/L1 team

Run each in staging, in order. Don't move to the next until the prior one is documented with a clear pass.

### Experiment 1: Kill one pod of a stateless service

**Why first:** Lowest blast radius, highest probability of clean result. Validates that auto-recovery actually works.

**Steady state:** Service's normal error rate (< 0.1% typical), p99 latency (< 200ms typical).
**Hypothesis:** Killing one pod (of N replicas) causes < 30s of elevated latency (within 2× baseline), error rate stays < 0.5%, replacement pod is healthy within 60s.
**Variable:** Number of pods killed (start with 1).
**Blast radius:** 1 pod out of (typically) 3-10 replicas.
**Abort:** Error rate > 5% for > 60s.
**Tool:** `kubectl delete pod <pod>` (or via Chaos Mesh PodChaos).

**Common findings:**
- Auto-recovery works but takes 90s instead of expected 30s (HPA cool-down + slow start)
- Connection pool on caller doesn't refresh; new pod starts but old connections stick to dead one
- One pod dying causes thundering-herd retry from callers

### Experiment 2: Inject network latency between two services

**Why second:** Tests timeout configuration and retry behavior — almost always wrong on the first chaos run.

**Steady state:** End-to-end latency for the relevant request path.
**Hypothesis:** Adding 200ms of latency between A and B increases p99 latency by ≤ 250ms, doesn't trigger timeouts, doesn't cause cascading retries.
**Variable:** Injected latency (200ms, 500ms, 1000ms).
**Blast radius:** Affects all traffic between A and B during the experiment.
**Abort:** Timeouts > 0.5%, retry count > 2× baseline.
**Tool:** Chaos Mesh NetworkChaos, `tc qdisc add ... netem delay`.

**Common findings:**
- Caller times out at 500ms because of forgotten default; should be tuned
- Retry storm cascades when latency triggers timeout
- Downstream behaves fine but upstream queue fills up

### Experiment 3: Block all outbound network from a service for 60 seconds

**Why third:** Tests fallback behavior — does the service degrade gracefully or hard-fail?

**Steady state:** Service's request success rate.
**Hypothesis:** With network blocked, the service either (a) uses cached data and returns success, or (b) returns fast errors with retry-after headers, instead of hanging.
**Variable:** Duration of network block.
**Blast radius:** Service is fully isolated for the experiment duration.
**Abort:** Stuck connections > 100, OOM signals.
**Tool:** Chaos Mesh NetworkChaos partition mode, iptables, security group changes.

**Common findings:**
- Service hangs because of missing connection timeouts
- Cache TTL is shorter than the experiment, fallback degrades over time
- Health check still says "healthy" even though service is fully isolated

### Experiment 4: Fill the disk of a writeable service to 95%

**Why fourth:** Disk-full is a high-probability real-world fault that breaks in surprising ways (logs lost, transactions hang, processes crash).

**Steady state:** Write success rate, log volume, error rate.
**Hypothesis:** At 95% disk: writes start failing gracefully (4xx), alerts fire within 1 minute, logs continue to be written (or rotated), no data corruption.
**Variable:** Disk fill level (90%, 95%, 98%).
**Blast radius:** One instance, one disk volume.
**Abort:** Process crash, system unresponsive.
**Tool:** `dd if=/dev/zero of=/var/tmp/fill bs=1M count=...` or Chaos Mesh IOChaos / StressChaos.

**Common findings:**
- App crashes instead of failing writes gracefully
- Logs are lost because logger holds file handle to /var/log which is full
- Alert fires only at 100%, by which time recovery is harder

### Experiment 5: Spike traffic 5x for 5 minutes

**Why fifth:** Tests autoscaling, queueing, fairness, and cost behavior under sustained load.

**Steady state:** Request rate, latency, autoscaler instance count, cost per request.
**Hypothesis:** With 5× traffic for 5 min: autoscaler adds capacity in < 90s, latency stays under SLO, error rate stays under 1%, costs return to baseline within 10 min after spike ends.
**Variable:** Traffic multiplier (3×, 5×, 10×).
**Blast radius:** Synthetic traffic only (don't replay real user requests).
**Abort:** Real-user error rate exceeds 1% (synthetic traffic affecting real users).
**Tool:** k6, Locust, Vegeta, JMeter.

**Common findings:**
- Autoscaler doesn't scale fast enough; latency spikes; users error
- Downstream service throttles incoming requests; upstream queues fill
- Cost spike persists because instances don't scale down for an hour

---

## Per-level scorecard

Use this checklist to assess current maturity and target the next level.

### Level 1 ready?

- [ ] Team has identified one service to start with
- [ ] Staging environment exists and is representative
- [ ] Observability for that service includes error rate, latency p95/p99, request rate
- [ ] One engineer is named as "chaos lead" for the practice
- [ ] First experiment scheduled

### Level 2 ready?

- [ ] L1 ✓
- [ ] At least 10 experiments documented in the team's catalog
- [ ] No major incident attributable to chaos in the past quarter
- [ ] Chaos tool deployed and integrated with observability
- [ ] Experiment results dashboard exists (anyone can see latest runs)
- [ ] Quarterly gameday in calendar

### Level 3 ready?

- [ ] L2 ✓
- [ ] Production chaos approved by Eng leadership in writing
- [ ] Blast-radius cap policy documented
- [ ] Auto-rollback mechanism in place and tested in staging
- [ ] Alerting can distinguish chaos events from real incidents
- [ ] Customer support / incident-response informed of schedule
- [ ] At least one team member with on-call ownership for chaos failures

### Level 4 ready?

- [ ] L3 ✓
- [ ] Stateless services recover from instance loss in < 30s without alert
- [ ] Stateful tier replicates across AZs/regions with automatic failover
- [ ] Error-budget-based SLO practice exists; chaos consumes budget like any other event
- [ ] System architecture review explicitly addresses partial loss
- [ ] Continuous chaos has been running in canary for at least one quarter

---

## Organizational prerequisites

Chaos engineering as a practice (not as a one-off exercise) requires:

| Prereq | Why |
|--------|-----|
| Blameless culture | Chaos surfaces problems; people must feel safe to report what was found |
| SRE-adjacent practice | Chaos extends SRE; teams without on-call don't have the right reflexes |
| Engineering investment time | Even L1 needs ~10% of a team's time; L3 needs more |
| Leadership support | Production chaos requires backing when it (eventually) causes minor user impact |
| Customer support partnership | Support team must know schedule and have escalation path |

If any are missing, address that first. Chaos in an immature org becomes "the team that breaks things" — which kills the practice within months.

---

## Common failure modes of chaos programs

| Failure | Cause | Recovery |
|---------|-------|----------|
| Program loses momentum after 3 months | One engineer's hobby project, no team ownership | Distribute ownership; tie to SRE / SLO outcomes |
| Findings never get fixed | No process to triage chaos findings | Chaos findings become P-level tickets; tracked in same backlog as bugs |
| Chaos run causes real incident | Skipped maturity levels; blast radius too big | Stop prod chaos; return to L2; rebuild trust |
| Same experiments run forever | Catalog isn't pruned; team isn't moving up the difficulty curve | Quarterly experiment review; retire passing experiments after N runs |
| Chaos tooling becomes its own outage source | Tool itself is buggy or under-monitored | Treat tooling as production-critical; monitor it like other infra |

---

## Reading and tools (provider-neutral)

| Category | Examples |
|----------|----------|
| Open-source orchestrators | Chaos Mesh, Litmus, ChaosToolkit, Pumba |
| Cloud-native | AWS Fault Injection Simulator, Azure Chaos Studio, GCP fault-injection |
| Commercial platforms | Gremlin, Steadybit, Verica |
| Load generators (for traffic chaos) | k6, Locust, Vegeta, JMeter |
| Low-level tools | `tc qdisc`, `iptables`, `dd`, `stress-ng`, `kubectl delete pod` |

The skill works with any of these; the patterns and decisions transfer.

---

## Summary cheatsheet

| Question | Answer |
|----------|--------|
| Where do I start? | Run experiment 1 ("kill a pod") in staging. Write up the result. |
| How big should the first prod experiment be? | 1 instance / 1% of traffic / 1 minute. Cap the abort at 30 seconds. |
| When am I ready for L3? | When L2 isn't finding new issues and leadership has approved prod chaos in writing. |
| What if I find a bug? | File it. Re-run the experiment after the fix to confirm. Keep the experiment in the catalog. |
| How often should I run? | L1: quarterly. L2: weekly. L3: weekly in prod canary. L4: continuously. |
| What if a real incident lands during a chaos run? | Abort chaos, hand off to oncall, do not blame chaos by default until investigation completes. |
