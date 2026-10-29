#!/usr/bin/env python3
"""
kill_switch_runbook.py — Generate a structured runbook for a kill-switch feature flag.

Given a flag name, dependency, and oncall rotation, emits a runbook in Markdown
covering when to flip, how to flip, expected behavior, validation steps, and
post-incident actions. Designed so anyone on oncall can flip the switch without
paging the feature owner.

Stdlib only. Markdown or JSON output.

Usage:
    python3 kill_switch_runbook.py --flag ops.recs.kill_switch --feature recommendations --dependency recs-svc --oncall sre-rotation
    python3 kill_switch_runbook.py --flag ops.payments.psp_v2.kill --feature 'PSP v2 payment flow' --dependency 'PSP-v2 vendor API' --oncall payments-oncall --fail-mode closed --format json
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from pathlib import Path


@dataclass
class Runbook:
    flag_name: str
    feature_name: str
    feature_description: str
    dependency: str
    owner_team: str
    oncall_rotation: str
    fail_mode: str
    default_state: str
    flag_console_url: str
    when_to_flip: list[str]
    how_to_flip: list[str]
    expected_behavior_after_flip: list[str]
    validation_steps: list[str]
    when_to_flip_back: list[str]
    post_flip_actions: list[str]
    related_dashboards: list[str]
    escalation: list[str]
    metadata: dict[str, str] = field(default_factory=dict)


def build_runbook(args: argparse.Namespace) -> Runbook:
    is_fail_open = args.fail_mode == "open"

    when_to_flip = [
        f"Error rate on `{args.dependency}` exceeds {args.error_threshold_pct}% for {args.error_window_min}+ minutes",
        f"p99 latency on `{args.dependency}` exceeds {args.latency_threshold_ms}ms for {args.error_window_min}+ minutes",
        f"`{args.dependency}` is reporting a service-status incident or scheduled outage",
        f"Customer support is seeing > 5 tickets in 1h tagged with the {args.feature_name} feature",
        "An on-call decision to mitigate during a broader incident, when this dependency is implicated",
    ]
    if args.extra_when:
        when_to_flip.extend(args.extra_when)

    how_to_flip = [
        f"Open the flag console: {args.flag_console_url}",
        f"Locate flag: `{args.flag_name}`",
        "Set the value to **OFF** (this disables the feature; the fallback path activates)",
        f"Justification field: `Incident <INC-ID> — flipping per runbook for {args.feature_name}`",
        "Save the change. Confirm the change appears in the audit log.",
    ]

    expected_behavior = []
    if is_fail_open:
        expected_behavior.append(
            f"Traffic continues to flow. The {args.feature_name} feature is **disabled**; user requests fall back to a degraded path."
        )
        expected_behavior.append(
            f"Calls to `{args.dependency}` stop. Other dependent calls (auth, logging, etc.) continue as normal."
        )
    else:
        expected_behavior.append(
            f"The {args.feature_name} feature is **blocked**. Users attempting this action receive an error / disabled state."
        )
        expected_behavior.append(
            f"This is a fail-closed kill switch: when flipped OFF, dependent traffic is rejected rather than degraded silently."
        )
    expected_behavior.append(
        f"Metrics: `{args.dependency}` request rate drops to ~0; fallback path metric increases."
    )
    expected_behavior.append("User-visible impact: documented in the feature's customer-comms playbook.")

    validation = [
        f"Within 2 minutes: confirm `{args.dependency}` request rate drops to ~0 in your monitoring tool.",
        f"Within 2 minutes: confirm fallback path is active (via specific metric/log query — fill in per environment).",
        f"Confirm error rate on the parent feature returns to ≤ baseline within {args.error_window_min} minutes.",
        "If validation fails, escalate (see Escalation section).",
    ]

    when_to_flip_back = [
        f"`{args.dependency}` reports healthy via its `/health` endpoint for 30+ minutes",
        f"Error rate on `{args.dependency}` is at baseline for 30+ minutes",
        "Underlying root-cause is identified and remediated (e.g., vendor outage resolved, hotfix deployed)",
        "Manual sign-off by oncall lead — do not auto-unflip",
        "Customer-comms plan executed if customers were notified during the outage",
    ]

    post_flip = [
        "File an incident ticket (or update the existing one) with: flip time, flipped-by, justification.",
        f"Notify {args.owner_team} channel with summary.",
        "Schedule blameless post-mortem within 5 business days for any flip lasting > 30 min.",
        "Update this runbook if the procedure differed from documented (PR to the runbook repo).",
        "Add a 'flag flip event' marker on relevant dashboards for future correlation.",
    ]

    related_dashboards = args.dashboards or [
        f"`{args.dependency}` service health dashboard",
        f"`{args.feature_name}` feature KPI dashboard",
        "Application error-rate overview",
        "Flag-system audit log",
    ]

    escalation = [
        f"First responder: anyone on `{args.oncall_rotation}` rotation",
        f"Second escalation: feature owner — `{args.owner_team}` lead",
        "Third escalation: platform / SRE leadership",
        "Vendor escalation (if dependency is third-party): contact info in vendor playbook",
    ]

    return Runbook(
        flag_name=args.flag_name,
        feature_name=args.feature_name,
        feature_description=args.description or f"Feature gated by {args.flag_name}",
        dependency=args.dependency,
        owner_team=args.owner_team,
        oncall_rotation=args.oncall_rotation,
        fail_mode=args.fail_mode,
        default_state="ON (feature enabled)",
        flag_console_url=args.flag_console_url,
        when_to_flip=when_to_flip,
        how_to_flip=how_to_flip,
        expected_behavior_after_flip=expected_behavior,
        validation_steps=validation,
        when_to_flip_back=when_to_flip_back,
        post_flip_actions=post_flip,
        related_dashboards=related_dashboards,
        escalation=escalation,
        metadata={
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "runbook_version": "1.0",
        },
    )


def render_markdown(r: Runbook) -> str:
    out: list[str] = []
    out.append(f"# Runbook: {r.feature_name} Kill Switch")
    out.append("")
    out.append(f"_Generated: {r.metadata['generated_at']}_  ")
    out.append(f"_Runbook version: {r.metadata['runbook_version']}_")
    out.append("")
    out.append("## Flag")
    out.append("")
    out.append(f"- **Name**: `{r.flag_name}`")
    out.append(f"- **Type**: ops (kill switch)")
    out.append(f"- **Default state**: {r.default_state}")
    out.append(f"- **Fail mode**: {r.fail_mode} ({'allows traffic, degrades feature' if r.fail_mode == 'open' else 'rejects traffic when off'})")
    out.append(f"- **Owner team**: {r.owner_team}")
    out.append(f"- **Oncall rotation**: {r.oncall_rotation}")
    out.append(f"- **Flag console**: {r.flag_console_url}")
    out.append(f"- **Dependency**: `{r.dependency}`")
    out.append("")
    out.append("## Description")
    out.append("")
    out.append(r.feature_description)
    out.append("")
    out.append("## When to flip OFF")
    out.append("")
    for item in r.when_to_flip:
        out.append(f"- {item}")
    out.append("")
    out.append("## How to flip")
    out.append("")
    for i, step in enumerate(r.how_to_flip, 1):
        out.append(f"{i}. {step}")
    out.append("")
    out.append("## Expected behavior after flip")
    out.append("")
    for item in r.expected_behavior_after_flip:
        out.append(f"- {item}")
    out.append("")
    out.append("## Validation")
    out.append("")
    for i, step in enumerate(r.validation_steps, 1):
        out.append(f"{i}. {step}")
    out.append("")
    out.append("## When to flip BACK ON")
    out.append("")
    for item in r.when_to_flip_back:
        out.append(f"- {item}")
    out.append("")
    out.append("## Post-flip actions")
    out.append("")
    for item in r.post_flip_actions:
        out.append(f"- {item}")
    out.append("")
    out.append("## Related dashboards")
    out.append("")
    for d in r.related_dashboards:
        out.append(f"- {d}")
    out.append("")
    out.append("## Escalation")
    out.append("")
    for e in r.escalation:
        out.append(f"- {e}")
    out.append("")
    out.append("---")
    out.append("")
    out.append("## Test schedule")
    out.append("")
    out.append("This kill switch must be tested to remain trustworthy:")
    out.append("")
    out.append("| Cadence | Where | Action |")
    out.append("|---------|-------|--------|")
    out.append("| Every commit | CI | Both flag states exercised by test suite |")
    out.append("| Monthly | Staging | Flip to OFF, confirm fallback works, flip back |")
    out.append("| Quarterly | Production | Flip during low-traffic window for 15 min; record results |")
    out.append("")
    out.append("Last tested: _<update on each test>_")
    return "\n".join(out)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Generate a kill-switch runbook for a feature flag",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--flag", dest="flag_name", required=True, help="Flag key, e.g. ops.recs.kill_switch")
    p.add_argument("--feature", dest="feature_name", required=True, help="Human name of the feature, e.g. 'Recommendations'")
    p.add_argument("--description", help="One-paragraph description of what the feature does")
    p.add_argument("--dependency", required=True, help="External dependency being gated, e.g. recs-svc, payment-vendor")
    p.add_argument("--owner-team", default="unknown-team", help="Team that owns the feature")
    p.add_argument("--oncall", dest="oncall_rotation", default="platform-oncall", help="Oncall rotation name")
    p.add_argument(
        "--fail-mode",
        choices=["open", "closed"],
        default="open",
        help="open=fallback to degraded path; closed=reject traffic (default: open)",
    )
    p.add_argument(
        "--flag-console-url",
        default="https://<your-flag-console>/flags/<flag-key>",
        help="URL to the flag in your flag console",
    )
    p.add_argument("--error-threshold-pct", type=float, default=10.0, help="Error %% that triggers flip (default: 10)")
    p.add_argument("--latency-threshold-ms", type=int, default=2000, help="p99 latency ms that triggers flip (default: 2000)")
    p.add_argument("--error-window-min", type=int, default=5, help="Minutes of sustained breach before flipping (default: 5)")
    p.add_argument("--dashboards", nargs="*", help="Override the related dashboards list")
    p.add_argument("--extra-when", nargs="*", help="Additional 'when to flip' conditions")
    p.add_argument("--format", choices=["markdown", "json"], default="markdown")
    p.add_argument("--output", help="Output file path")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    runbook = build_runbook(args)
    if args.format == "json":
        out = json.dumps(asdict(runbook), indent=2)
    else:
        out = render_markdown(runbook)
    if args.output:
        Path(args.output).write_text(out)
        print(f"wrote {args.output}", file=sys.stderr)
    else:
        print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
