# DQ Incident Response

Playbook for responding to data quality incidents. Treats bad-data events with the same rigor as production outages: acknowledge fast, quarantine, triage, contain, fix, notify, post-incident review.

---

## Why DQ incidents need formal response

Bad data flows downstream silently. A regression in upstream parsing affects:
- Executive dashboards (wrong numbers → wrong decisions)
- Customer billing (wrong charges → support nightmares + legal exposure)
- ML models (training on bad data → predictions degrade)
- Regulatory reporting (wrong filings → fines / restatements)
- Trust in the data team (one big incident sets the team back months)

Without a playbook, teams scramble, miss steps, and the same incident recurs.

---

## Severity classification

| Severity | Definition | Examples | Response time |
|----------|-----------|----------|---------------|
| **Sev1 — Critical** | Bad data is visible to customers OR feeding ML in production OR driving real-money flows (billing, payouts) | Pricing displayed wrong; ML recommends bad products; billing overcharged | Ack < 15min, contain < 1h, fix < 4h |
| **Sev2 — High** | Bad data is feeding executive dashboards, finance close, regulatory reporting, internal-critical decisions | Daily revenue dashboard wrong; finance can't close month | Ack < 1h, fix < 24h |
| **Sev3 — Medium** | Bad data in analytical tables; doesn't immediately affect decisions but will become a problem | Marketing funnel metrics off; not yet acted on | Ack < 1 day, fix in next release cycle |
| **Sev4 — Low** | Edge case; doesn't affect known consumers | Reports for sunset product; corner-case validation failures | Backlog |

---

## The incident response loop

### Step 1: Acknowledge

Within ack-SLA:
- Acknowledge the alert (in PagerDuty / Opsgenie / Slack)
- Open an incident channel: `#dq-incident-<timestamp>-<table>` (or similar convention)
- Record start time
- Assign an Incident Commander (IC)

### Step 2: Quarantine

Stop the bleeding immediately:

| What | How |
|------|-----|
| Bad data still being produced | Pause the upstream pipeline (orchestrator: kill the DAG) |
| Bad data still being read by downstream | Pause downstream pipelines reading the affected table |
| Customers seeing the bad data | Flag in app to hide affected view; serve cached known-good |
| ML production reading bad data | Roll back to previous model; switch traffic to fallback |
| External consumers of API | Disable affected endpoints; return maintenance status |

### Step 3: Triage

Within ~30 min of ack, determine:

| Question | Why |
|----------|-----|
| Is this a real DQ issue or false positive? | Don't chase noise |
| What's the scope? (which records, time range, downstream tables) | Determine cleanup blast radius |
| What's the root cause hypothesis? | Inform the fix |
| What's the severity? (re-assess if changed) | Set comms cadence |
| Who needs to be notified? (downstream consumers, customer support, executives) | Don't surprise people |

Root-cause hypotheses to consider:

| Symptom | Likely root cause |
|---------|-------------------|
| Schema check fails | Upstream renamed/dropped column; pipeline didn't handle |
| Null rate spikes for a field | Upstream stopped sending field; or new code path doesn't populate |
| Row count drops to 0 | Pipeline failed silently; or upstream source down |
| Volume jumps 100x | Bot/spam; deduplication broken; replay of historical data |
| Validity rate drops | Upstream format change (e.g., currency now has 2 decimals when it was 0) |
| Cross-system reconciliation fails | Race condition; eventual consistency window; one system broken |
| Freshness SLA breach | Pipeline failed; upstream delayed; scheduler issue |

### Step 4: Contain

Reduce ongoing impact:

| Pattern | When |
|---------|------|
| **Pause and revert** | Roll back to last known good state of table |
| **Hot fix in code** | If root cause is in your code, deploy a fix |
| **Filter at consumption** | Tag affected records; filter them at every downstream read |
| **Manual override** | For finance / billing, manually create corrective entries |
| **Quarantine and process later** | Move bad records to `_quarantine` schema; process when fixed |

### Step 5: Fix forward

- Identify code change needed
- Make change in code
- Code review (don't skip; incidents are how regressions happen)
- Deploy
- Reprocess affected data (backfill)
- Verify the fix works (re-run DQ checks; confirm green)

### Step 6: Notify

| Audience | When | What |
|----------|------|------|
| Affected downstream consumers | As soon as triage done | "We have bad data in `orders` for the last 4 hours; we're investigating; we'll let you know when fixed" |
| Customer support | If customer-facing | Talking points; how to recognize affected customers |
| Status page | If customer-facing | Update with severity, expected resolution |
| Executives | Sev1 / Sev2 | At-a-glance summary; impact; ETA |
| Audit / compliance team | If compliance-impacting (billing, regulatory) | Document the incident for audit trail |
| Engineering broadly | Post-incident | Lessons learned |

### Step 7: Post-incident review

Within 5 business days, write up:

```markdown
# DQ Incident: <table_name> on <date>

## Summary
<3-5 sentences: what went wrong, impact, fix>

## Timeline
- T+0:00 — alert fired
- T+0:05 — IC ack'd
- T+0:15 — quarantine in place
- T+0:30 — root cause identified
- T+2:00 — fix deployed
- T+3:30 — affected data reprocessed
- T+4:00 — incident closed

## Root cause
<technical detail>

## Impact
- Records affected: <count>
- Time window: <range>
- Downstream tables affected: <list>
- Customer-visible? yes/no — if yes, <count of customers, what they saw>
- Money impact: <$> (if applicable)

## What went well
- Alerting fired quickly
- Quarantine pattern worked
- ...

## What went poorly
- Took N minutes to triage because of unclear ownership
- Reprocessing took longer than expected because of <reason>
- ...

## Action items
| ID | Action | Owner | Due | Priority |
|----|--------|-------|-----|----------|
| AI-1 | Add DQ check that would have caught this earlier | @owner | YYYY-MM-DD | P1 |
| AI-2 | Document table ownership in catalog | @owner | YYYY-MM-DD | P2 |
| AI-3 | Add runbook for this scenario | @owner | YYYY-MM-DD | P2 |
```

Critical: **every incident → at least one action item that prevents recurrence.** Often this is a new DQ check.

---

## Recovery patterns in depth

### Backfill

Re-run pipelines for the affected partition / time range.

Steps:
1. Identify affected partitions (`day = '2026-05-26'` or similar)
2. Manually trigger reprocessing for those partitions
3. Verify outputs (run DQ checks on the reprocessed data)
4. Confirm downstream tables updated

**Tip:** All production pipelines should be designed for idempotent reprocessing. If yours aren't, that's a separate-but-urgent improvement.

### Quarantine schema

Pattern: every table has a sibling `_quarantine` schema where bad records land for review.

```sql
-- Detect and quarantine
INSERT INTO mydb_quarantine.orders
SELECT * FROM mydb.orders WHERE amount < 0;

DELETE FROM mydb.orders WHERE amount < 0;
```

Quarantine reviewed weekly; either reprocessed (after fix) or written off.

### Dead-letter queue (DLQ)

For streaming pipelines, route unparseable / invalid records to DLQ instead of failing the pipeline.

```python
try:
    record = parse(message)
    if not validate(record):
        dlq.publish(message, reason="validation_failed")
        return
    write_to_warehouse(record)
except ParseError as e:
    dlq.publish(message, reason=str(e))
```

DLQ is reviewed; bug fixed; records reprocessed.

### Manual correction

For high-value corrections (billing, financial close), create explicit correction records rather than mutating existing data:

```sql
INSERT INTO billing.adjustments
(account_id, original_amount, corrected_amount, reason, applied_by, applied_at)
VALUES (...);
```

Auditable; reversible; complies with most accounting + compliance regimes.

### Rollback to snapshot

If your data store supports snapshots / time-travel (Snowflake Time Travel, BigQuery snapshot decorators, Delta Lake versioning), rollback to a known-good snapshot.

```sql
-- BigQuery
CREATE OR REPLACE TABLE mydb.mytable AS
SELECT * FROM mydb.mytable
FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 4 HOUR);
```

Fast but lossy (you also rollback the legitimate updates of the last 4h).

---

## Common pitfalls during incidents

### Pitfall: Fix forward without freezing

You're applying a hot fix; meanwhile bad data keeps flowing. Result: when fix lands, half the data is still broken.

**Mitigation:** Pause the pipeline first; then fix.

### Pitfall: Reprocessing affecting live consumers

You backfill; your backfill writes to the production table; consumers see the data change mid-day; they panic.

**Mitigation:** Write reprocessed data to a staging table; swap atomically. Or coordinate the backfill with consumers.

### Pitfall: Notification fatigue

Frequent Sev3/Sev4 alerts erode trust; people stop reading.

**Mitigation:** Tune severity definitions; aggregate; auto-resolve when fixed.

### Pitfall: Hiding the incident

"We'll fix it before anyone notices." Sometimes works; if it doesn't, makes things much worse.

**Mitigation:** Notify proactively; transparency builds trust.

### Pitfall: No post-incident writeup

Incident closed; nothing learned. Same thing recurs in 3 months.

**Mitigation:** Make writeups mandatory; review monthly as a team.

### Pitfall: Action items never close

Writeup lists 10 action items; 0 completed by next quarter.

**Mitigation:** Assign owners + dates; track in backlog; review status in retrospectives.

---

## Incident channel template

When opening the incident channel, post this:

```
🚨 DQ Incident
Table: mydb.orders
Severity: Sev1
IC: @alice
Started: <timestamp>

Symptoms:
- Null rate on `customer_id` jumped from 0.1% to 8% at 14:32 UTC
- Downstream `orders_summary` pipeline has been re-running on bad data since 14:35

Affected downstream:
- orders_summary
- customer_lifetime_value
- billing_export (Sev1 risk — paused)

Actions taken:
- [x] Acknowledged alert
- [x] Paused billing_export pipeline
- [ ] Identify root cause
- [ ] Quarantine bad records
- [ ] Hot fix
- [ ] Backfill
- [ ] Notify downstream owners
- [ ] Re-enable billing_export
```

Update this every 15-30 minutes as the situation evolves.

---

## Status page template (for customer-facing)

```
Title: Data quality issue affecting [feature]
Status: Investigating
Started: <UTC timestamp>

Update [T+15min]: We are investigating a data quality issue that may cause [user-visible symptom]. We have paused [affected feature] while we determine the scope.

Update [T+1h]: We have identified the cause and are reprocessing affected data. We expect [feature] to be restored by [ETA].

Resolved [T+4h]: The issue has been resolved. All affected data has been reprocessed. We will publish a full post-incident report within 1 week.
```

---

## Cross-team comms templates

### Email to downstream consumers (Sev2/Sev3)

```
Subject: [DQ Incident] orders table — bad data for 4-hour window

We had a data quality incident in mydb.orders between 14:30 and 18:30 UTC.

Impact: customer_id was NULL for ~8% of records in this window, instead of the expected ~0.1%.

If you read from this table during that window, you may want to reprocess your downstream tables. The orders table has been backfilled with corrected data as of 19:15 UTC.

We will publish a full post-incident writeup within 1 week.

If you have questions or need help reprocessing, ping @data-team-alerts in Slack.
```

### Stakeholder update (Sev1)

For executives, keep it terse:

```
Sev1 DQ incident, orders table, customer-visible billing impact

Status: contained; fix deployed; reprocessing in progress
Customers affected: ~3,200 (overcharged by avg $4.50)
ETA to full resolution: 2 hours
Communications: support team briefed; affected customers will be auto-credited

Will share post-mortem within 1 week.
```

---

## Cheat sheet

| Question | Answer |
|----------|--------|
| What sev is this? | Customer-facing/billing → Sev1; exec dashboards → Sev2; analytical → Sev3; edge case → Sev4 |
| What's the first thing I do? | Acknowledge, then pause the bleeding (quarantine) |
| Who do I tell? | IC → downstream consumers (always) → support if customer-facing → execs if Sev1/2 |
| How do I fix? | Identify root cause first; fix in code; reprocess affected data |
| When am I done? | DQ checks green + downstream confirmed clean + post-incident writeup published |
| Will this happen again? | Only if you ship a new DQ check that catches the same pattern in the future |
