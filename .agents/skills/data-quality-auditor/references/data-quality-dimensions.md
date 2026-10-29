# Data Quality Dimensions

The six dimensions of data quality (completeness, accuracy, consistency, timeliness, validity, uniqueness) plus the three sometimes-added (integrity, conformity, reasonableness). For each: definition, how to measure, threshold guidance, alerting strategy, common pitfalls.

---

## Why dimensions matter

Without a taxonomy, DQ becomes "check whatever someone thought of." The dimensions force coverage: if your DQ catalog is heavy in completeness checks and light in consistency checks, you'll miss a class of bugs.

A mature DQ program has at least one check per applicable dimension per critical table.

---

## Dimension 1: Completeness

**Definition:** The proportion of records or fields that contain the expected data values (i.e., not NULL, not empty, not "Unknown").

**Why it matters:** Missing data is often the most common DQ issue. Downstream systems break (NULL pointer); analytics underreport; ML models confuse "missing" with "zero."

### How to measure

| Pattern | SQL example |
|---------|-------------|
| Column null rate | `SELECT COUNT(*) FILTER (WHERE col IS NULL) / COUNT(*) AS null_rate FROM t` |
| Row completeness (all required fields populated) | `SELECT COUNT(*) FILTER (WHERE a IS NULL OR b IS NULL OR c IS NULL) / COUNT(*) FROM t` |
| Empty string rate | `SELECT COUNT(*) FILTER (WHERE col = '' OR col = ' ') / COUNT(*) FROM t` |
| "Unknown" sentinel rate | `SELECT COUNT(*) FILTER (WHERE col IN ('Unknown','N/A','NULL','-')) / COUNT(*) FROM t` |

### Threshold guidance

Per-field, set thresholds based on semantic role:

| Field semantic | Typical threshold |
|----------------|-------------------|
| Primary key | NULL rate = 0% (hard) |
| Required business field (email, name) | NULL rate < 0.1% |
| Optional field (middle name) | No threshold; just monitor for unexpected spikes |
| FK to another table | NULL rate matches expected (e.g., free-tier accounts may have no `org_id`) |

### Alerting strategy

- **Hard fail** on PK nulls — block pipeline
- **Warn** if required-field null rate doubles vs 7-day baseline
- **Track** but don't alert on optional-field null rates; investigate trends in quarterly review

### Common pitfalls

- Treating `NULL` and empty string as the same. They aren't. `''` may indicate "data captured but empty" while `NULL` indicates "not captured."
- Treating `NULL` and sentinel values as the same. "Unknown" is data your producer chose to emit; `NULL` is absence.
- Confusing "completeness of records" with "completeness of fields." Sometimes you're missing rows entirely; that's a count check, not a per-field null check.

---

## Dimension 2: Accuracy

**Definition:** The degree to which data correctly represents the real-world entity / event it describes.

**Why it matters:** Inaccurate data leads to wrong decisions. Hardest dimension to measure because it requires a source of truth.

### How to measure

| Pattern | Approach |
|---------|----------|
| Reconciliation against source of truth | Compare to authoritative external system (Salesforce, financial system, etc.) |
| Sample-based human review | Pull random sample; have domain expert verify |
| Algorithmic accuracy checks | Cross-reference (e.g., zip code → city → state matches) |
| Sentinel records | Known-good records that should always match (canaries) |

### Threshold guidance

- **Financial / billing data:** 100% accuracy is the standard; any discrepancy is investigated
- **Operational data:** 99%+ typical
- **Sample-based:** define a per-sample target (e.g., 95% of sampled records pass expert review)

### Alerting strategy

- **Hard fail** on financial reconciliation mismatches
- **Investigate** on canary failures
- **Quarterly review** of sample-based accuracy

### Common pitfalls

- Accepting "we don't have a source of truth" as a reason to skip. Define one (even if imperfect); track delta over time.
- Confusing accuracy with validity. A correctly-formatted phone number that's not the user's phone is valid but inaccurate.
- Sampling too small. n=10 tells you very little about a million-row table.

---

## Dimension 3: Consistency

**Definition:** Data values agree across different systems, tables, or points in time. No internal contradictions.

**Why it matters:** Contradictions destroy trust. If `users.country` says US but `users.tax_country` says UK, the user can't be both.

### How to measure

| Pattern | SQL example |
|---------|-------------|
| Cross-system consistency | `SELECT COUNT(*) WHERE (SELECT email FROM crm.users WHERE id = t.id) <> t.email` |
| Within-table consistency | `SELECT COUNT(*) WHERE country = 'US' AND tax_country = 'UK'` |
| Time-series consistency (row count) | `SELECT today_count / yesterday_count` — alert if outside 0.9-1.1 |
| Cardinality consistency | `SELECT COUNT(DISTINCT user_id) FROM events_today` vs same metric yesterday |

### Threshold guidance

- **Row count delta:** ±10% from prior period is typical; ±5% for stable tables; ±25% for spiky tables
- **Distinct count delta:** Tighter than row count; user-count shifts indicate real changes
- **Cross-system:** 0 mismatches is the goal; > 0.01% triggers investigation

### Alerting strategy

- **Fail pipeline** on cross-system reconciliation mismatch > threshold
- **Warn** on volume anomalies that exceed band
- **Track** distribution shifts (variance / skew) as trends

### Common pitfalls

- Time-zone confusion: "today's count" depends on time zone choice
- Late-arriving data: 24h-ago count keeps growing as records arrive; comparing right after run is misleading
- Holiday effects: Monday's count vs Tuesday's not comparable

---

## Dimension 4: Timeliness / Freshness

**Definition:** Data is current to the expectation defined by consumers.

**Why it matters:** Stale data masquerading as current causes wrong decisions. Operational dashboards showing yesterday's number labeled "live."

### How to measure

| Pattern | SQL example |
|---------|-------------|
| Max event time | `SELECT MAX(event_time) FROM t` — compare to now |
| Update lag | `SELECT NOW() - MAX(updated_at) FROM t` |
| Pipeline last-run | Last successful pipeline run timestamp from orchestrator |
| End-to-end latency | `event_time` from source → `materialized_at` in destination, p50/p95/p99 |

### Threshold guidance

Per-table SLA (define explicitly):

| Table type | Typical SLA |
|------------|-------------|
| Real-time event table | < 1 minute |
| Operational table | < 15 minutes |
| Hourly batch | < 1 hour 15 min (with buffer) |
| Daily batch | < 6 hours after day end |
| Weekly batch | < 24h after week end |
| Monthly batch | < 2 days after month end |

### Alerting strategy

- **Fail-fast at SLA breach** — page on-call
- **Pre-breach warning** at 75% of SLA budget
- **Trend monitoring** — increasing latency over time = degradation

### Common pitfalls

- Time-zone confusion (max event time in source TZ vs server TZ)
- Pipeline shows success but data didn't actually update (empty load)
- SLA defined for batch run completion, but consumer cares about end-to-end latency

---

## Dimension 5: Validity

**Definition:** Data conforms to defined formats, types, ranges, and business rules.

**Why it matters:** Invalid data breaks downstream parsing, breaks UI, signals upstream bugs.

### How to measure

| Pattern | SQL example |
|---------|-------------|
| Format (regex) | `SELECT COUNT(*) WHERE email !~ '^[^@]+@[^@]+\\.[^@]+$'` |
| Range | `SELECT COUNT(*) WHERE age < 0 OR age > 130` |
| Enum membership | `SELECT COUNT(*) WHERE status NOT IN ('active','inactive','deleted')` |
| Type / coercion | If string column should be numeric, count rows that don't cast |
| Business rule | `SELECT COUNT(*) WHERE end_date < start_date` |

### Threshold guidance

- **Validity rate should be ≥ 99.9%** for fields you control end-to-end
- Lower bar for fields with messy upstream input (free-text fields users typed)
- 0 invalid records is the goal for FK and PK columns

### Alerting strategy

- **Hard fail** on type mismatches (e.g., expected int got string)
- **Warn** on validity rate drop > 5% from baseline
- **Quarantine** invalid records to a `_quarantine` schema for review

### Common pitfalls

- Validation too strict ("name must be < 50 chars") — real users have long names
- Validation too lax ("any string accepted") — defeats the purpose
- Schema validation but no semantic validation — types are right, values are nonsense

---

## Dimension 6: Uniqueness

**Definition:** Entities are not duplicated. Each real-world entity is represented by exactly one record.

**Why it matters:** Duplicates inflate counts, cause double-billing, create UX confusion, break joins.

### How to measure

| Pattern | SQL example |
|---------|-------------|
| PK uniqueness | `SELECT id, COUNT(*) FROM t GROUP BY id HAVING COUNT(*) > 1` |
| Composite key uniqueness | `SELECT user_id, day, COUNT(*) FROM events GROUP BY 1,2 HAVING COUNT(*) > 1` |
| Fuzzy uniqueness | Email normalized (lower, trim) — duplicates: `SELECT LOWER(TRIM(email)), COUNT(*)...` |
| Deduplication audit | Same email + name + birthday → likely duplicate user |

### Threshold guidance

- **PK / composite-PK uniqueness:** 100% — hard fail any violation
- **Fuzzy uniqueness:** report duplicates; humans decide
- **Time-bounded uniqueness** (e.g., one event per user per day): hard fail

### Alerting strategy

- **Block pipeline** on hard uniqueness violations
- **Surface fuzzy duplicates** for manual review (queue)
- **Track duplicate rate over time** — increasing = upstream bug or migration issue

### Common pitfalls

- Defining uniqueness on a derived column that's not stable (e.g., `name + email` works until users change email)
- Race conditions in producers: two services both create user → two records
- Soft deletes confusing uniqueness — same user_id may appear active + deleted

---

## Optional dimension 7: Integrity (referential)

**Definition:** Foreign keys resolve to existing rows in their referenced tables.

**Why it matters:** Orphan references break joins, hide data, distort counts.

### How to measure

```sql
SELECT COUNT(*) FROM orders WHERE user_id NOT IN (SELECT id FROM users)
```

### Threshold guidance

Should be 0 for hard FKs. Some intentional orphans exist for soft-FK patterns (denormalized data).

### Common pitfalls

- Different load order: orders pipeline runs before users → temporary orphan window
- Soft deletes on users but orders not updated
- Cross-system FKs (e.g., user_id in DB references CRM ID) — easy to break with system migrations

---

## Optional dimension 8: Conformity

**Definition:** Data matches a published standard (industry, regulatory, organizational).

**Why it matters:** Standards exist for interop. Non-conforming data breaks downstream tools and integrations.

### Examples

- ISO 3166-1 country codes
- ISO 4217 currency codes
- ISO 8601 timestamps
- FIPS 6-4 county codes (US)
- IETF BCP 47 language tags
- E.164 phone numbers
- RFC 5321 / 5322 email addresses

### How to measure

Validate against an authoritative list (in code or reference table).

### Common pitfalls

- "US" vs "USA" vs "United States" — pick one and conform
- Date strings without time zone
- Currency without ISO code

---

## Optional dimension 9: Reasonableness

**Definition:** Values fall within ranges that make sense per business knowledge.

**Why it matters:** Validity ("number in range") + reasonableness ("number makes sense for this context").

### Examples

- A US zip code starting with `0` for a California address is unreasonable (CA zips start 9)
- A user account age of 150 years is unreasonable
- An order total of $1B is unreasonable (unless you're a specific kind of B2B company)
- A signup spike of 100,000x normal is unreasonable (probably bot)

### How to measure

Define business rules; check.

### Common pitfalls

- Reasonableness rules go stale as the business changes
- Outlier vs anomaly: legit data sometimes hits edges
- False positives erode trust in alerting

---

## Dimension applicability matrix

Not every dimension applies to every table. Use this matrix to plan coverage:

| Table type | Completeness | Accuracy | Consistency | Timeliness | Validity | Uniqueness | Integrity |
|-----------|--------------|----------|-------------|------------|----------|------------|-----------|
| Master / dimension (users, products) | High | High | Med | Med | High | High | Low |
| Transaction / fact (orders, events) | High | Med | High | High | Med | Med | High |
| Streaming events | Med | Low | Med | High | Med | High | Med |
| Aggregated / derived | Low (deriv'd) | Med | High | High | Low (deriv'd) | High | Med |
| Reference / lookup | High | High | High | Low (changes rarely) | High | High | n/a |

---

## Setting thresholds — a methodology

Pre-launch:
1. **Profile** current state (`scripts/dq_check_runner.py --profile`)
2. **Establish baseline** for each dimension
3. **Pick thresholds** at baseline + reasonable noise allowance
4. **Document why** each threshold was chosen

Post-launch:
1. **Monitor** false-positive rate (alerts that turn out to be fine)
2. **Tighten or loosen** based on signal-to-noise
3. **Reassess quarterly** as data evolves

---

## Cheat sheet by symptom

| Symptom | Likely dimension |
|---------|------------------|
| "Customer is missing from report" | Completeness or Integrity |
| "Numbers don't add up to our other system" | Accuracy or Consistency |
| "Today's dashboard says yesterday's data" | Timeliness |
| "Got an exception parsing this field" | Validity |
| "User exists twice" | Uniqueness |
| "FK lookup failed" | Integrity |
| "Country code is 'America' instead of 'US'" | Conformity |
| "Order value is $10 trillion" | Reasonableness (or Validity if exceeds type bounds) |
