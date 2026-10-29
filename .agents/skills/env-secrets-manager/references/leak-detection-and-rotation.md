# Secret Leak Detection, Rotation & Drift

Read this when scanning git history or commits for leaked secrets, running a credential rotation, or detecting environment drift.

## Secret Leak Detection

### Git History Scanner

```bash
#!/bin/bash
# Scan git history for leaked secrets

echo "Scanning git history for potential secrets..."

PATTERNS=(
  'AKIA[0-9A-Z]{16}'                          # AWS Access Key
  'AIza[0-9A-Za-z\-_]{35}'                    # Google API Key
  'sk_(live|test)_[0-9a-zA-Z]{24,}'           # Stripe Secret Key
  'ghp_[0-9a-zA-Z]{36}'                       # GitHub Personal Access Token
  'glpat-[0-9a-zA-Z\-]{20,}'                  # GitLab Personal Access Token
  'xoxb-[0-9]{10,}-[0-9]{10,}-[a-zA-Z0-9]{24}' # Slack Bot Token
  'SG\.[0-9A-Za-z\-_]{22}\.[0-9A-Za-z\-_]{43}' # SendGrid API Key
  '-----BEGIN (RSA |EC )?PRIVATE KEY-----'      # Private Keys
  'password\s*=\s*["\x27][^"\x27]{8,}["\x27]'  # Hardcoded passwords
)

FOUND=0
for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(git log -p --all -S "$pattern" --format="%H %an %ad %s" 2>/dev/null | head -20)
  if [ -n "$MATCHES" ]; then
    echo ""
    echo "FOUND pattern: $pattern"
    echo "$MATCHES"
    FOUND=$((FOUND + 1))
  fi
done

if [ "$FOUND" -gt 0 ]; then
  echo ""
  echo "WARNING: Found $FOUND potential secret patterns in git history."
  echo "Run 'git filter-repo' or BFG Repo-Cleaner to remove them."
  exit 1
else
  echo "No secrets detected in git history."
fi
```

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit — block commits containing secrets

PATTERNS=(
  'AKIA[0-9A-Z]{16}'
  'sk_(live|test)_[0-9a-zA-Z]{24,}'
  'ghp_[0-9a-zA-Z]{36}'
  '-----BEGIN (RSA |EC )?PRIVATE KEY-----'
)

FILES=$(git diff --cached --name-only --diff-filter=ACM)

for file in $FILES; do
  for pattern in "${PATTERNS[@]}"; do
    if git diff --cached -- "$file" | grep -qE "$pattern"; then
      echo "BLOCKED: Potential secret detected in $file"
      echo "Pattern: $pattern"
      echo "Remove the secret and try again."
      exit 1
    fi
  done
done
```

## Credential Rotation Playbook

### Step 1: Scope the Secret

```bash
# Find everywhere a secret is referenced
SECRET_NAME="STRIPE_SECRET_KEY"

# In code
grep -r "$SECRET_NAME" src/ lib/ app/ --include="*.ts" --include="*.py" -l

# In CI/CD
grep -r "$SECRET_NAME" .github/ .gitlab-ci.yml docker-compose.yml -l

# In infrastructure
grep -r "$SECRET_NAME" terraform/ k8s/ helm/ -l 2>/dev/null

# In secret managers
vault kv get -field=$SECRET_NAME secret/myapp/prod 2>/dev/null
aws ssm get-parameter --name "/myapp/prod/$SECRET_NAME" 2>/dev/null
doppler secrets get $SECRET_NAME --project myapp --config prod 2>/dev/null
```

### Step 2: Generate New Secret

```bash
# Generic secret (32 bytes, base64)
openssl rand -base64 32

# JWT secret (64 bytes for HS256)
openssl rand -base64 64

# API key format (alphanumeric)
openssl rand -hex 32
```

### Step 3: Dual-Write Period

```
Timeline:
─────────────────────────────────────────────────────
T+0:   Generate new secret
T+1:   Deploy code that accepts BOTH old and new secrets
T+2:   Update secret in ALL locations to new value
T+3:   Verify all services work with new secret
T+4:   Deploy code that accepts ONLY new secret
T+5:   Invalidate/revoke old secret
T+6:   Monitor for 24 hours for any auth failures
─────────────────────────────────────────────────────
```

### Step 4: Verify and Monitor

```bash
# Check for auth failures in logs (24 hours after rotation)
# Replace with your actual log query
grep -i "unauthorized\|auth.*fail\|invalid.*token" /var/log/app/*.log | tail -20

# Verify new credentials work
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  https://api.myapp.com/health
```

## Environment Drift Detection

```bash
#!/bin/bash
# Compare environment variable keys between staging and production

STAGING_KEYS=$(doppler secrets --project myapp --config staging --format json | \
  jq -r 'keys[]' | sort)
PROD_KEYS=$(doppler secrets --project myapp --config prod --format json | \
  jq -r 'keys[]' | sort)

ONLY_STAGING=$(comm -23 <(echo "$STAGING_KEYS") <(echo "$PROD_KEYS"))
ONLY_PROD=$(comm -13 <(echo "$STAGING_KEYS") <(echo "$PROD_KEYS"))

if [ -n "$ONLY_STAGING" ]; then
  echo "DRIFT: Keys in STAGING but NOT in PROD:"
  echo "$ONLY_STAGING" | sed 's/^/  /'
fi

if [ -n "$ONLY_PROD" ]; then
  echo "DRIFT: Keys in PROD but NOT in STAGING:"
  echo "$ONLY_PROD" | sed 's/^/  /'
fi

[ -z "$ONLY_STAGING" ] && [ -z "$ONLY_PROD" ] && echo "No drift detected."
```
