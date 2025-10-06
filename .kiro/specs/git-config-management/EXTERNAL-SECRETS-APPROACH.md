# External Secrets Approach

## Core Principle

**No secret values are ever visible or stored in Config Hub.**

Only External Secret manifests (references/paths) are managed in Git.
Actual secret values live only in Vault.

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│  Config Hub UI                                               │
│  ├─ Shows: External Secret manifests (paths, mappings)      │
│  ├─ Edits: Vault paths and key mappings                     │
│  └─ Never shows: Actual secret values ❌                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Dual Operation
                            ↓
┌──────────────────────┬──────────────────────────────────────┐
│  Vault               │  Git Repository                       │
│  ├─ Store values     │  ├─ Store External Secret manifest   │
│  └─ Actual secrets   │  └─ Paths and references only        │
└──────────────────────┴──────────────────────────────────────┘
```

## Tab Structure (Simplified)

### No Separate Secrets Tab

```
[Overview] [Source] [Configuration] [Pull Requests]
```

**Configuration Tab** handles both:
- Regular config files (values.yaml, app.yaml, etc.)
- External Secret manifests (external-secrets.yaml)

## Configuration Tab Layout

```
┌────────────────────────────────────────────────────────────────┐
│  [Overview] [Source] [Configuration] [Pull Requests]           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📄 Configuration Files                                         │
│                                                                 │
│  Source: 🟦 main branch • Vault: ✅ Connected                  │
│                                                                 │
│  ┌─ Config Files ──────────────────────────────────────────┐   │
│  │ 📄 values.yaml                                          │   │
│  │    Helm values                                          │   │
│  │    [Edit] [History]                                     │   │
│  │                                                          │   │
│  │ 📄 config/app.yaml                                      │   │
│  │    Application config                                   │   │
│  │    [Edit] [History]                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ External Secrets ──────────────────────────────────────┐   │
│  │ 🔐 external-secrets.yaml                                │   │
│  │    Secret references (no values stored)                 │   │
│  │    [Edit with Secret Manager] [History]                │   │
│  │                                                          │   │
│  │    Current mappings:                                    │   │
│  │    • api-keys → vault:secret/platform/api-keys         │   │
│  │    • db-password → vault:secret/platform/database      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Create Pull Request]                                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Smart Secret Management UI

### When User Clicks "Edit with Secret Manager"

Opens a specialized dialog that handles both Vault and Git:

```
┌────────────────────────────────────────────────────────────────┐
│  External Secret Manager                           [✕]         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Editing: external-secrets.yaml                                │
│                                                                 │
│  ┌─ Vault Configuration ─────────────────────────────────────┐ │
│  │ Connection: ✅ vault.k8s.local                            │ │
│  │ Base Path: secret/platform                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Secret Mappings ─────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  Secret Name: api-keys                                    │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │ Vault Path: secret/platform/api-keys               │   │ │
│  │  │                                                     │   │ │
│  │  │ Key Mappings:                                       │   │ │
│  │  │ ├─ stripe_key    → STRIPE_API_KEY                  │   │ │
│  │  │ ├─ sendgrid_key  → SENDGRID_API_KEY                │   │ │
│  │  │ └─ jwt_secret    → JWT_SECRET                       │   │ │
│  │  │                                                     │   │ │
│  │  │ [+ Add Key Mapping]                                │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                            │ │
│  │  [+ Add Secret]                                           │ │
│  │                                                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Actions ─────────────────────────────────────────────────┐ │
│  │ What will happen:                                         │ │
│  │ 1. ✓ Validate Vault paths exist                          │ │
│  │ 2. ✓ Update external-secrets.yaml in Git                 │ │
│  │ 3. ✓ Create Pull Request                                 │ │
│  │                                                            │ │
│  │ ⚠️  Note: Secret values are managed in Vault separately  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                    [Cancel] [Save & Create PR]  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Workflow: Creating/Editing External Secret

### Step 1: User Opens Secret Manager
```
User clicks "Edit with Secret Manager" on external-secrets.yaml
→ Opens specialized dialog
→ Loads current External Secret manifest
→ Parses Vault paths and mappings
```

### Step 2: User Configures Mappings
```
User defines:
├─ Vault path (e.g., secret/platform/api-keys)
├─ Key mappings (vault key → k8s secret key)
└─ Secret name in Kubernetes
```

### Step 3: Smart Validation
```
Config Hub validates:
├─ ✓ Vault connection works
├─ ✓ Vault path exists (or can be created)
├─ ✓ Mappings are valid
└─ ✓ External Secret manifest is valid YAML
```

### Step 4: Dual Operation
```
Config Hub performs:
├─ 1. Updates external-secrets.yaml in Git
│     (only paths and mappings, no values)
├─ 2. Creates branch
├─ 3. Commits changes
└─ 4. Creates Pull Request
```

### Step 5: Separate Vault Management
```
⚠️  Important: Secret values are NOT managed here!

Vault values are managed separately:
├─ Via Vault UI
├─ Via Vault CLI
├─ Via separate secret management tool
└─ Config Hub only manages the references
```

## External Secret Manifest Example

### What's Stored in Git
```yaml
# external-secrets.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-keys
spec:
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: api-keys
    creationPolicy: Owner
  data:
    - secretKey: STRIPE_API_KEY
      remoteRef:
        key: secret/platform/api-keys
        property: stripe_key
    - secretKey: SENDGRID_API_KEY
      remoteRef:
        key: secret/platform/api-keys
        property: sendgrid_key
    - secretKey: JWT_SECRET
      remoteRef:
        key: secret/platform/api-keys
        property: jwt_secret
```

**What Config Hub Shows:**
- ✅ Vault path: `secret/platform/api-keys`
- ✅ Key mappings: `stripe_key → STRIPE_API_KEY`
- ❌ Actual secret values: **NEVER**

## Benefits

### Security
- ✅ No secret values in Config Hub
- ✅ No secret values in Git
- ✅ Secrets only in Vault
- ✅ Principle of least privilege

### Simplicity
- ✅ No separate Secrets tab
- ✅ External Secrets are just config files
- ✅ Smart UI when editing secrets
- ✅ Clear separation of concerns

### Workflow
- ✅ Edit External Secret manifest → PR
- ✅ Manage actual values in Vault (separate)
- ✅ External Secrets Operator syncs automatically
- ✅ GitOps compliant

## File Type Detection

Config Hub detects file type and shows appropriate editor:

```typescript
function getFileEditor(filename: string) {
  if (filename.includes('external-secret')) {
    return 'ExternalSecretEditor' // Smart secret manager UI
  }
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
    return 'YAMLEditor' // Standard YAML editor
  }
  if (filename.endsWith('.json')) {
    return 'JSONEditor'
  }
  return 'TextEditor'
}
```

## UI States

### State 1: No External Secrets
```
┌─ Configuration Files ──────────────────────────────────────┐
│ 📄 values.yaml                                             │
│ 📄 config/app.yaml                                         │
│                                                             │
│ 💡 No External Secrets configured yet.                     │
│    [Create External Secret]                                │
└─────────────────────────────────────────────────────────────┘
```

### State 2: External Secrets Exist
```
┌─ External Secrets ─────────────────────────────────────────┐
│ 🔐 external-secrets.yaml                                   │
│    2 secrets configured                                    │
│    [Edit with Secret Manager] [View YAML] [History]       │
│                                                             │
│    Mappings:                                               │
│    • api-keys → vault:secret/platform/api-keys            │
│    • db-password → vault:secret/platform/database         │
└─────────────────────────────────────────────────────────────┘
```

### State 3: Vault Not Connected
```
┌─ External Secrets ─────────────────────────────────────────┐
│ 🔐 external-secrets.yaml                                   │
│    ⚠️  Vault connection required                           │
│                                                             │
│    To manage External Secrets, connect to Vault first.    │
│    [Configure Vault in Settings]                          │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Scope

### Current Work (Git Integration)
- ✅ Source tab with Git management
- ✅ Configuration tab with file editing
- ✅ Detect external-secrets.yaml files
- ✅ Show as special file type
- ⏸️  Basic YAML editor (for now)

### Future Work (External Secrets)
- ⏭️  Smart External Secret Manager UI
- ⏭️  Vault path validation
- ⏭️  Key mapping editor
- ⏭️  Dual operation (Vault + Git)

## Summary

**Three Tab Structure:**
1. **Overview** - Status and quick links
2. **Source** - Full Git management (contextual)
3. **Configuration** - Config files + External Secret manifests
4. **Pull Requests** - Review and merge

**External Secrets Handling:**
- Treated as special config files
- Smart editor when editing
- Only paths/mappings in Git
- Actual values in Vault (separate)
- Future enhancement, not current scope

This keeps it simple, secure, and focused! 🔒
