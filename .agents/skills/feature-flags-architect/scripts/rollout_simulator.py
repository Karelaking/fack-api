#!/usr/bin/env python3
"""
rollout_simulator.py — Model a feature flag rollout: blast radius, time-to-detect,
and recommended ramp schedule.

Given a user count, traffic profile, and a ramp profile (aggressive / standard /
cautious / conservative / phased), emits per-step blast-radius metrics and a
schedule the team can follow.

Stdlib only. JSON or human-readable output.

Usage:
    python3 rollout_simulator.py --users 1000000 --profile standard
    python3 rollout_simulator.py --users 5000000 --profile cautious --sessions-per-user-per-day 4 --time-to-detect 5 --format json
    python3 rollout_simulator.py --users 10000000 --profile custom --custom-steps "0.01,0.05,0.25,0.5,1.0"
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone


@dataclass
class RampStep:
    name: str
    percent: float
    hold_hours: int
    watch_metrics: list[str]
    exit_criteria: str


@dataclass
class RampProfile:
    name: str
    description: str
    steps: list[RampStep]
    use_when: str


def _step(name: str, pct: float, hold_hours: int, exit_criteria: str, watch: list[str] | None = None) -> RampStep:
    return RampStep(
        name=name,
        percent=pct,
        hold_hours=hold_hours,
        watch_metrics=watch or ["error_rate", "latency_p99", "business_kpi"],
        exit_criteria=exit_criteria,
    )


PROFILES: dict[str, RampProfile] = {
    "aggressive": RampProfile(
        name="aggressive",
        description="Fast ramp for low-risk, additive UI changes",
        use_when="Pure UI / cosmetic / copy / theme. No backend logic change.",
        steps=[
            _step("dogfood", 0.0, 2, "No blocker bugs from internal use", ["manual_qa", "frontend_errors"]),
            _step("canary", 0.01, 2, "Error rate within 2× baseline"),
            _step("early", 0.10, 4, "Error rate within 1.5× baseline"),
            _step("majority", 0.50, 4, "Same"),
            _step("full", 1.00, 12, "Stable for 12h"),
            _step("cleanup", 1.00, 24, "Remove flag + dead branch"),
        ],
    ),
    "standard": RampProfile(
        name="standard",
        description="Default ramp for new features with backend logic",
        use_when="New customer-visible feature, normal risk, dual code paths",
        steps=[
            _step("dogfood", 0.0, 24, "No blocker bugs from internal use", ["manual_qa", "error_rate"]),
            _step("canary", 0.01, 24, "Error rate within 2× baseline; latency p99 within 1.5×"),
            _step("early", 0.05, 24, "Same; no negative KPI signal"),
            _step("quarter", 0.25, 24, "Same; cost per request within 1.5×"),
            _step("majority", 0.50, 24, "Same; full business-KPI window observed"),
            _step("full", 1.00, 168, "Stable for one week"),
            _step("cleanup", 1.00, 24, "Remove flag + dead branch"),
        ],
    ),
    "cautious": RampProfile(
        name="cautious",
        description="Backend migration with dual-write strategy",
        use_when="Replacing a backend system; dual-write + shadow-read",
        steps=[
            _step("dual-write-on", 0.0, 168, "Write drift between systems < 0.01%; alerting wired", ["write_drift", "old_write_rate", "new_write_rate"]),
            _step("shadow-read-1pct", 0.01, 168, "Shadow read drift < 0.1% for 1 week", ["read_drift", "new_read_latency"]),
            _step("read-from-new-1pct", 0.01, 96, "Error rate within 1.2× baseline"),
            _step("read-from-new-10pct", 0.10, 96, "Same; latency within 1.5×"),
            _step("read-from-new-50pct", 0.50, 96, "Same"),
            _step("read-from-new-100pct", 1.00, 168, "Stable for 1 week"),
            _step("stop-writing-old", 1.00, 168, "Confirmed; no readers remaining on old", ["old_read_rate", "old_write_rate"]),
            _step("decommission-old", 1.00, 0, "Remove old system + dual-write flag"),
        ],
    ),
    "conservative": RampProfile(
        name="conservative",
        description="Irreversible operations — schema migration, money, compliance events",
        use_when="Writes can't be undone; cohort-based rollout required",
        steps=[
            _step("internal-only", 0.0, 336, "Manual audit of every write; 2 weeks", ["audit_log_completeness", "write_outcome"]),
            _step("audit-cohort-10", 0.0001, 336, "10 hand-picked accounts; 2 weeks observation", ["per_account_audit"]),
            _step("free-1pct-cohort", 0.01, 168, "Explicit allowlist (not random %); 1 week"),
            _step("free-10pct-tier", 0.10, 336, "Free tier only, 2 weeks"),
            _step("smb-50pct-tier", 0.50, 336, "SMB tier, 2 weeks"),
            _step("enterprise-opt-in", 0.80, 336, "Enterprise with explicit notice + opt-out, 2 weeks"),
            _step("full", 1.00, 336, "All tiers, 2 weeks observation"),
            _step("cleanup", 1.00, 168, "Remove flag, document migration complete"),
        ],
    ),
    "phased": RampProfile(
        name="phased",
        description="Third-party dependency swap (payment gateway, SSO, CDN)",
        use_when="External vendor change; phase by segment, never random %",
        steps=[
            _step("internal", 0.0, 168, "Employee accounts only", ["dependency_error_rate", "fallback_used"]),
            _step("single-customer", 0.001, 168, "One consenting customer; 1 week"),
            _step("free-tier-1-region", 0.05, 336, "Free tier, one region, 2 weeks"),
            _step("free-tier-global", 0.30, 336, "Free tier globally"),
            _step("smb", 0.60, 336, "SMB tier with notice"),
            _step("enterprise-with-notice", 0.95, 504, "Enterprise + opt-out, 3 weeks"),
            _step("decommission-old", 1.00, 168, "Cut over fully; old vendor decommissioned"),
        ],
    ),
}


@dataclass
class StepResult:
    step_name: str
    percent: float
    hold_hours: int
    exposed_users: int
    exposed_sessions_per_day: int
    sessions_at_risk_during_detection: int
    cumulative_runtime_hours: int
    cumulative_runtime_days: float
    target_date: str | None
    exit_criteria: str
    watch_metrics: list[str]
    recommended_alert_thresholds: dict[str, str]


def compute_recommended_thresholds(baseline_error_rate: float, baseline_latency_p99_ms: float, severity: str) -> dict[str, str]:
    """Suggest stop-condition thresholds based on baseline metrics."""
    multipliers = {
        "low": {"error": 3.0, "latency": 2.0},
        "medium": {"error": 2.0, "latency": 1.5},
        "high": {"error": 1.5, "latency": 1.3},
    }
    m = multipliers.get(severity, multipliers["medium"])
    return {
        "error_rate_stop": f">{baseline_error_rate * m['error']:.4f} ({m['error']}× baseline) for 5 min",
        "latency_p99_stop": f">{baseline_latency_p99_ms * m['latency']:.0f}ms ({m['latency']}× baseline) for 10 min",
        "business_kpi_stop": "<95% of baseline conversion sustained for 1h",
        "cost_stop": ">2× baseline cost/request for 30 min",
        "support_volume_stop": ">5 tickets tagged with feature name in 1h",
    }


def simulate(
    profile: RampProfile,
    total_users: int,
    sessions_per_user_per_day: float,
    time_to_detect_min: int,
    time_to_mitigate_min: int,
    baseline_error_rate: float,
    baseline_latency_p99_ms: float,
    severity: str,
    start_date: datetime | None = None,
) -> list[StepResult]:
    start = start_date or datetime.now(timezone.utc)
    cumulative_hours = 0
    out: list[StepResult] = []
    for step in profile.steps:
        exposed = int(total_users * step.percent)
        sessions = int(exposed * sessions_per_user_per_day)
        # blast radius during detect+mitigate window
        window_h = (time_to_detect_min + time_to_mitigate_min) / 60.0
        at_risk = int(exposed * sessions_per_user_per_day * (window_h / 24.0))
        cumulative_hours += step.hold_hours
        target_date = (start + timedelta(hours=cumulative_hours)).date().isoformat()
        out.append(
            StepResult(
                step_name=step.name,
                percent=step.percent,
                hold_hours=step.hold_hours,
                exposed_users=exposed,
                exposed_sessions_per_day=sessions,
                sessions_at_risk_during_detection=at_risk,
                cumulative_runtime_hours=cumulative_hours,
                cumulative_runtime_days=round(cumulative_hours / 24.0, 2),
                target_date=target_date,
                exit_criteria=step.exit_criteria,
                watch_metrics=step.watch_metrics,
                recommended_alert_thresholds=compute_recommended_thresholds(
                    baseline_error_rate, baseline_latency_p99_ms, severity
                ),
            )
        )
    return out


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Simulate a feature flag rollout: blast radius + schedule",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--users", type=int, required=True, help="Total user/customer count")
    p.add_argument(
        "--profile",
        choices=list(PROFILES.keys()) + ["custom"],
        default="standard",
        help="Ramp profile (default: standard)",
    )
    p.add_argument(
        "--custom-steps",
        help="For --profile=custom: comma-separated percents, e.g. '0.01,0.05,0.25,0.5,1.0'",
    )
    p.add_argument(
        "--custom-hold-hours",
        type=int,
        default=24,
        help="For --profile=custom: hold time between steps (default: 24)",
    )
    p.add_argument(
        "--sessions-per-user-per-day",
        type=float,
        default=2.0,
        help="Average sessions per user per day (default: 2)",
    )
    p.add_argument(
        "--time-to-detect",
        type=int,
        default=5,
        help="Minutes to detect a regression via monitoring (default: 5)",
    )
    p.add_argument(
        "--time-to-mitigate",
        type=int,
        default=10,
        help="Minutes to mitigate (flip flag, verify) (default: 10)",
    )
    p.add_argument(
        "--baseline-error-rate",
        type=float,
        default=0.001,
        help="Current baseline error rate (e.g. 0.001 = 0.1%%) (default: 0.001)",
    )
    p.add_argument(
        "--baseline-latency-p99-ms",
        type=float,
        default=200,
        help="Current baseline p99 latency in ms (default: 200)",
    )
    p.add_argument(
        "--severity",
        choices=["low", "medium", "high"],
        default="medium",
        help="Change severity — shapes alert thresholds (default: medium)",
    )
    p.add_argument("--start-date", help="Ramp start date (ISO 8601). Default: today.")
    p.add_argument("--format", choices=["json", "human"], default="human")
    p.add_argument("--output", help="Output file path")
    return p.parse_args()


def build_custom_profile(percents: list[float], hold_hours: int) -> RampProfile:
    steps: list[RampStep] = [
        RampStep(
            name=f"step_{i+1}_{int(p*100)}pct" if p < 1 else "full",
            percent=p,
            hold_hours=hold_hours,
            watch_metrics=["error_rate", "latency_p99", "business_kpi"],
            exit_criteria=f"All metrics within thresholds for {hold_hours}h",
        )
        for i, p in enumerate(percents)
    ]
    return RampProfile(name="custom", description="User-supplied ramp", use_when="Custom risk profile", steps=steps)


def render_human(profile: RampProfile, results: list[StepResult], args: argparse.Namespace) -> str:
    out = []
    out.append("=" * 72)
    out.append(f"ROLLOUT SIMULATION — profile: {profile.name}")
    out.append("=" * 72)
    out.append(f"Description: {profile.description}")
    out.append(f"Use when:    {profile.use_when}")
    out.append("")
    out.append(f"Total users:        {args.users:,}")
    out.append(f"Sessions/user/day:  {args.sessions_per_user_per_day}")
    out.append(f"Time to detect:     {args.time_to_detect} min")
    out.append(f"Time to mitigate:   {args.time_to_mitigate} min")
    out.append(f"Baseline error rt:  {args.baseline_error_rate}")
    out.append(f"Baseline p99 lat:   {args.baseline_latency_p99_ms} ms")
    out.append(f"Severity:           {args.severity}")
    out.append("")
    out.append("-" * 72)
    out.append(f"{'STEP':<22} {'%':>7} {'EXPOSED':>10} {'AT_RISK':>10} {'HOLD':>6} {'DAY':>6}")
    out.append("-" * 72)
    for r in results:
        pct_str = f"{r.percent*100:.2f}%" if r.percent < 1 else "100%"
        out.append(
            f"{r.step_name:<22} {pct_str:>7} {r.exposed_users:>10,} {r.sessions_at_risk_during_detection:>10,} {r.hold_hours:>5}h {r.cumulative_runtime_days:>6.1f}"
        )
    out.append("")
    if results:
        last = results[-1]
        out.append(f"Total ramp duration: {last.cumulative_runtime_days:.1f} days")
        out.append(f"Final target date:   {last.target_date}")
    out.append("")
    out.append("Recommended alert thresholds (apply per step):")
    if results:
        for metric, thresh in results[0].recommended_alert_thresholds.items():
            out.append(f"  {metric:<22} {thresh}")
    out.append("")
    out.append("Per-step exit criteria:")
    for r in results:
        pct_str = f"{r.percent*100:.2f}%" if r.percent < 1 else "100%"
        out.append(f"  [{r.step_name} @ {pct_str}] {r.exit_criteria}")
        out.append(f"     watch: {', '.join(r.watch_metrics)}")
    return "\n".join(out)


def main() -> int:
    args = parse_args()

    if args.profile == "custom":
        if not args.custom_steps:
            print("error: --custom-steps required when --profile=custom", file=sys.stderr)
            return 2
        try:
            percents = [float(s.strip()) for s in args.custom_steps.split(",")]
        except ValueError:
            print("error: --custom-steps must be comma-separated floats", file=sys.stderr)
            return 2
        if any(p < 0 or p > 1 for p in percents):
            print("error: each custom step must be in [0, 1]", file=sys.stderr)
            return 2
        profile = build_custom_profile(percents, args.custom_hold_hours)
    else:
        profile = PROFILES[args.profile]

    start_date = None
    if args.start_date:
        try:
            start_date = datetime.fromisoformat(args.start_date.replace("Z", "+00:00"))
        except ValueError:
            print(f"error: invalid --start-date: {args.start_date}", file=sys.stderr)
            return 2

    results = simulate(
        profile=profile,
        total_users=args.users,
        sessions_per_user_per_day=args.sessions_per_user_per_day,
        time_to_detect_min=args.time_to_detect,
        time_to_mitigate_min=args.time_to_mitigate,
        baseline_error_rate=args.baseline_error_rate,
        baseline_latency_p99_ms=args.baseline_latency_p99_ms,
        severity=args.severity,
        start_date=start_date,
    )

    if args.format == "json":
        out = json.dumps(
            {
                "profile": {"name": profile.name, "description": profile.description, "use_when": profile.use_when},
                "inputs": {
                    "users": args.users,
                    "sessions_per_user_per_day": args.sessions_per_user_per_day,
                    "time_to_detect_min": args.time_to_detect,
                    "time_to_mitigate_min": args.time_to_mitigate,
                    "baseline_error_rate": args.baseline_error_rate,
                    "baseline_latency_p99_ms": args.baseline_latency_p99_ms,
                    "severity": args.severity,
                },
                "steps": [asdict(r) for r in results],
                "total_duration_days": results[-1].cumulative_runtime_days if results else 0,
            },
            indent=2,
            default=str,
        )
    else:
        out = render_human(profile, results, args)

    if args.output:
        from pathlib import Path
        Path(args.output).write_text(out)
        print(f"wrote {args.output}", file=sys.stderr)
    else:
        print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
