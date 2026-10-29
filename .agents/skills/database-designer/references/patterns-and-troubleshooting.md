# Database Designer — Patterns, Troubleshooting & Success Criteria

Read this when choosing an index type, avoiding common design mistakes, diagnosing tool
output, or checking work against the quality bar.

## Index Type Selection

| Index Type | Best For | Example |
|------------|----------|---------|
| B-tree | Range queries, sorting, equality | `CREATE INDEX idx ON tasks (status, created_date)` |
| Partial | Subset queries on hot data | `CREATE INDEX idx ON users (email) WHERE status = 'active'` |
| Covering | Avoiding table lookups | `CREATE INDEX idx ON users (email) INCLUDE (name, status)` |
| Hash | Exact match only | Primary keys, cache keys |
| GIN | JSONB, array, full-text | `CREATE INDEX idx ON docs USING GIN (data)` |

---

## Anti-Patterns

- **Over-indexing** -- every column indexed wastes write performance and storage; index only columns appearing in WHERE, JOIN, and ORDER BY
- **Missing foreign keys** -- relying on application-layer referential integrity leads to orphaned records; always declare FK constraints
- **VARCHAR(255) everywhere** -- oversized columns waste memory in indexes; right-size columns based on actual data
- **Premature denormalization** -- denormalize only when EXPLAIN ANALYZE shows join-related bottlenecks, not preemptively
- **Direct ALTER on large tables** -- `ALTER TABLE ... SET NOT NULL` on a 100M-row table locks the table; use expand-contract pattern
- **No validation queries in migrations** -- migrations without post-step validation risk silent data corruption

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Schema analyzer reports false 1NF violations | JSON or array columns detected as multi-valued fields | Review flagged columns; intentional JSONB/array usage is valid for document-style storage patterns |
| Index optimizer recommends indexes on low-selectivity columns | Boolean or status columns appear in frequent WHERE clauses | Use partial indexes (`WHERE status = 'active'`) instead of full-column indexes to reduce overhead |
| Migration generator produces high-risk steps for column type changes | Direct `ALTER COLUMN ... TYPE` can lock tables and fail on incompatible data | Use the `--zero-downtime` flag to generate expand-contract migration patterns with safe backfill steps |
| ERD output missing relationships | Foreign key constraints not declared in DDL or JSON input | Ensure all FK relationships are explicitly defined; the analyzer only detects declared constraints |
| Composite index column order seems wrong | Optimizer orders by estimated selectivity, not query clause order | Verify cardinality estimates in the schema JSON; provide `cardinality_estimate` per column for accurate ordering |
| Redundancy analysis flags covering indexes as overlapping | Overlap ratio calculation uses Jaccard similarity on column sets | Review flagged pairs manually; covering indexes with INCLUDE columns serve a different purpose than their subsets |
| Validation queries fail after migration | Target schema JSON does not match actual post-migration state | Run `--validate-only` before and after migration; ensure the target JSON reflects all intended changes precisely |

## Success Criteria

- Schema analysis detects 90%+ of normalization violations (1NF through BCNF) when provided complete DDL input
- Index recommendations reduce query execution time by 40%+ for analyzed query patterns (measured via EXPLAIN ANALYZE before/after)
- Migration scripts execute with zero data loss and include verified rollback for every forward step
- ERD generation produces valid Mermaid diagrams that render correctly for schemas with up to 50 tables
- Redundant index detection identifies 95%+ of duplicate and overlapping indexes with less than 5% false positive rate
- Zero-downtime migrations maintain full application availability during schema changes on tables with 10M+ rows
- Generated SQL statements are syntactically valid and compatible with PostgreSQL 14+ and MySQL 8.0+
