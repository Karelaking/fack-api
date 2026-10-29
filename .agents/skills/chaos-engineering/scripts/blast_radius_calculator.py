#!/usr/bin/env python3
"""
blast_radius_calculator.py — Compute the worst-case blast radius of a chaos experiment.

Given total users/traffic, percent targeted, fault duration, abort latency, and
assumed fallback behavior, emits:
  - Worst-case affected users (no fallback)
  - Best-case affected users (fallback engages)
  - Recommended caps per maturity level (L1-L4)
  - Recommended abort thresholds
  - Cost estimate (if you provide cost-per-error or revenue-per-session)

Stdlib only. JSON or human output.

Usage:
    python3 blast_radius_calculator.py --users 1000000 --percent-targeted 1 --duration 300
    python3 blast_radius_calculator.py --users 10000000 --percent-targeted 5 --duration 600 \
        --sessions-per-user-per-day 4 --revenue-per-session 0.50 --fallback-success-rate 0.7 --format json
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class BlastEstimate:
    users_targeted: int
    sessions_during_window: int
    sessions_at_risk_worst_case: int
    sessions_at_risk_best_case: int
    abort_window_sec: int
    duration_sec: int
    revenue_at_risk_worst_case: float
    revenue_at_risk_best_case: float
    fallback_success_rate: float
    recommended_caps_by_maturity: dict[str, dict[str, object]]
    recommended_abort_thresholds: dict[str, str]
    recommended_pre_run_checks: list[str]


def compute(
    total_users: int,
    percent_targeted: float,
    duration_sec: int,
    detect_sec: int,
    abort_sec: int,
    sessions_per_user_per_day: float,
    fallback_success_rate: float,
    revenue_per_session: float,
) -> BlastEstimate:
    users_targeted = int(total_users * percent_targeted / 100.0)
    abort_window_sec = detect_sec + abort_sec
    # Sessions during the full intended duration
    sessions_during_window = int(users_targeted * sessions_per_user_per_day * duration_sec / 86400)
    # Sessions during the detect+abort window (these are the ones actually exposed
    # before the experiment is stopped; this is the practical blast radius)
    sessions_at_risk_window = int(users_targeted * sessions_per_user_per_day * abort_window_sec / 86400)
    sessions_at_risk_worst = sessions_at_risk_window
    sessions_at_risk_best = int(sessions_at_risk_window * (1.0 - fallback_success_rate))
    revenue_worst = sessions_at_risk_worst * revenue_per_session
    revenue_best = sessions_at_risk_best * revenue_per_session

    caps = {
        "L1": {
            "environment": "staging only",
            "max_pct_traffic": "n/a (staging)",
            "max_duration_sec": 1800,
            "blast_radius_users": 0,
            "comment": "Staging-only. No prod impact.",
        },
        "L2": {
            "environment": "staging, automated/scheduled",
            "max_pct_traffic": "n/a (staging)",
            "max_duration_sec": 3600,
            "blast_radius_users": 0,
            "comment": "Staging-automated. No prod impact.",
        },
        "L3": {
            "environment": "production canary, time-boxed",
            "max_pct_traffic": "5%",
            "max_duration_sec": 600,
            "blast_radius_users": int(total_users * 0.05 * abort_window_sec / 86400 * sessions_per_user_per_day),
            "comment": "5% cap on prod, < 10 min, observers required.",
        },
        "L4": {
            "environment": "production continuous",
            "max_pct_traffic": "10%",
            "max_duration_sec": 1800,
            "blast_radius_users": int(total_users * 0.10 * abort_window_sec / 86400 * sessions_per_user_per_day),
            "comment": "Continuous chaos: experiment bounded by error budget consumption, not by hard caps.",
        },
    }

    abort_thresholds = {
        "user_visible_error_rate_pct": ">0.5% sustained for 60s — abort",
        "p99_latency_pct_increase": ">100% above baseline for 5min — abort",
        "any_alert_on_unrelated_service": "abort",
        "support_ticket_volume": ">5 tickets tagged with feature in 1h — abort",
        "real_incident_detected": "abort immediately, hand off to oncall",
    }

    pre_run = [
        "Steady-state baseline captured (with screenshot)",
        "Observer assigned and watching dashboards",
        "Abort mechanism tested in last 7 days",
        "Customer support / oncall informed (for prod runs)",
        "Slack/chat thread open for live coordination",
        "Hypothesis written before injection",
        f"Blast radius < cap for current maturity level ({percent_targeted}% targeted)",
    ]

    return BlastEstimate(
        users_targeted=users_targeted,
        sessions_during_window=sessions_during_window,
        sessions_at_risk_worst_case=sessions_at_risk_worst,
        sessions_at_risk_best_case=sessions_at_risk_best,
        abort_window_sec=abort_window_sec,
        duration_sec=duration_sec,
        revenue_at_risk_worst_case=revenue_worst,
        revenue_at_risk_best_case=revenue_best,
        fallback_success_rate=fallback_success_rate,
        recommended_caps_by_maturity=caps,
        recommended_abort_thresholds=abort_thresholds,
        recommended_pre_run_checks=pre_run,
    )


def render_human(est: BlastEstimate, args: argparse.Namespace) -> str:
    out = []
    out.append("=" * 72)
    out.append("CHAOS BLAST RADIUS ESTIMATE")
    out.append("=" * 72)
    out.append(f"Total users:                  {args.users:,}")
    out.append(f"Targeted (%):                 {args.percent_targeted}%")
    out.append(f"Targeted users:               {est.users_targeted:,}")
    out.append(f"Sessions/user/day:            {args.sessions_per_user_per_day}")
    out.append(f"Intended duration:            {est.duration_sec}s ({est.duration_sec / 60:.1f} min)")
    out.append(f"Detect time:                  {args.detect_sec}s")
    out.append(f"Abort time:                   {args.abort_sec}s")
    out.append(f"Effective exposure window:    {est.abort_window_sec}s")
    out.append(f"Fallback success rate:        {est.fallback_success_rate * 100:.0f}%")
    out.append(f"Revenue/session:              ${args.revenue_per_session}")
    out.append("")
    out.append("-" * 72)
    out.append("PROJECTED IMPACT")
    out.append("-" * 72)
    out.append(f"Sessions over full duration:  {est.sessions_during_window:,}")
    out.append(f"Sessions in exposure window:  {est.sessions_at_risk_worst_case:,}  (no fallback)")
    out.append(f"Sessions impacted (best):     {est.sessions_at_risk_best_case:,}  (fallback engages {est.fallback_success_rate * 100:.0f}%)")
    out.append(f"Revenue at risk (worst):      ${est.revenue_at_risk_worst_case:,.2f}")
    out.append(f"Revenue at risk (best):       ${est.revenue_at_risk_best_case:,.2f}")
    out.append("")
    out.append("-" * 72)
    out.append("CAPS BY MATURITY LEVEL")
    out.append("-" * 72)
    for level, info in est.recommended_caps_by_maturity.items():
        out.append(f"\n{level}: {info['environment']}")
        out.append(f"  Max %% of traffic:    {info['max_pct_traffic']}")
        out.append(f"  Max duration:        {info['max_duration_sec']}s")
        out.append(f"  Blast radius:        {info['blast_radius_users']:,} sessions")
        out.append(f"  Note:                {info['comment']}")
    out.append("")
    out.append("-" * 72)
    out.append("RECOMMENDED ABORT THRESHOLDS")
    out.append("-" * 72)
    for k, v in est.recommended_abort_thresholds.items():
        out.append(f"  {k:<40}  {v}")
    out.append("")
    out.append("-" * 72)
    out.append("PRE-RUN CHECKLIST")
    out.append("-" * 72)
    for c in est.recommended_pre_run_checks:
        out.append(f"  [ ] {c}")
    return "\n".join(out)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Compute blast radius for a chaos experiment",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--users", type=int, required=True, help="Total active users in the system")
    p.add_argument(
        "--percent-targeted",
        type=float,
        required=True,
        help="Percent of users/traffic targeted by the experiment (e.g., 1 for 1%%)",
    )
    p.add_argument(
        "--duration",
        type=int,
        default=300,
        help="Intended duration in seconds (default: 300 = 5min)",
    )
    p.add_argument(
        "--detect-sec",
        type=int,
        default=60,
        help="Time to detect regression in seconds (default: 60)",
    )
    p.add_argument(
        "--abort-sec",
        type=int,
        default=30,
        help="Time to execute abort once decision made, in seconds (default: 30)",
    )
    p.add_argument(
        "--sessions-per-user-per-day",
        type=float,
        default=2.0,
        help="Average sessions per user per day (default: 2)",
    )
    p.add_argument(
        "--fallback-success-rate",
        type=float,
        default=0.0,
        help="Fraction of affected sessions that succeed via fallback (0-1, default: 0)",
    )
    p.add_argument(
        "--revenue-per-session",
        type=float,
        default=0.0,
        help="Revenue per session, for cost estimate (default: 0)",
    )
    p.add_argument("--format", choices=["human", "json"], default="human")
    p.add_argument("--output", help="Output file path")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    if not 0 <= args.percent_targeted <= 100:
        print("error: --percent-targeted must be 0-100", file=sys.stderr)
        return 2
    if not 0 <= args.fallback_success_rate <= 1:
        print("error: --fallback-success-rate must be 0-1", file=sys.stderr)
        return 2
    est = compute(
        total_users=args.users,
        percent_targeted=args.percent_targeted,
        duration_sec=args.duration,
        detect_sec=args.detect_sec,
        abort_sec=args.abort_sec,
        sessions_per_user_per_day=args.sessions_per_user_per_day,
        fallback_success_rate=args.fallback_success_rate,
        revenue_per_session=args.revenue_per_session,
    )
    if args.format == "json":
        out = json.dumps(
            {
                "inputs": {
                    "users": args.users,
                    "percent_targeted": args.percent_targeted,
                    "duration_sec": args.duration,
                    "detect_sec": args.detect_sec,
                    "abort_sec": args.abort_sec,
                    "sessions_per_user_per_day": args.sessions_per_user_per_day,
                    "fallback_success_rate": args.fallback_success_rate,
                    "revenue_per_session": args.revenue_per_session,
                },
                "estimate": asdict(est),
            },
            indent=2,
            default=str,
        )
    else:
        out = render_human(est, args)
    if args.output:
        Path(args.output).write_text(out)
        print(f"wrote {args.output}", file=sys.stderr)
    else:
        print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
