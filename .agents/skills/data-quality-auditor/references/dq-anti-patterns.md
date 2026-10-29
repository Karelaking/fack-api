# DQ Anti-Patterns

Read this when reviewing a DQ program for smells, or to avoid the common traps when standing one up.

## Anti-patterns

- **DQ as afterthought.** Checks added "when we have time." Almost never added; bad data accumulates.
- **All-or-nothing DQ.** "If we can't have 100% coverage, why bother?" Some coverage on critical tables is enormously valuable.
- **Checks without thresholds.** "Alert on any nulls." Real data has noise; tune thresholds; alert on meaningful changes.
- **Alert fatigue.** Too many noisy alerts → real ones ignored. Tune; aggregate; route by severity.
- **No owner for the data.** "Who do I ping about bad data in `orders_aggregated`?" Every prod table needs an owner.
- **DQ tool sprawl.** dbt tests + Great Expectations + Soda + custom SQL + ad-hoc Slack rules. Pick one (or two) and standardize.
- **Reactive only.** DQ team only fixes incidents; never proactively profiles or improves. Stuck at L1.
- **Checks but no enforcement.** Checks run, fail, alert — but nothing blocks the pipeline. Bad data goes downstream anyway.
- **No DQ in CI.** Production has checks; dev/staging doesn't. Bugs make it to prod, then caught.
- **Same check on a table 50 columns wide.** "Not null on every column." Drowning in noise. Focus on semantically-required.
