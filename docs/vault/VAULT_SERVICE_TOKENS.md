# Vault Service Tokens - Complete Guide

## Overview

Service tokens are recommended for production use instead of the root token. They can have specific policies, TTLs, and limited permissions.

---

## � Logaging into Vault

Before creating service tokens, you need to authenticate with Vault.

### 1. Set Vault Address

**For PowerShell (pwsh):**
```powershell
$env:VAULT_ADDR='http://vault.k8s.local'
# or for HTTPS
$env:VAULT_ADDR='https://vault.company.com:8200'

# Verify it's set
echo $env:VAULT_ADDR
```

**For CMD:**
```cmd
set VAULT_ADDR=http://vault.k8s.local
# or for HTTPS
set VAULT_ADDR=https://vault.company.com:8200

# Verify it's set
echo %VAULT_ADDR%
```

**For Bash/Zsh (Linux/Mac):**
```bash
export VAULT_ADDR='http://vault.k8s.local'
# or for HTTPS
export VAULT_ADDR='https://vault.company.com:8200'

# Verify it's set
echo $VAULT_ADDR
```

**⚠️ Important**: Make sure you use the correct syntax for your shell!
- PowerShell: `$env:VARIABLE='value'`
- CMD: `set VARIABLE=value`
- Bash/Zsh: `export VARIABLE='value'`

### 2. Login with Root Token

**If you have the root token:**
```bash
vault login
# Enter token when prompted: root (or your root token)
```

**Or provide token directly:**
```bash
vault login <your-root-token>
```

**Example:**
```bash
vault login hvs.CAESIJ...
```

### 3. Login with Username/Password

**If userpass auth is enabled:**
```bash
vault login -method=userpass username=admin
# Enter password when prompted
```

**Or provide password directly:**
```bash
vault login -method=userpass username=admin password=mypassword
```

### 4. Login with LDAP

**If LDAP auth is enabled:**
```bash
vault login -method=ldap username=myuser
# Enter password when prompted
```

### 5. Login with Token from Environment

**For PowerShell:**
```powershell
$env:VAULT_TOKEN='hvs.CAESIJ...'
```

**For CMD:**
```cmd
set VAULT_TOKEN=hvs.CAESIJ...
```

**For Bash/Zsh:**
```bash
export VAULT_TOKEN='hvs.CAESIJ...'
```

**Then Vault CLI will use it automatically:**
```bash
vault token lookup
```

### 6. Verify Login

**Check your current authentication:**
```bash
vault token lookup
```

**Output:**
```
Key                 Value
---                 -----
accessor            abc123...
creation_time       1234567890
display_name        token
entity_id           n/a
expire_time         <none>
explicit_max_ttl    0s
id                  hvs.CAESIJ...
issue_time          2025-10-04T10:00:00Z
meta                <nil>
num_uses            0
orphan              false
path                auth/token/create
policies            [root]
renewable           false
ttl                 0s
type                service
```

### 7. Check Vault Status

**Verify Vault is unsealed and accessible:**
```bash
vault status
```

**Output:**
```
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false
Total Shares    5
Threshold       3
Version         1.15.0
Storage Type    file
Cluster Name    vault-cluster-abc123
Cluster ID      abc123-def456-ghi789
HA Enabled      false
```

---

## 🔑 Creating Service Tokens

### 1. Basic Service Token

**Create a token with default policy:**
```bash
vault token create
```

**Output:**
```
Key                  Value
---                  -----
token                hvs.CAESIJ...
token_accessor       abc123...
token_duration       768h
token_renewable      true
token_policies       ["default"]
```

### 2. Token with Specific Policy

**Create a token with custom policy:**
```bash
vault token create -policy=my-policy
```

### 3. Token with Multiple Policies

**Create a token with multiple policies:**
```bash
vault token create -policy=read-policy -policy=write-policy
```

### 4. Token with TTL (Time To Live)

**Create a token that expires after 24 hours:**
```bash
vault token create -ttl=24h
```

**Common TTL values:**
- `1h` - 1 hour
- `24h` - 24 hours
- `168h` - 1 week (7 days)
- `720h` - 30 days
- `8760h` - 1 year

### 5. Non-Renewable Token

**Create a token that cannot be renewed:**
```bash
vault token create -ttl=24h -renewable=false
```

### 6. Token with Display Name

**Create a token with a descriptive name:**
```bash
vault token create -display-name="config-hub-dev"
```

### 7. Periodic Token (Auto-Renewing)

**Create a token that auto-renews every 24 hours:**
```bash
vault token create -period=24h
```

---

## 📋 Creating Policies

Before creating tokens with specific policies, you need to create the policies first.

### Example: Read-Only Policy

**Create policy file `readonly.hcl`:**
```hcl
# Allow reading secrets from secret/myapp/*
path "secret/data/myapp/*" {
  capabilities = ["read", "list"]
}

# Allow listing secret paths
path "secret/metadata/myapp/*" {
  capabilities = ["list"]
}
```

**Apply the policy:**
```bash
vault policy write readonly readonly.hcl
```

### Example: Read-Write Policy

**Create policy file `readwrite.hcl`:**
```hcl
# Allow full access to secret/myapp/*
path "secret/data/myapp/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/myapp/*" {
  capabilities = ["list", "read", "delete"]
}
```

**Apply the policy:**
```bash
vault policy write readwrite readwrite.hcl
```

### Example: Admin Policy

**Create policy file `admin.hcl`:**
```hcl
# Full access to all secrets
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Manage policies
path "sys/policies/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Manage auth methods
path "sys/auth/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
```

**Apply the policy:**
```bash
vault policy write admin admin.hcl
```

---

## 🎯 Recommended Service Token Setup

### For Development Environment

**Create a dev token with 30-day TTL:**
```bash
vault token create \
  -display-name="config-hub-dev" \
  -policy=readwrite \
  -ttl=720h \
  -renewable=true
```

### For Production Environment

**Create a prod token with 7-day TTL and auto-renewal:**
```bash
vault token create \
  -display-name="config-hub-prod" \
  -policy=readonly \
  -period=168h
```

### For CI/CD Pipeline

**Create a short-lived token for CI/CD:**
```bash
vault token create \
  -display-name="config-hub-ci" \
  -policy=readonly \
  -ttl=1h \
  -renewable=false
```

---

## 🔍 Managing Service Tokens

### List All Tokens (Root Only)

```bash
vault list auth/token/accessors
```

### Lookup Token Information

**Check your current token:**
```bash
vault token lookup
```

**Check a specific token:**
```bash
vault token lookup <token>
```

### Renew a Token

**Renew your current token:**
```bash
vault token renew
```

**Renew a specific token:**
```bash
vault token renew <token>
```

**Renew with specific increment:**
```bash
vault token renew -increment=24h <token>
```

### Revoke a Token

**Revoke a specific token:**
```bash
vault token revoke <token>
```

**Revoke all tokens with a specific accessor:**
```bash
vault token revoke -accessor <accessor>
```

---

## 📝 Complete Example Workflow

### Step 1: Create Policy

**Create `config-hub-policy.hcl`:**
```hcl
# Read/Write access to config-hub secrets
path "secret/data/config-hub/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/config-hub/*" {
  capabilities = ["list", "read", "delete"]
}

# Read-only access to shared secrets
path "secret/data/shared/*" {
  capabilities = ["read", "list"]
}

# Allow token self-renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Allow token self-lookup
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
```

**Apply the policy:**
```bash
vault policy write config-hub config-hub-policy.hcl
```

### Step 2: Create Service Token

```bash
vault token create \
  -display-name="config-hub-service" \
  -policy=config-hub \
  -ttl=720h \
  -renewable=true \
  -format=json
```

**Output:**
```json
{
  "request_id": "...",
  "auth": {
    "client_token": "hvs.CAESIJ...",
    "accessor": "abc123...",
    "policies": ["config-hub", "default"],
    "token_policies": ["config-hub", "default"],
    "lease_duration": 2592000,
    "renewable": true
  }
}
```

### Step 3: Test the Token

**Set the token as environment variable:**
```bash
export VAULT_TOKEN="hvs.CAESIJ..."
```

**Test reading a secret:**
```bash
vault kv get secret/config-hub/test
```

**Test writing a secret:**
```bash
vault kv put secret/config-hub/test key=value
```

### Step 4: Use in Config Hub

1. Open Config Hub
2. Go to Settings → HashiCorp Vault
3. Enter:
   - Configuration Name: `Vault Production`
   - Server URL: `https://vault.company.com:8200`
   - Auth Method: `Token`
   - Token: `hvs.CAESIJ...` (the service token)
   - Mount Path: `secret`
4. Click "Test Connection"
5. Click "Save Configuration"

---

## 🔐 Security Best Practices

### 1. Use Specific Policies
❌ **Don't**: Use root token in production
✅ **Do**: Create service tokens with minimal required permissions

### 2. Set Appropriate TTLs
❌ **Don't**: Create tokens with infinite TTL
✅ **Do**: Use reasonable TTLs (7-30 days) with auto-renewal

### 3. Use Display Names
❌ **Don't**: Create anonymous tokens
✅ **Do**: Use descriptive display names for tracking

### 4. Rotate Tokens Regularly
❌ **Don't**: Use the same token forever
✅ **Do**: Rotate tokens every 30-90 days

### 5. Revoke Unused Tokens
❌ **Don't**: Leave old tokens active
✅ **Do**: Revoke tokens when no longer needed

### 6. Monitor Token Usage
❌ **Don't**: Create tokens and forget about them
✅ **Do**: Regularly audit token usage and permissions

---

## 🚀 Quick Reference

### Create Token Commands

```bash
# Basic token
vault token create

# Token with policy
vault token create -policy=my-policy

# Token with TTL
vault token create -ttl=24h

# Token with display name
vault token create -display-name="my-service"

# Periodic token (auto-renewing)
vault token create -period=24h

# Complete production token
vault token create \
  -display-name="config-hub-prod" \
  -policy=config-hub \
  -ttl=720h \
  -renewable=true
```

### Manage Token Commands

```bash
# Lookup current token
vault token lookup

# Renew current token
vault token renew

# Revoke a token
vault token revoke <token>

# List token accessors
vault list auth/token/accessors
```

---

## 📊 Token Comparison

| Token Type | Use Case | TTL | Renewable | Policies |
|------------|----------|-----|-----------|----------|
| **Root Token** | Initial setup only | Infinite | No | All |
| **Dev Token** | Development | 30 days | Yes | Read/Write |
| **Prod Token** | Production | 7 days | Yes (periodic) | Read-only |
| **CI/CD Token** | Automation | 1 hour | No | Read-only |
| **Service Token** | Applications | 30 days | Yes | Custom |

---

## 🎯 Recommended Setup for Config Hub

### Development
```bash
vault token create \
  -display-name="config-hub-dev" \
  -policy=config-hub-dev \
  -ttl=720h \
  -renewable=true
```

### Staging
```bash
vault token create \
  -display-name="config-hub-staging" \
  -policy=config-hub-staging \
  -period=168h
```

### Production
```bash
vault token create \
  -display-name="config-hub-prod" \
  -policy=config-hub-prod \
  -period=168h
```

---

## � ACommon Login Scenarios

### Scenario 1: First Time Setup (Local K8s Vault)

```bash
# 1. Set Vault address
export VAULT_ADDR='http://vault.k8s.local'

# 2. Login with root token
vault login root

# 3. Verify login
vault token lookup

# 4. Create service token
vault token create -display-name="config-hub-dev"
```

### Scenario 2: Production Vault with LDAP

```bash
# 1. Set Vault address
export VAULT_ADDR='https://vault.company.com:8200'

# 2. Login with LDAP
vault login -method=ldap username=myuser

# 3. Create service token
vault token create \
  -display-name="config-hub-prod" \
  -policy=config-hub \
  -ttl=720h
```

### Scenario 3: CI/CD Pipeline

```bash
# 1. Set Vault address and token from environment
export VAULT_ADDR='https://vault.company.com:8200'
export VAULT_TOKEN='hvs.CAESIJ...'  # From CI/CD secrets

# 2. Verify access
vault token lookup

# 3. Create short-lived token for deployment
vault token create -ttl=1h -policy=deploy
```

### Scenario 4: Kubernetes Pod

```bash
# 1. Set Vault address
export VAULT_ADDR='http://vault.vault.svc.cluster.local:8200'

# 2. Login with Kubernetes auth
vault write auth/kubernetes/login \
  role=my-role \
  jwt=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)

# 3. Use the returned token
export VAULT_TOKEN='hvs.CAESIJ...'
```

---

## 🐛 Troubleshooting Login Issues

### Issue: "VAULT_ADDR and -address unset. Defaulting to https://127.0.0.1:8200"

**Problem**: VAULT_ADDR environment variable not set correctly

**Cause**: Using wrong shell syntax (e.g., CMD syntax in PowerShell)

**Solutions:**

**If you're in PowerShell (pwsh):**
```powershell
# ❌ WRONG - This is CMD syntax
set VAULT_ADDR=http://vault.k8s.local

# ✅ CORRECT - PowerShell syntax
$env:VAULT_ADDR='http://vault.k8s.local'

# Verify it's set
echo $env:VAULT_ADDR
```

**If you're in CMD:**
```cmd
# ✅ CORRECT - CMD syntax
set VAULT_ADDR=http://vault.k8s.local

# Verify it's set
echo %VAULT_ADDR%
```

**If you're in Bash/Zsh:**
```bash
# ✅ CORRECT - Bash syntax
export VAULT_ADDR='http://vault.k8s.local'

# Verify it's set
echo $VAULT_ADDR
```

**How to check which shell you're using:**
- PowerShell prompt shows: `PS C:\>` or `❯` with `pwsh`
- CMD prompt shows: `C:\>`
- Bash/Zsh prompt shows: `$` or `%`

### Issue: "Error checking seal status"

**Problem**: Cannot connect to Vault server

**Solutions:**

**For PowerShell:**
```powershell
# Check if Vault address is set
echo $env:VAULT_ADDR

# Test connectivity
curl $env:VAULT_ADDR/v1/sys/health

# Set correct address
$env:VAULT_ADDR='http://vault.k8s.local'
```

**For Bash/Zsh:**
```bash
# Check if Vault address is set
echo $VAULT_ADDR

# Test connectivity
curl $VAULT_ADDR/v1/sys/health

# Set correct address
export VAULT_ADDR='http://vault.k8s.local'
```

### Issue: "Permission denied"

**Problem**: Token doesn't have required permissions

**Solutions:**
```bash
# Check current token policies
vault token lookup

# Login with a token that has more permissions
vault login <admin-token>

# Or login with root token
vault login root
```

### Issue: "Vault is sealed"

**Problem**: Vault needs to be unsealed

**Solutions:**
```bash
# Check seal status
vault status

# Unseal Vault (requires unseal keys)
vault operator unseal <unseal-key-1>
vault operator unseal <unseal-key-2>
vault operator unseal <unseal-key-3>

# Or if you have auto-unseal configured, restart Vault
```

### Issue: "Invalid token"

**Problem**: Token has expired or been revoked

**Solutions:**
```bash
# Try to renew token
vault token renew

# If renewal fails, login again
vault login

# Or use a different valid token
vault login <valid-token>
```

### Issue: "Auth method not enabled"

**Problem**: Trying to use an auth method that isn't enabled

**Solutions:**
```bash
# List enabled auth methods
vault auth list

# Enable the auth method (requires admin permissions)
vault auth enable userpass

# Or use a different auth method
vault login -method=token
```

---

## 📋 Quick Login Cheat Sheet

### Local Development
```bash
export VAULT_ADDR='http://vault.k8s.local'
vault login root
```

### Production with LDAP
```bash
export VAULT_ADDR='https://vault.company.com:8200'
vault login -method=ldap username=myuser
```

### Using Existing Token
```bash
export VAULT_ADDR='https://vault.company.com:8200'
export VAULT_TOKEN='hvs.CAESIJ...'
vault token lookup
```

### Kubernetes Pod
```bash
export VAULT_ADDR='http://vault.vault.svc.cluster.local:8200'
vault write auth/kubernetes/login role=my-role jwt=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
```

---

## 🔄 Complete Workflow Example

### Step-by-Step: From Login to Service Token

```bash
# 1. Set Vault address
export VAULT_ADDR='http://vault.k8s.local'

# 2. Login with root token
vault login root

# 3. Verify you're logged in
vault token lookup

# 4. Create a policy file
cat > config-hub-policy.hcl <<EOF
path "secret/data/config-hub/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "secret/metadata/config-hub/*" {
  capabilities = ["list", "read", "delete"]
}
EOF

# 5. Apply the policy
vault policy write config-hub config-hub-policy.hcl

# 6. Create service token
vault token create \
  -display-name="config-hub-service" \
  -policy=config-hub \
  -ttl=720h \
  -renewable=true

# 7. Copy the token (hvs.CAESIJ...)

# 8. Test the token
export VAULT_TOKEN='hvs.CAESIJ...'
vault token lookup

# 9. Test reading/writing secrets
vault kv put secret/config-hub/test key=value
vault kv get secret/config-hub/test

# 10. Use the token in Config Hub
# - Open Config Hub
# - Go to Settings → HashiCorp Vault
# - Enter the token
# - Test and Save
```

---

## 📚 Additional Resources

### Vault CLI Documentation
- [Token Commands](https://www.vaultproject.io/docs/commands/token)
- [Policy Syntax](https://www.vaultproject.io/docs/concepts/policies)
- [Token Auth Method](https://www.vaultproject.io/docs/auth/token)

### Policy Examples
- [Common Policies](https://learn.hashicorp.com/tutorials/vault/policies)
- [Policy Patterns](https://learn.hashicorp.com/tutorials/vault/policy-templating)

---

*Last Updated: 2025-10-04*
*Status: ✅ Complete*
