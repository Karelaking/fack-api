# DQ Check Catalog

Reference catalog of ~50 specific data quality check patterns organized by category (volume, freshness, schema, values, distribution). For each: when to use, detection heuristic, SQL pattern, tool snippets (dbt tests / Great Expectations / Soda Core), threshold guidance.

## Category summary

Five categories of checks, applied per dataset:

| Category | Examples | When |
|----------|----------|------|
| **Volume** | Row count is between min/max; row count is within ±N% of yesterday | Always for batch tables |
| **Freshness** | `MAX(updated_at)` ≤ N minutes ago; pipeline ran in last N minutes | All tables with refresh SLA |
| **Schema** | Column exists; column type matches; column ordinal; column nullable matches | All tables; especially upstream-sourced |
| **Values** | NOT NULL; UNIQUE; in enum; matches regex; min/max; reference exists | Per-column based on semantic role |
| **Distribution** | Mean / median / p99 within expected band; histogram doesn't shift; cardinality stable | Tables where data shape matters (ML features, analytics dimensions) |

---

## Volume checks

### V1: Row count between bounds

**When:** Table is expected to be at certain scale (e.g., users table should always have > 1000 rows).

**SQL:**
```sql
SELECT COUNT(*) AS row_count FROM mydb.mytable
HAVING COUNT(*) < :min_count OR COUNT(*) > :max_count;
```

**dbt test:**
```sql
{{ config(severity='error') }}
SELECT 1 FROM {{ ref('mytable') }} HAVING COUNT(*) < 1000
```

**Great Expectations:**
```python
expect_table_row_count_to_be_between(min_value=1000, max_value=10000000)
```

**Threshold:** Match expected scale. Use 0.5x-2x baseline as starting bounds.

### V2: Row count is within N% of prior period

**When:** Daily / hourly / weekly batch tables. Detects upstream pipeline failures.

**SQL:**
```sql
WITH today AS (SELECT COUNT(*) AS n FROM mytable WHERE day = CURRENT_DATE),
     yesterday AS (SELECT COUNT(*) AS n FROM mytable WHERE day = CURRENT_DATE - 1)
SELECT 1 WHERE ABS(today.n - yesterday.n) / yesterday.n > 0.10
```

**Threshold:** ±10% typical; ±25% for tables with seasonality; tighter (±2%) for very stable tables.

### V3: Row count by partition is non-zero

**When:** Partitioned table; missing partition = missing day's data.

**SQL:**
```sql
SELECT day FROM range_table
WHERE day NOT IN (SELECT DISTINCT day FROM mytable WHERE day >= CURRENT_DATE - 7)
```

### V4: Distinct count within band

**When:** Customer-impacting (e.g., active users today shouldn't drop 50%).

**SQL:**
```sql
SELECT COUNT(DISTINCT user_id) FROM events WHERE event_date = CURRENT_DATE
```
Compare to baseline.

---

## Freshness checks

### F1: Max event time recency

**When:** Real-time or near-real-time tables.

**SQL:**
```sql
SELECT MAX(event_time) AS max_event_time, NOW() - MAX(event_time) AS lag
FROM mytable
HAVING NOW() - MAX(event_time) > INTERVAL '15 minutes';
```

**Soda:**
```yaml
checks for events:
  - freshness(event_time) < 15m
```

### F2: Pipeline last-run timestamp

**When:** Batch pipelines; orchestrator-recorded last successful run.

Check `airflow.dag_runs` or equivalent: last successful run < expected interval.

### F3: End-to-end latency p95

**When:** Streaming pipelines.

**Pattern:**
```sql
SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (materialized_at - event_time))
FROM mytable
WHERE event_time > NOW() - INTERVAL '1 hour'
```
Alert if > SLA.

### F4: Partition arrival time

**When:** Date-partitioned tables.

Check that today's partition exists; alert if missing N hours past expected.

### F5: No silent stale (data present but didn't update)

**When:** Tables that should change frequently (e.g., metrics).

**SQL:**
```sql
SELECT COUNT(*) FROM mytable WHERE updated_at > NOW() - INTERVAL '1 hour'
HAVING COUNT(*) = 0
```

---

## Schema checks

### S1: Expected columns exist

**When:** All tables; especially upstream-sourced.

**SQL:**
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'mytable'
```
Compare to expected list.

**Great Expectations:**
```python
expect_table_columns_to_match_set(column_set=['id','name','email','created_at'])
```

### S2: Column types match

**When:** Schema-on-read tools or downstream parsers depend on types.

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'mytable' AND column_name = 'id' AND data_type != 'bigint'
```

### S3: Column ordinal stable

**When:** Tools that read by position (rare; usually a code smell).

### S4: Column nullability matches

**When:** Pipelines that depend on column being NOT NULL.

```sql
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_name = 'mytable' AND column_name = 'user_id' AND is_nullable != 'NO'
```

### S5: No new unexpected columns

**When:** Schema-on-write may silently add upstream columns; alert if so.

### S6: No removed columns (without coordinated change)

**When:** Backwards-compat protection. Removed column without a planned migration = potential bug.

---

## Value checks (per-column)

### Vc1: NOT NULL

**When:** Required fields, primary keys.

**dbt:**
```yaml
- name: id
  tests:
    - not_null
```

### Vc2: UNIQUE

**When:** Primary keys, business keys.

**dbt:**
```yaml
- name: id
  tests:
    - unique
```

### Vc3: In enum

**When:** Categorical fields with closed set.

**dbt:**
```yaml
- name: status
  tests:
    - accepted_values:
        values: ['active','inactive','deleted']
```

### Vc4: Matches regex

**When:** Format-validated fields (email, phone, URL).

**Great Expectations:**
```python
expect_column_values_to_match_regex(column='email', regex=r'^[^@]+@[^@]+\.[^@]+$')
```

### Vc5: Min/max

**When:** Numeric fields with sane bounds.

**SQL:**
```sql
SELECT COUNT(*) FROM mytable WHERE price < 0 OR price > 1000000
```

### Vc6: Length bounds

**When:** Text fields with reasonable length expectations.

```sql
SELECT COUNT(*) FROM mytable WHERE LENGTH(name) < 1 OR LENGTH(name) > 200
```

### Vc7: Date range

**When:** Dates expected within plausible range.

```sql
SELECT COUNT(*) FROM mytable WHERE event_date < '2010-01-01' OR event_date > CURRENT_DATE
```

### Vc8: Reference exists (FK)

**When:** Foreign-key style relationships.

**dbt:**
```yaml
- name: user_id
  tests:
    - relationships:
        to: ref('users')
        field: id
```

### Vc9: No leading/trailing whitespace

**When:** Field used as joinable key or display.

```sql
SELECT COUNT(*) FROM mytable WHERE email != TRIM(email)
```

### Vc10: Case consistency

**When:** Email, country code, currency code etc. should be normalized.

```sql
SELECT COUNT(*) FROM mytable WHERE email != LOWER(email)
```

### Vc11: No control characters

**When:** Text fields that should not contain tabs, newlines, NULs.

### Vc12: Sentinel value rate

**When:** Detect "Unknown" / "N/A" / "TBD" creeping in.

```sql
SELECT COUNT(*) FROM mytable WHERE col IN ('Unknown','N/A','TBD','null','None')
```

### Vc13: ISO compliance (country, currency, language)

**When:** Conformity to international standards.

```sql
SELECT COUNT(*) FROM mytable WHERE country_code NOT IN (SELECT code FROM iso_3166_1)
```

### Vc14: Date is not future

**When:** Timestamps that should be ≤ now.

```sql
SELECT COUNT(*) FROM mytable WHERE created_at > NOW()
```

### Vc15: Date order

**When:** Pairs of dates (start, end) where start should precede end.

```sql
SELECT COUNT(*) FROM mytable WHERE end_date < start_date
```

### Vc16: Cross-field business rule

**When:** Custom logic (e.g., "if user is on free plan, billing_cycle must be NULL").

```sql
SELECT COUNT(*) FROM users WHERE plan = 'free' AND billing_cycle IS NOT NULL
```

---

## Distribution checks

### D1: Null rate per column within band

**When:** Catch creeping data loss.

```sql
SELECT COUNT(*) FILTER (WHERE col IS NULL)::float / COUNT(*) AS null_rate
FROM mytable
HAVING null_rate > 0.05
```

### D2: Mean / median in expected range

**When:** Numeric fields where distribution shouldn't drift.

### D3: Standard deviation in expected range

**When:** Detect bimodal distribution from upstream change.

### D4: Cardinality (distinct count) stable

**When:** Categorical fields whose cardinality you understand.

```sql
SELECT COUNT(DISTINCT category) FROM mytable
```
Alert if jumps unexpectedly.

### D5: Histogram doesn't shift

**When:** Distribution stability matters (ML features, analytics dimensions).

Pattern: bin values into buckets; compare today's distribution to baseline using KS-test or similar.

### D6: Quantile bounds

**When:** Latency, price, value-like numerics where p99 matters.

```sql
SELECT PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time)
FROM events
```

### D7: Skew (long tail) detection

**When:** Fairness / fraud detection.

If top 1% of users account for > 50% of events, that's notable (could be bots).

### D8: Per-segment row counts

**When:** Multi-tenant data; one tenant shouldn't disappear.

```sql
SELECT tenant_id, COUNT(*)
FROM mytable
GROUP BY tenant_id
HAVING COUNT(*) < tenant_min_threshold(tenant_id)
```

---

## Cross-table / cross-system checks

### X1: Row count reconciliation

```sql
SELECT (SELECT COUNT(*) FROM orders) - (SELECT COUNT(*) FROM orders_replica)
HAVING result != 0
```

### X2: SUM reconciliation

```sql
SELECT ABS((SELECT SUM(amount) FROM orders) - (SELECT SUM(amount) FROM finance.orders))
HAVING result > 0.01
```

### X3: Cross-system business rule

E.g., "every paid user in CRM has a Stripe subscription."

```sql
SELECT u.id FROM crm.users u
WHERE u.plan != 'free'
  AND NOT EXISTS (SELECT 1 FROM stripe.subscriptions s WHERE s.user_id = u.id AND s.status = 'active')
```

### X4: Derived table matches source

E.g., `daily_revenue` (aggregated) should match `SELECT SUM(amount) ... GROUP BY day` from `orders`.

---

## Anomaly detection patterns

### A1: Statistical anomaly (Z-score)

When latest value > N standard deviations from baseline → anomaly.

### A2: Seasonal decomposition

Separate trend + seasonal + residual; alert on residual outliers.

### A3: Rule-based anomaly

"Conversion rate has been 5-8% for 90 days; today it's 0% → anomaly."

### A4: ML-based anomaly detection

Isolation forests, autoencoders for tables where the shape of the data is complex. Higher complexity, higher false-positive risk.

---

## Per-tool quick reference

### dbt tests

```yaml
version: 2
models:
  - name: users
    columns:
      - name: id
        tests:
          - not_null
          - unique
      - name: email
        tests:
          - not_null
          - unique
          - dbt_utils.expression_is_true:
              expression: "email = LOWER(email)"
      - name: country
        tests:
          - accepted_values:
              values: ['US','CA','MX','GB','DE','FR']
      - name: created_at
        tests:
          - dbt_utils.expression_is_true:
              expression: "created_at <= CURRENT_TIMESTAMP"
```

### Great Expectations

```python
from great_expectations.dataset import PandasDataset

ge_df = PandasDataset(df)
ge_df.expect_column_values_to_not_be_null('id')
ge_df.expect_column_values_to_be_unique('id')
ge_df.expect_column_values_to_match_regex('email', r'^[^@]+@[^@]+\.[^@]+$')
ge_df.expect_column_values_to_be_in_set('country', ['US','CA','MX','GB','DE','FR'])
ge_df.expect_column_values_to_be_between('age', min_value=0, max_value=130)
```

### Soda Core (YAML)

```yaml
checks for users:
  - row_count > 1000
  - missing_count(email) = 0
  - duplicate_count(id) = 0
  - invalid_count(email) = 0:
      valid_regex: '^[^@]+@[^@]+\.[^@]+$'
  - invalid_count(country) = 0:
      valid_values: ['US','CA','MX','GB','DE','FR']
  - freshness(updated_at) < 1h
```

### Plain SQL (works anywhere)

Combine the patterns above into a `dq_checks.sql` file run by your scheduler.

---

## Picking the right tool

| If you have | Use |
|------------|-----|
| dbt project | dbt tests + dbt-utils + dbt-expectations |
| Python ETL | Great Expectations or Soda Core |
| Polyglot stack, want one tool | Soda Core (or commercial Soda Cloud) |
| Data observability needed | Monte Carlo, Bigeye, Acceldata (commercial) |
| Custom needs | Plain SQL + your scheduler |

Don't run all tools in parallel. Pick one (or two) and standardize.

---

## Cheat sheet

| If you want to detect | Use |
|----------------------|-----|
| Pipeline silently failed | V1 (row count = 0) + F2 (last-run timestamp) |
| Schema changed | S1 (columns) + S2 (types) |
| Upstream stopped sending | F1 (max event time) |
| One bad upstream record | Vc4 (regex) + Vc16 (cross-field rule) |
| Bots / fraud | D7 (skew) + A1 (z-score) on user-level metrics |
| Migration error | X1 (row count) + X2 (sum reconciliation) |
| Slow degradation | D2/D3 (mean/std) + tracking trends over weeks |
