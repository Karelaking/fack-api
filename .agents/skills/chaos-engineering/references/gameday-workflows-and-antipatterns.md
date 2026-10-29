# Gameday Playbook, Workflows, Anti-Patterns & Tooling Outputs

Read this when planning or running a gameday, executing one of the end-to-end workflows, avoiding common chaos anti-patterns, or interpreting the script outputs.

## Gameday playbook

A gameday is a scheduled, larger-scale chaos exercise — one full afternoon, one specific scenario, the whole team involved.

### Standard gameday agenda (4 hours)

```
T-2 days:  Scenario announced; team briefed; runbooks reviewed
T+0:00     Kick-off, roles assigned (lead, scribe, observers, oncall)
T+0:15     Steady-state baseline captured
T+0:30     Scenario 1 injected — observe, document
T+1:00     Recovery, debrief on scenario 1
T+1:30     Scenario 2 injected
T+2:00     Recovery, debrief
T+2:30     Scenario 3 injected
T+3:00     Recovery, debrief
T+3:30     Synthesis: what surprised us, action items, runbook updates
T+4:00     Wrap, action items assigned with owners + due dates
```

Use `scripts/gameday_planner.py` to generate a tailored agenda + roles + scenarios for a given service.

### Roles

| Role | Responsibility |
|------|----------------|
| Lead | Calls the scenarios, manages time, makes go/no-go calls |
| Scribe | Records what happened, when, with timestamps |
| Operator | Actually injects the chaos (using the tool of choice) |
| Observers | Watch dashboards for each domain (frontend, backend, infra, business KPIs) |
| Oncall | Real on-call rotation, observing but not participating — if a real incident lands during the gameday, they handle it |
| External rep | Customer support or a product manager — sees user-impact reports if any |

### Scenarios — picking good ones

A good gameday scenario:

- Tests a hypothesis the team isn't sure about
- Has been **rehearsed in staging** before being run in prod
- Has a clear abort
- Produces durable artifacts (runbook updates, dashboards, fixes)

Bad scenarios: too small (no learning), too big (real incident risk), unrelated to actual production risks (training a muscle nobody needs).

See [gameday-playbook.md](gameday-playbook.md) for 12 scenario templates by domain (API service, database, frontend, async pipeline, multi-region, etc.), agendas for half-day and full-day formats, and post-gameday writeup templates.

## Anti-patterns

- **Chaos without observability.** You inject a fault, the system behavior changes, and you can't tell because dashboards don't show it. Fix observability first.
- **No hypothesis.** "We turned off the database and the app broke." That's not chaos engineering, that's an outage.
- **Big-bang first experiment.** Don't start with "kill the primary database." Start with "kill one pod of a stateless service."
- **No abort criteria.** Experiment runs longer than intended; one observer goes to lunch; nobody knows when to stop.
- **Single-person chaos.** One engineer experiments without team coordination. Customer impact happens, no one knows why. Always announce, always have an observer.
- **Chaos as competition.** "Let's see if we can break X" framings encourage gotcha-style runs that miss the point. The point is learning, not winning.
- **No follow-through.** Run a gameday, surface 10 issues, fix none. The next gameday surfaces the same 10. Discipline = closing the loop on findings.
- **Skipping staging.** Production-first chaos is L4. If you're at L1-L2, do not run in prod. Earn the right by demonstrating the practice in staging.
- **Chaos and a release the same day.** Compounds variables; you can't tell which change caused what.

## End-to-end workflows

### Workflow: Design and run a single experiment

1. Pick a concern — "I'm not sure our payment service handles upstream PSP timeouts gracefully."
2. Use `scripts/chaos_experiment_designer.py --target payments-svc --fault dependency-timeout --duration 5m` to scaffold the experiment doc.
3. Define steady state (current error rate, latency).
4. Write a falsifiable hypothesis.
5. Compute blast radius with `scripts/blast_radius_calculator.py`.
6. Define abort criteria.
7. Run in staging. Observe. Record.
8. Analyze, document, file follow-ups.
9. If staging-clean, propose a smaller prod version (1% / 60s).

### Workflow: Plan a gameday

1. Identify the scenario — "What happens if our primary region degrades?"
2. Generate agenda with `scripts/gameday_planner.py --service search-api --duration 4h --scenarios region-failover,dep-outage,cache-flush`.
3. Brief the team 2 days ahead.
4. Rehearse the scenarios in staging.
5. Run the gameday with full roster.
6. Write up findings; assign action items with owners.
7. Re-run the same scenarios in 3 months to confirm fixes.

### Workflow: Use chaos to verify a kill switch (cross-skill with feature-flags-architect)

1. The team has a kill switch on the recommendations service (`ops.recs.kill_switch`).
2. Hypothesis: when the kill switch is flipped, no calls go to the recs service, traffic falls back to static recommendations, error rate stays under 0.2%.
3. In staging: inject 100% network block to the recs service. Confirm the kill switch was actually flipped (not just relying on circuit breaker), confirm fallback works.
4. In prod: during low-traffic window, flip the kill switch for 5 minutes with observers watching.
5. Confirm hypothesis. Document. Schedule quarterly re-test.

### Workflow: Post-incident verification

1. After an incident is resolved, write a chaos experiment that recreates the failure.
2. Run in staging — should now succeed (incident shouldn't recur).
3. Keep the experiment in the catalog; re-run periodically (monthly or quarterly).
4. If it ever fails again, you've caught a regression before customers did.

## Tooling outputs

| Script | Input | Output |
|--------|-------|--------|
| `scripts/chaos_experiment_designer.py` | Target service, fault type, optional duration / blast targets | Markdown experiment doc with hypothesis stub, steady-state template, abort criteria, observation checklist |
| `scripts/blast_radius_calculator.py` | Total users / traffic, % targeted, fault type, fallback assumption | Worst-case affected users, recommended caps per maturity level, abort-trigger metrics |
| `scripts/gameday_planner.py` | Target service, duration, scenario list, team size | Markdown gameday agenda with roles, timeline, observation checklist, debrief template |

All scripts: stdlib only, argparse CLI, JSON or markdown output.
