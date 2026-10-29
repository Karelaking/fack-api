# Secret Manager Integration

Read this when integrating with HashiCorp Vault, AWS SSM Parameter Store, 1Password CLI, or Doppler.

## HashiCorp Vault

```bash
# Authenticate via OIDC
export VAULT_ADDR="https://vault.company.com"
vault login -method=oidc

# Store secrets
vault kv put secret/myapp/prod \
  DATABASE_URL="postgres://user:pass@host/db" \
  APP_SECRET="$(openssl rand -base64 32)" \
  STRIPE_SECRET_KEY="sk_live_..."

# Read secrets into environment
eval $(vault kv get -format=json secret/myapp/prod | \
  jq -r '.data.data | to_entries[] | "export \(.key)=\(.value|@sh)"')

# Rotate a single secret
vault kv patch secret/myapp/prod \
  APP_SECRET="$(openssl rand -base64 32)"
```

## AWS SSM Parameter Store

```bash
# Store as encrypted parameter
aws ssm put-parameter \
  --name "/myapp/prod/DATABASE_URL" \
  --value "postgres://..." \
  --type "SecureString" \
  --key-id "alias/myapp-secrets" \
  --overwrite

# Read all parameters for an environment
aws ssm get-parameters-by-path \
  --path "/myapp/prod/" \
  --with-decryption \
  --query "Parameters[*].[Name,Value]" \
  --output text
```

## Doppler

```bash
# Set up project
doppler setup --project myapp --config prod

# Run with secrets injected (recommended for production)
doppler run -- node server.js

# Download for local dev
doppler secrets download --no-file --format env > .env.local
```
