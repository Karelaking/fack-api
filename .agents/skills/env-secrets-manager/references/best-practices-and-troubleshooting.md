# Pitfalls, Best Practices, Troubleshooting & Success Criteria

Read this when reviewing a secrets setup against best practices, debugging validation/rotation/drift issues, or validating against the quality bar.

## Common Pitfalls

- **Committing .env to git** — add `.env` to .gitignore on day 1; use pre-commit hooks as a safety net
- **Echoing secrets in CI logs** — never `echo $SECRET`; mask variables in CI settings
- **Rotating in only one location** — secrets exist in CI, hosting, Docker, K8s; update ALL locations
- **Weak secrets** — `APP_SECRET=mysecret` is not a secret; use `openssl rand -base64 32`
- **Shared secrets across environments** — dev and prod must have different secrets, always
- **No monitoring after rotation** — watch for auth failures for 24 hours after rotating credentials
- **.env.example with real values** — example files are public; strip everything sensitive
- **Long-lived credentials** — prefer short-lived tokens (OIDC, instance roles) over permanent API keys

## Best Practices

1. **Secret manager is source of truth** — .env files are for local dev only; never in production
2. **Rotate on a schedule** — quarterly minimum for long-lived keys, not just after incidents
3. **Principle of least privilege** — each service gets its own API key with minimal permissions
4. **Validate at startup** — fail fast on missing required variables before serving traffic
5. **Never log secrets** — add middleware that redacts known secret patterns from log output
6. **Use short-lived credentials** — prefer OIDC/instance roles over long-lived access keys
7. **Audit access** — log every secret read in Vault/SSM; alert on anomalous access patterns
8. **Document rotation playbooks** — write them before an incident, not during one

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Startup validation fails with MISSING for a set variable | Variable is set in `.env` but the app reads from a different file (e.g., `.env.local` overrides it to empty) | Check file hierarchy load order; ensure the correct `.env.*` file is loaded and no override blanks the value |
| Pre-commit hook passes but CI detects a leaked secret | Pre-commit patterns list is out of date or does not cover the token format CI scans for | Sync the regex pattern list between the pre-commit hook and CI scanner; add the missing pattern |
| `vault kv get` returns "permission denied" | OIDC token expired or the Vault policy does not grant read access to the target path | Re-authenticate with `vault login -method=oidc` and verify the policy includes `read` capability on the secret path |
| Environment drift detection shows false positives | One environment uses a prefix convention (e.g., `NEXT_PUBLIC_`) that the other does not | Add an exclusion list of known environment-specific keys to the drift script |
| Secret rotation causes service outage | Code was deployed without the dual-read period; only the new secret is accepted immediately | Always deploy the dual-read code change first, then update the secret value, then remove old-secret support |
| `.env.example` accidentally contains real credentials | Developer copied `.env` to `.env.example` without stripping values | Run the auto-generation script to rebuild `.env.example` from `.env` with values stripped; add a CI check that `.env.example` values match safe defaults only |
| AWS SSM `put-parameter` fails with AccessDeniedException | IAM role lacks `ssm:PutParameter` or `kms:Encrypt` permissions for the target key | Attach the required IAM policy granting `ssm:PutParameter` and `kms:Encrypt` on the KMS key alias used for SecureString |

## Success Criteria

- **Zero secrets in git history** — secret leak scanner reports 0 findings across all branches
- **100% startup validation coverage** — every required variable is declared in the validation script; no production deploy starts with missing vars
- **Rotation completed within SLA** — credential rotation finishes within 4 hours of incident detection, including dual-write period and verification
- **Environment drift below 5%** — staging and production variable key sets differ by no more than 5% (intentional differences documented)
- **Pre-commit hook adoption at 100%** — every contributor has the secret-blocking pre-commit hook installed and active
- **Quarterly rotation compliance** — all long-lived credentials are rotated at least once per quarter with audit trail in the secret manager
- **Post-rotation monitoring green** — zero authentication failures attributed to stale credentials in the 24-hour window after each rotation
