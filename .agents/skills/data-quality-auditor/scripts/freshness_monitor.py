#!/usr/bin/env python3
"""
freshness_monitor.py — Monitor freshness SLA on a dataset's timestamp column.

Reads a CSV/JSON data file and reports whether the max timestamp in the freshness
column is within the SLA. Designed to be wrapped by an orchestrator (Airflow,
Dagster, cron) and have its exit code drive pipeline blocking.

Exit codes:
  0 — within SLA (pass)
  1 — SLA breach (fail)
  2 — error (couldn't determine)

Stdlib only. Human-readable or JSON output.

Usage:
    python3 freshness_monitor.py --data events.csv --column event_time --max-age-min 60
    python3 freshness_monitor.py --data events.json --column updated_at --max-age-min 15 --format json
    python3 freshness_monitor.py --data events.csv --column event_time --max-age-min 60 --now '2026-05-27T12:00:00Z'
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def load_rows(path: Path) -> list[dict[str, Any]]:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        with open(path, newline="") as f:
            return list(csv.DictReader(f))
    elif suffix == ".json":
        data = json.loads(path.read_text())
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return [data]
    raise ValueError(f"Unsupported format: {suffix}")


def parse_ts(value: Any) -> datetime | None:
    if value in (None, "", "null"):
        return None
    try:
        if isinstance(value, (int, float)):
            ts = float(value)
            # Heuristic: > 10^11 is ms, otherwise seconds
            ts = ts / 1000 if ts > 10**11 else ts
            return datetime.fromtimestamp(ts, tz=timezone.utc)
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (ValueError, OSError):
        return None


def find_max_ts(rows: list[dict[str, Any]], col: str) -> datetime | None:
    max_ts: datetime | None = None
    for r in rows:
        ts = parse_ts(r.get(col))
        if ts and (max_ts is None or ts > max_ts):
            max_ts = ts
    return max_ts


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Monitor freshness SLA on a dataset",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--data", required=True, help="Path to data file (CSV or JSON)")
    p.add_argument("--column", required=True, help="Timestamp column name")
    p.add_argument("--max-age-min", type=float, required=True, help="Maximum allowed age in minutes")
    p.add_argument("--now", help="Override current time (ISO 8601); default: actual now")
    p.add_argument("--format", choices=["human", "json"], default="human")
    p.add_argument("--output", help="Output file path")
    p.add_argument("--table-name", default="<table>", help="Table name for output (default: <table>)")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    try:
        rows = load_rows(Path(args.data))
    except (OSError, ValueError, json.JSONDecodeError) as e:
        print(f"error loading data: {e}", file=sys.stderr)
        return 2

    if args.now:
        try:
            now = datetime.fromisoformat(args.now.replace("Z", "+00:00"))
        except ValueError:
            print(f"error: invalid --now: {args.now}", file=sys.stderr)
            return 2
    else:
        now = datetime.now(timezone.utc)

    max_ts = find_max_ts(rows, args.column)
    if max_ts is None:
        result = {
            "table": args.table_name,
            "column": args.column,
            "status": "error",
            "max_age_min_threshold": args.max_age_min,
            "rows_examined": len(rows),
            "message": "No valid timestamps found in column",
        }
        out = json.dumps(result, indent=2) if args.format == "json" else f"error: no valid timestamps in column '{args.column}'"
        if args.output:
            Path(args.output).write_text(out)
        else:
            print(out)
        return 2

    age_min = (now - max_ts).total_seconds() / 60
    status = "pass" if age_min <= args.max_age_min else "fail"
    sla_budget_remaining_min = args.max_age_min - age_min

    result = {
        "table": args.table_name,
        "column": args.column,
        "status": status,
        "max_age_min_threshold": args.max_age_min,
        "current_age_min": round(age_min, 2),
        "sla_budget_remaining_min": round(sla_budget_remaining_min, 2),
        "max_timestamp": max_ts.isoformat(),
        "now": now.isoformat(),
        "rows_examined": len(rows),
        "message": "Within SLA" if status == "pass" else f"SLA breach: data is {age_min:.1f}min old, threshold is {args.max_age_min}min",
    }

    if args.format == "json":
        out = json.dumps(result, indent=2)
    else:
        emoji = "✓" if status == "pass" else "✗"
        out = (
            f"{emoji} FRESHNESS {status.upper()}\n"
            f"  Table:     {args.table_name}\n"
            f"  Column:    {args.column}\n"
            f"  Max ts:    {max_ts.isoformat()}\n"
            f"  Now:       {now.isoformat()}\n"
            f"  Age:       {age_min:.1f} min\n"
            f"  Threshold: {args.max_age_min} min\n"
            f"  Budget:    {sla_budget_remaining_min:.1f} min remaining\n"
            f"  Rows:      {len(rows)}\n"
            f"\n  {result['message']}"
        )

    if args.output:
        Path(args.output).write_text(out)
        print(f"wrote {args.output}", file=sys.stderr)
    else:
        print(out)

    return 0 if status == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
