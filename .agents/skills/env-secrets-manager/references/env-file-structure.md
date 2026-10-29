# .env File Structure & Startup Validation

Read this when scaffolding a project's environment files, setting `.gitignore` patterns, or adding required-variable validation at startup.

## .env File Structure

### Canonical Layout

```bash
# ─── Application ───────────────────────────────────
APP_NAME=myapp
APP_ENV=development              # development | staging | production
APP_PORT=3000
APP_URL=http://localhost:3000    # REQUIRED: public base URL
APP_SECRET=                      # REQUIRED: min 32 chars, used for signing

# ─── Database ──────────────────────────────────────
DATABASE_URL=                    # REQUIRED: full connection string
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_SSL=false               # true in staging/production

# ─── Authentication ────────────────────────────────
AUTH_JWT_SECRET=                  # REQUIRED: min 32 chars
AUTH_JWT_EXPIRY=3600             # seconds
AUTH_REFRESH_SECRET=             # REQUIRED: min 32 chars
AUTH_REFRESH_EXPIRY=604800       # 7 days in seconds

# ─── Third-Party Services ─────────────────────────
STRIPE_SECRET_KEY=               # REQUIRED in production
STRIPE_WEBHOOK_SECRET=           # REQUIRED in production
STRIPE_PUBLISHABLE_KEY=          # REQUIRED (public, safe to expose)
SENDGRID_API_KEY=                # REQUIRED for email features
SENTRY_DSN=                      # Optional: error tracking

# ─── Storage ───────────────────────────────────────
AWS_ACCESS_KEY_ID=               # Prefer IAM roles in production
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET=

# ─── Monitoring ────────────────────────────────────
DD_API_KEY=
LOG_LEVEL=debug                  # debug | info | warn | error
```

### File Hierarchy

```
.env.example        → Committed to git. Keys only, no values. Safe defaults noted.
.env                → Local development. NEVER committed. In .gitignore.
.env.local          → Local overrides. NEVER committed.
.env.test           → Test environment. May be committed if no secrets.
.env.staging        → Reference only. Actual values in secret manager.
.env.production     → NEVER exists on disk. Pulled from secret manager at runtime.
```

## .gitignore Patterns (Required)

```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.development
.env.staging
.env.production

# Secret files
*.pem
*.key
*.p12
*.pfx
secrets.json
secrets.yaml
credentials.json
service-account*.json

# Cloud credentials
.aws/credentials
.gcloud/

# Terraform state (may contain secrets)
*.tfstate
*.tfstate.backup
```

## Startup Validation Script

```python
#!/usr/bin/env python3
"""Validate required environment variables at application startup."""

import os
import sys
import re

REQUIRED_VARS = {
    "APP_SECRET": {"min_length": 32, "description": "Application signing secret"},
    "DATABASE_URL": {"pattern": r"^postgres(ql)?://", "description": "PostgreSQL connection string"},
    "AUTH_JWT_SECRET": {"min_length": 32, "description": "JWT signing secret"},
}

REQUIRED_IN_PRODUCTION = {
    "STRIPE_SECRET_KEY": {"pattern": r"^sk_(live|test)_", "description": "Stripe secret key"},
    "STRIPE_WEBHOOK_SECRET": {"pattern": r"^whsec_", "description": "Stripe webhook secret"},
    "SENDGRID_API_KEY": {"pattern": r"^SG\.", "description": "SendGrid API key"},
    "SENTRY_DSN": {"pattern": r"^https://", "description": "Sentry DSN"},
}

def validate() -> list[str]:
    errors = []
    env = os.environ.get("APP_ENV", "development")

    vars_to_check = dict(REQUIRED_VARS)
    if env == "production":
        vars_to_check.update(REQUIRED_IN_PRODUCTION)

    for var_name, rules in vars_to_check.items():
        value = os.environ.get(var_name, "")

        if not value:
            errors.append(f"MISSING: {var_name} — {rules['description']}")
            continue

        if "min_length" in rules and len(value) < rules["min_length"]:
            errors.append(
                f"TOO SHORT: {var_name} is {len(value)} chars, need {rules['min_length']}+"
            )

        if "pattern" in rules and not re.match(rules["pattern"], value):
            errors.append(
                f"INVALID FORMAT: {var_name} does not match expected pattern"
            )

    return errors

if __name__ == "__main__":
    errors = validate()
    if errors:
        print("Environment validation FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  {e}", file=sys.stderr)
        sys.exit(1)
    print("Environment validation passed.")
```
