# Gameday Playbook

Operational reference for running a chaos gameday — a scheduled, larger-scale chaos exercise involving the full team. Includes 12 scenario templates by domain, agendas for half-day and full-day formats, role definitions, debrief and writeup templates.

---

## What a gameday is (and isn't)

A **gameday** is:
- A scheduled, time-boxed exercise (half-day or full-day)
- Focused on one major scenario, broken into 2-4 sub-scenarios
- Involves the entire team in defined roles
- Run in staging or production with explicit blast-radius controls
- Followed by debrief + written-up artifacts + action items with owners

A gameday is **not**:
- An ad-hoc chaos experiment (those run weekly/daily in lower-effort form)
- A red-team / pen-test exercise (that's security testing)
- A drill rehearsing a known runbook (that's a fire drill — narrower scope)
- A blame exercise (anyone who arrives to "show that X is broken" misses the point)

The aim is to **surface assumptions** by inviting reality to test them. Most gameday "findings" are mismatches between what the team believed about the system and what's actually true.

---

## Gameday roles

Six roles. For small teams, one person can wear two hats (e.g., lead + scribe), but the operator and observer roles must always be distinct.

| Role | Responsibility | Skills needed |
|------|----------------|---------------|
| **Lead** | Calls scenarios, manages time, makes go/no-go calls, runs debrief | Senior eng; calm under stress; system knowledge |
| **Scribe** | Records what happened, when, with timestamps. Outputs the gameday writeup. | Detail-oriented; fast writer; can capture key quotes |
| **Operator** | Actually injects the chaos using the tool of choice | Familiar with the chaos tool; cool under pressure |
| **Observers (1-3)** | Watch dashboards for each domain (frontend, backend, infra, business KPIs) | Domain expertise; vocal about what they see |
| **Oncall** | The real on-call rotation, observing but not participating — if a real incident lands during the gameday, oncall handles it; chaos pauses | Standard on-call |
| **External rep** | Customer support or PM observer — represents user impact perspective | Empathy; user-facing context |

For very small teams (< 4 people), pair up: Lead+Scribe, Operator+Observer. Never combine Operator+Oncall — they need to be separate humans.

---

## Standard agendas

### Half-day gameday (4 hours)

For an existing team running its 2nd-5th gameday on a specific service.

```
T-2 days   Scenario published; runbooks reviewed in async channel
T-1 day    Roles assigned; rehearsal in staging if first prod run
T+0:00     Kickoff: everyone joins, intro, ground rules (15 min)
T+0:15     Steady-state capture: agreed baseline metrics screenshot (15 min)
T+0:30     Scenario 1 — inject (5-15 min), observe (15-30 min), recover (15 min)
T+1:30     Quick debrief on scenario 1 (15 min)
T+1:45     Scenario 2 — inject + observe + recover (60 min)
T+2:45     Quick debrief on scenario 2 (15 min)
T+3:00     Scenario 3 (optional — only if 1 and 2 went smoothly) (45 min)
T+3:45     Final synthesis + action items + close (15 min)
T+4:00     End
```

### Full-day gameday (8 hours)

For a major service / first-time prod chaos / multi-team exercise. Adds a longer rehearsal block, more recovery time, and a longer synthesis.

```
T+0:00     Kickoff + roles + ground rules (30 min)
T+0:30     Staging rehearsal of scenario 1 (60 min)
T+1:30     Break + steady-state capture for prod (30 min)
T+2:00     Scenario 1 in target env (90 min: inject 15 + observe 30 + recover 30 + debrief 15)
T+3:30     Lunch (60 min)
T+4:30     Scenario 2 (90 min)
T+6:00     Scenario 3 (75 min)
T+7:15     Synthesis: cross-scenario patterns, biggest surprises (30 min)
T+7:45     Action items, owners, due dates (15 min)
T+8:00     End
```

### Ground rules (read at every kickoff)

```
1. Safety first: if anything outside the experiment scope alerts, pause.
2. The oncall rotation handles real incidents; chaos pauses for real ones.
3. Anyone can call abort at any time. No questions asked.
4. We're here to learn, not to win. Surprises = success.
5. The scribe captures everything; trust the process.
6. Findings are blameless: we name systems, not people.
7. We finish on time. We don't add scenarios mid-day.
```

---

## Scenario templates

12 templates organized by domain. Each is a starting point — adapt to your stack.

### Domain: Stateless API service

#### S1: Single pod kill

**Hypothesis:** Killing 1 of N pods causes < 30s of degraded latency (within 2× baseline), error rate stays < 0.5%, replacement pod is healthy within 60s, no human intervention needed.

**Injection:** `kubectl delete pod <pod>` or Chaos Mesh PodChaos
**Duration:** 2 minutes (1 minute for kill, 1 minute for full recovery)
**Blast radius:** 1/N of capacity for ~30 seconds
**Watch:** Per-pod error rate, total error rate, p95/p99 latency, replica count
**Abort:** Total error rate > 5% for 60s

#### S2: Rolling restart of all pods

**Hypothesis:** A rolling restart (1 pod at a time, with health checks between) causes no user-visible errors. p99 latency stays within 1.5× baseline. Total restart completes within (N × 30s).

**Injection:** `kubectl rollout restart deployment/<svc>` or equivalent
**Duration:** N × 30s, where N = pod count
**Blast radius:** 1 pod missing at a time
**Watch:** Same as S1; plus deploy rollout dashboard
**Abort:** Any pod fails its health check after 3 minutes

#### S3: Latency injection between API and downstream

**Hypothesis:** Adding 500ms of latency between API and downstream DB increases end-to-end p99 by ≤ 600ms. No timeouts fire. Retry rate increases by < 10%.

**Injection:** Chaos Mesh NetworkChaos delay, or `tc qdisc` between API and DB
**Duration:** 5 minutes
**Blast radius:** All traffic between API and DB
**Watch:** Latency p50/p95/p99 per request type; timeout count; retry count; circuit breaker state
**Abort:** Timeout rate > 1% or circuit breaker opens

### Domain: Database / stateful tier

#### S4: Read-replica failure

**Hypothesis:** When a read replica becomes unavailable, traffic routes to remaining replicas within 30s. Read latency increases by ≤ 2× during the redirect. No errors visible to users.

**Injection:** Isolate one replica via security group / network rule; or stop the instance
**Duration:** 10 minutes
**Blast radius:** 1/N read capacity
**Watch:** Read latency per replica; replica health dashboard; total query count distribution
**Abort:** Read error rate > 0.5%; primary CPU > 80%

#### S5: Primary failover

**Hypothesis:** Triggering a primary failover completes within 60 seconds. Write requests during failover either retry successfully or fail fast with retry-after. Replica promotes cleanly with no data loss.

**Injection:** Manual failover via DB control plane (be very careful; in some systems this is reversible only with effort)
**Duration:** 5-10 minutes
**Blast radius:** All write traffic briefly affected
**Watch:** Write success rate; failover completion time; transaction log consistency; replica promotion logs
**Abort:** Failover takes > 5 minutes or fails

Note: Run S5 in staging first. Production-prod S5 only with explicit leadership approval and customer comms windows.

### Domain: Dependency / third-party

#### S6: Block all calls to one external API

**Hypothesis:** When calls to <vendor API> are blocked, the affected feature falls back to cached/static data (or returns clear errors). Other features are unaffected. Alerting fires within 2 minutes.

**Injection:** Chaos Mesh NetworkChaos partition to vendor IP range; firewall rule
**Duration:** 5 minutes
**Blast radius:** Only the calls to that vendor
**Watch:** Vendor call error rate; feature-level success rate; fallback path metrics; alerting timing
**Abort:** Other unrelated features show error rate > 0.5%

#### S7: Vendor returns 503 for 5 minutes

**Hypothesis:** When vendor returns 503, app retries with exponential backoff, then falls back to cache. No retry storm. Cache hit rate increases during outage.

**Injection:** Mock the vendor (in staging) or use a proxy that returns 503 to specific endpoints
**Duration:** 5 minutes
**Blast radius:** Only calls to the mocked vendor
**Watch:** Retry count; backoff timing; cache hit rate; queue depth
**Abort:** Retry rate > 100× normal; queue depth > 2× normal

### Domain: Frontend / CDN

#### S8: CDN cache flush

**Hypothesis:** Flushing the CDN cache causes a 10x request rate spike at origin for 3 minutes. Origin auto-scales within 90s. P95 latency stays under SLO. No origin errors.

**Injection:** CDN purge API call
**Duration:** Until cache repopulates (typically 5-15 min)
**Blast radius:** All cached endpoints; full origin traffic
**Watch:** Origin RPS; cache hit rate; origin error rate; origin instance count
**Abort:** Origin error rate > 1% or instance count > 3× normal

#### S9: Slow third-party JS

**Hypothesis:** When a third-party script (analytics, chat widget) is slow or fails, the main page still renders within the LCP SLO. The site remains interactive.

**Injection:** Network conditioning on the third-party domain in synthetic monitoring; chaos tool that blocks/slows specific domains
**Duration:** 5 minutes
**Blast radius:** Synthetic users only
**Watch:** LCP, FID, INP from synthetic; main thread time
**Abort:** Main page fails to render

### Domain: Async / batch pipeline

#### S10: Consumer killed mid-batch

**Hypothesis:** When a consumer is killed while processing a batch, the broker redelivers within visibility timeout. Replacement consumer picks up cleanly. No message lost. At-most-once semantics preserved where promised.

**Injection:** Kill consumer process / pod
**Duration:** Until redelivery + processing complete (varies)
**Blast radius:** One consumer worth of processing latency added
**Watch:** Queue depth; message redelivery count; idempotency conflicts; processing rate
**Abort:** Queue depth grows unboundedly; redelivery rate > 5% of total

#### S11: Schema drift in upstream producer

**Hypothesis:** When a producer starts emitting an unexpected field, the consumer ignores it without error. Other consumers continue to function.

**Injection:** Push test messages with extra fields, missing fields, wrong types to a non-prod topic
**Duration:** 5 minutes of bad messages
**Blast radius:** Only the test topic / partition
**Watch:** Consumer error rate; dead-letter queue depth; downstream processing rate
**Abort:** Consumer crashes; any messages reach prod-impacting topics

### Domain: Multi-region / regional failover

#### S12: Single AZ degraded

**Hypothesis:** When one AZ becomes unreachable, traffic routes to remaining AZs within 60s. Latency for affected users increases by ≤ 50ms (cross-AZ). No errors above 0.2%. Recovery to normal is automatic when AZ recovers.

**Injection:** Block network to specific AZ; in cloud-native chaos tools, AZ-level isolation is supported
**Duration:** 10-15 minutes
**Blast radius:** 1/N of capacity, where N = number of AZs
**Watch:** Per-AZ request rate; cross-AZ latency; error rate; total capacity
**Abort:** Error rate > 1% sustained, or any cross-AZ runaway cost

For production, AZ-level chaos is usually L3+ territory. Don't run this before completing the prerequisites in [chaos-principles-and-maturity.md](chaos-principles-and-maturity.md).

---

## Pre-gameday checklist

For the lead, 1-2 days before:

- [ ] Scenarios picked and shared with team
- [ ] Roles assigned to specific people
- [ ] Runbooks for affected services located and reviewed
- [ ] Dashboards opened in tabs (rehearse what you'll watch)
- [ ] Chaos tooling tested in staging
- [ ] Abort mechanism tested and reachable from the operator's machine
- [ ] Customer support / oncall informed of the window
- [ ] Slack channel created for the gameday (`#gameday-<date>-<service>`)
- [ ] Notes doc / scribe template prepared

For each participant:

- [ ] Calendar blocked
- [ ] Role understood
- [ ] Required tools / dashboards bookmarked
- [ ] Read the scenarios and runbooks

---

## During the gameday

### Scribe template (per scenario)

```markdown
## Scenario X: <name>

### Hypothesis
<copy from scenario template>

### Pre-injection baseline
- Captured at: <time>
- Error rate: <%>
- P95 latency: <ms>
- P99 latency: <ms>
- Active replicas: <N>
- Other notable metrics: ...

### Injection
- Tool: <Chaos Mesh / kubectl / etc.>
- Command: `<command>`
- Started at: <time>
- Ended at: <time>

### Observations (chronological)
- T+0:00 — injection started
- T+0:15 — error rate spiked to X%
- T+0:30 — first auto-recovery action observed (autoscaler added pod)
- T+0:45 — alert fired (or did not fire, even though we expected it to)
- T+1:00 — error rate returned to baseline
- ...

### Result
- [ ] Hypothesis confirmed
- [ ] Hypothesis partially confirmed
- [ ] Hypothesis disproven

### Surprises
- <surprise 1>
- <surprise 2>

### Action items
- [ ] AI-X: <action> — owner: <name> — due: <date>
- [ ] AI-Y: <action> — owner: <name> — due: <date>
```

### Lead checklist during scenario

- [ ] Confirm everyone has eyes on their dashboards before injection
- [ ] State clearly "Injecting in 3... 2... 1..."
- [ ] Watch the time; don't let observation phase run over
- [ ] Call abort if any threshold breaches
- [ ] During recovery, ask each observer: "what are you seeing?"
- [ ] Run a 5-min mini-debrief before next scenario

---

## Debrief and synthesis

End the gameday with a 30-60 minute debrief.

### Debrief questions

1. **What were the biggest surprises?** (these are the chaos value)
2. **What didn't we measure that we wish we had?** (observability gaps)
3. **What hypothesis did we disprove?** (real findings)
4. **What's the most important action item?** (prioritize)
5. **What should we run again next quarter to verify the fixes?** (regression)
6. **What's our maturity level after this exercise — same, up, or down?** (program health)

### Action item ownership

Every action item gets:
- Owner (one person, not a team)
- Due date (specific, not "soon")
- Priority (P0 / P1 / P2 / nice-to-have)
- Ticket link

Without owners and dates, action items rot. Track them in your normal backlog.

---

## Post-gameday writeup

Within 5 business days, the scribe produces a writeup:

```markdown
# Gameday: <service> — <date>

## Summary
<3-5 sentences: what we ran, what we found, what we're doing>

## Participants
- Lead: <name>
- Scribe: <name>
- Operator: <name>
- Observers: <names>
- Oncall: <name>
- External rep: <name>

## Scenarios run
- <S1 name>: <pass/partial/fail>
- <S2 name>: <pass/partial/fail>
- ...

## Top findings
1. <finding> — severity, status, owner
2. ...

## Action items
| ID | Action | Owner | Due | Priority | Ticket |
|----|--------|-------|-----|----------|--------|
| AI-1 | ... | ... | ... | P1 | LINK |
| AI-2 | ... | ... | ... | P2 | LINK |

## Detailed scenario notes
<scribe's per-scenario template, filled in>

## Next gameday
- Proposed date: <date>
- Proposed scenarios: <list — include re-runs of failed scenarios to verify fixes>
```

Share writeup in: team channel, leadership chaos-program report, your gameday catalog.

---

## Gameday cadence

| Maturity | Cadence | Style |
|----------|---------|-------|
| L1 | Quarterly | Half-day, staging, single scenario |
| L2 | Quarterly | Half-day, staging, 2-3 scenarios |
| L3 | Quarterly + monthly mini | Full day quarterly in prod canary; monthly half-day in staging |
| L4 | Continuous + quarterly major | Continuous chaos as background; quarterly themed gameday (e.g., "kill us-east" day) |

The quarterly major gameday is the cultural anchor — even at L4, you keep doing it because it's where the cross-team learning happens.

---

## Common gameday failure modes

| Failure | Cause | Fix |
|---------|-------|-----|
| "It all worked" — no findings | Scenarios too easy; team played safe | Pick harder scenarios; involve a skeptic |
| Real incident lands during gameday | Bad luck; or chaos triggered something real | Pause chaos; defer to oncall; resume next day if appropriate |
| Findings never get fixed | No owner / no date / no priority | Treat AI list as backlog work; track in normal sprint |
| Same scenario every time | Catalog isn't growing | Add 1-2 new scenarios per quarter; retire ones that always pass |
| Gameday becomes performative | Goal-setting drift; "we did chaos!" without learning | Re-anchor on the principles; measure findings → fixes → re-tests |

---

## Cheat sheet

| Question | Answer |
|----------|--------|
| First gameday for the team? | Half-day in staging, single scenario (S1 from the catalog), team of 4-6, simplest abort |
| Should we run prod chaos? | Only after 2+ successful staging gamedays and L2 maturity criteria met |
| How long to plan a gameday? | 1-2 weeks for first one; 2-3 days once practiced |
| How many scenarios per day? | Half-day: 2 scenarios. Full-day: 3 scenarios. More invites cognitive overload |
| What if we don't find anything? | Either pick harder scenarios, or the system genuinely is resilient — both are valid outcomes if recorded honestly |
| Should the CEO observe? | At a major gameday, yes — leadership visibility funds the program; brief them on what to expect (including non-events) |
