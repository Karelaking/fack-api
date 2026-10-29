# Best Practices, Pitfalls, Troubleshooting & Success Criteria

Read this before shipping a schema and when diagnosing migration, RLS, indexing, or locking problems.

## Common Pitfalls

- **No index on foreign keys** — every FK column needs an index for JOIN and CASCADE performance
- **Soft deletes without partial index** — `WHERE deleted_at IS NULL` without index causes full table scans
- **Sequential integer IDs exposed in URLs** — reveals entity count; use CUID2 or UUIDv7 instead
- **Adding NOT NULL to a large table** — locks the table; use the three-phase pattern above
- **Database enums for status fields** — altering enums requires migration; use text with CHECK constraint
- **No optimistic locking** — concurrent updates silently overwrite each other; add a `version` column
- **RLS not tested** — always test RLS policies with a non-superuser role in staging
- **Missing updated_at trigger** — without a trigger, updated_at only updates when application code remembers to set it

## Best Practices

1. **Timestamps on every table** — `created_at` and `updated_at` as TIMESTAMPTZ with server defaults
2. **Soft deletes for user-facing data** — `deleted_at` instead of hard DELETE for audit and recovery
3. **CUID2 or UUIDv7 as primary keys** — sortable, non-sequential, globally unique
4. **Index every foreign key column** — required for JOIN performance and CASCADE operations
5. **Partial indexes for filtered queries** — `WHERE deleted_at IS NULL` saves significant scan time
6. **RLS over application-level filtering** — the database enforces tenancy, not just application code
7. **Version column for optimistic locking** — `WHERE version = $expected_version` prevents lost updates
8. **Audit log with JSON snapshots** — store before/after state for compliance and debugging

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Migration locks table for minutes | Adding NOT NULL column or index on large table without batching | Use the three-phase migration pattern: add nullable, backfill in batches, then set NOT NULL |
| RLS policies silently return empty results | `current_setting('app.current_user_id')` not set before query | Verify middleware calls `set_config` at the start of every request; add a test that queries as a non-superuser role |
| Composite index not used by query planner | Columns in the WHERE clause do not match the index prefix order | Reorder index columns so equality predicates come first, then range predicates; run `EXPLAIN ANALYZE` to confirm |
| Soft-deleted records appear in API responses | Application queries missing `WHERE deleted_at IS NULL` filter | Add a default scope or database view that excludes soft-deleted rows; prefer RLS policy for enforcement |
| Optimistic locking conflicts spike after deploy | New code path writes without incrementing the `version` column | Audit all UPDATE statements to include `SET version = version + 1` and `WHERE version = $expected` |
| Foreign key CASCADE deletes are slow | Missing index on the child table's FK column | Add a B-tree index on every FK column; verify with `EXPLAIN` on a DELETE of the parent row |
| CUID2/UUIDv7 IDs cause index bloat over time | Text-based IDs are wider than integers, increasing B-tree page splits | Schedule `REINDEX CONCURRENTLY` during low-traffic windows; monitor `pg_stat_user_indexes` for bloat ratio |

## Success Criteria

- **Schema passes 3NF validation** — no transitive dependencies remain unless documented as intentional denormalization for read performance
- **All foreign key columns are indexed** — zero FK columns without a corresponding B-tree index, verified via `pg_indexes` query
- **Zero-downtime migrations verified** — every migration executes without `ACCESS EXCLUSIVE` locks exceeding 5 seconds on tables with 100K+ rows
- **RLS policies tested with non-superuser role** — at least one integration test per tenant-scoped table confirms cross-tenant data isolation
- **Type generation matches schema** — generated TypeScript interfaces or Pydantic models have zero drift from the current DDL, validated in CI
- **Query performance meets SLA** — 95th percentile query latency under 50ms for indexed queries on tables up to 10M rows
- **Audit log captures all mutations** — every INSERT, UPDATE, and DELETE on auditable tables produces a corresponding audit_log entry with before/after snapshots
