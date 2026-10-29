# DQ Maturity Model

Read this when assessing where a team's data-quality practice sits and deciding what to invest in next.

## DQ maturity model

Five levels. Most teams should target Level 3-4.

| Level | What | Effort |
|-------|------|--------|
| **L0 — Reactive** | "We find DQ issues when users complain." No automated checks. | None (until incidents pile up) |
| **L1 — Ad-hoc** | Some checks exist on critical tables; engineers write them as needed; no centralized framework. | Low |
| **L2 — Scheduled** | Checks run on every pipeline run; failures alert via Slack / pager. Catalog of checks lives in version control. | Medium |
| **L3 — Comprehensive** | Per-dataset SLAs; checks cover all 6 DQ dimensions; freshness + volume + schema monitoring is automatic for every table; data team owns DQ. | High |
| **L4 — Data-as-product** | DQ is part of every dataset's contract. Producers responsible for quality of what they emit. Consumers can subscribe to DQ events for upstream data. | Very high; org-wide investment |

L0 / L1 teams: read this skill, pick the most-painful 3 datasets, add L2-level checks first.
L3 teams: invest in observability tooling; consider data observability vendor or build internal.
L4 teams: think about data contracts and data mesh.
