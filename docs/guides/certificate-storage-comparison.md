# Certificate Relationship Storage: Comparison

## Three Approaches

### 1️⃣ YAML in Git (Current Implementation)

**Storage Location:** `secrets.yaml` in Git repository

```yaml
certificates:
  - name: ServerCert
    type: server
    vaultRef:
      path: kv-v2/dev/certs/servers
      key: servercert
    relationships:
      - type: signs
        targetPath: kv-v2/dev/certs/roots
        targetKey: rootca
```

| Aspect | Rating | Notes |
|--------|--------|-------|
| Version Control | ⭐⭐⭐⭐⭐ | Full Git history |
| Single Source of Truth | ⭐ | Can drift from Vault |
| Queryability | ⭐⭐ | Requires parsing YAML |
| Access Control | ⭐⭐⭐ | Git-based permissions |
| Audit Trail | ⭐⭐⭐⭐ | Git commits |
| Sync Complexity | ⭐⭐ | Manual sync needed |
| Real-time Updates | ⭐ | Requires Git push/pull |

**Best For:** Small teams, simple setups, when Git is primary workflow

---

### 2️⃣ Vault KV2 Custom Metadata (Recommended)

**Storage Location:** Vault custom metadata on each secret

```bash
# Certificate data
vault kv put kv-v2/dev/certs/servers/servercert \
  thumbprint="ABC123" \
  definition="-----BEGIN CERT-----"

# Relationships in metadata
vault kv metadata put kv-v2/dev/certs/servers/servercert \
  custom_metadata='{
    "cert_type": "server",
    "signed_by_path": "kv-v2/dev/certs/roots",
    "signed_by_key": "rootca",
    "chain_id": "production"
  }'
```

| Aspect | Rating | Notes |
|--------|--------|-------|
| Version Control | ⭐⭐⭐ | Vault versions metadata |
| Single Source of Truth | ⭐⭐⭐⭐⭐ | Vault is authoritative |
| Queryability | ⭐⭐⭐⭐ | Vault API queries |
| Access Control | ⭐⭐⭐⭐⭐ | Vault policies |
| Audit Trail | ⭐⭐⭐⭐⭐ | Vault audit logs |
| Sync Complexity | ⭐⭐⭐⭐⭐ | No sync needed |
| Real-time Updates | ⭐⭐⭐⭐⭐ | Immediate |

**Best For:** Production environments, large teams, when Vault is primary source

---

### 3️⃣ Hybrid: Vault + Git Snapshot (Best of Both)

**Storage Location:** Vault (source of truth) + Git (read-only snapshot)

```yaml
# In Git: secrets.yaml (AUTO-GENERATED - DO NOT EDIT)
_metadata:
  source: vault
  synced_at: "2025-10-15T10:30:00Z"
  warning: "This file is auto-generated from Vault"

certificates:
  - name: ServerCert
    type: server
    vaultRef:
      path: kv-v2/dev/certs/servers
      key: servercert
    # Synced from Vault metadata
    relationships:
      - type: signs
        targetPath: kv-v2/dev/certs/roots
        targetKey: rootca
    _vault_metadata:
      last_updated: "2025-10-15T09:00:00Z"
      version: 3
```

| Aspect | Rating | Notes |
|--------|--------|-------|
| Version Control | ⭐⭐⭐⭐ | Git snapshots for review |
| Single Source of Truth | ⭐⭐⭐⭐⭐ | Vault is source |
| Queryability | ⭐⭐⭐⭐⭐ | Both Vault API and Git |
| Access Control | ⭐⭐⭐⭐⭐ | Vault policies + Git |
| Audit Trail | ⭐⭐⭐⭐⭐ | Both systems |
| Sync Complexity | ⭐⭐⭐ | Automated sync needed |
| Real-time Updates | ⭐⭐⭐⭐ | Vault immediate, Git async |

**Best For:** Enterprise environments, compliance requirements, best practices

---

## Detailed Comparison

### Data Flow

#### Approach 1: YAML in Git
```
User edits YAML → Git commit → CI/CD reads YAML → Pushes to Vault
                                                    ↓
                                            Vault has cert data
                                            Git has relationships
                                            ⚠️ Can drift!
```

#### Approach 2: Vault Metadata
```
User edits in UI → Vault API updates data + metadata
                   ↓
                   Everything in Vault
                   ✅ Single source of truth
```

#### Approach 3: Hybrid
```
User edits in UI → Vault API updates data + metadata
                   ↓
                   Vault is source of truth
                   ↓
                   Automated sync → Git snapshot (read-only)
                   ↓
                   ✅ Best of both worlds
```

---

## Use Case Recommendations

### Use YAML in Git When:
- ✅ Small team (< 10 people)
- ✅ Simple certificate structure
- ✅ Git is primary workflow
- ✅ Manual updates are acceptable
- ✅ Drift detection not critical

### Use Vault Metadata When:
- ✅ Production environment
- ✅ Large team (> 10 people)
- ✅ Complex certificate relationships
- ✅ Need real-time queries
- ✅ Vault is primary source
- ✅ Strong access control needed

### Use Hybrid When:
- ✅ Enterprise environment
- ✅ Compliance requirements
- ✅ Need audit trail in Git
- ✅ Want PR reviews for visibility
- ✅ Need both real-time and historical views
- ✅ Can implement automated sync

---

## Migration Path

### Phase 1: Current (YAML)
```yaml
# secrets.yaml
certificates:
  - name: ServerCert
    relationships: [...]
```

### Phase 2: Dual Write
```typescript
// Write to both Git and Vault
await saveToGit(cert)
await saveToVault(cert) // Also writes metadata
```

### Phase 3: Vault Primary
```typescript
// Read from Vault, write to Vault
const cert = await loadFromVault(path, key)
await saveToVault(cert)
```

### Phase 4: Hybrid
```typescript
// Vault is source, Git is snapshot
await saveToVault(cert)
await syncToGit() // Automated, read-only
```

---

## Code Examples

### Query: "Find all certs signed by RootCA1"

#### YAML Approach
```typescript
// Parse YAML file
const yaml = parseYaml(content)
const results = yaml.certificates.filter(cert =>
  cert.relationships?.some(rel =>
    rel.type === 'signs' &&
    rel.targetKey === 'rootca1'
  )
)
```

#### Vault Metadata Approach
```typescript
// Query Vault API
const results = await findCertificatesSignedBy(
  credentialId,
  'kv-v2/dev/certs/roots',
  'rootca1'
)
```

#### Hybrid Approach
```typescript
// Fast: Read from Git snapshot
const quickResults = parseYaml(gitSnapshot)

// Accurate: Verify with Vault
const liveResults = await findCertificatesSignedBy(...)

// Detect drift
if (quickResults.length !== liveResults.length) {
  console.warn('Drift detected! Syncing...')
  await syncToGit()
}
```

---

## Recommendation

**For your use case (ArgoCD + Vault + Git):**

### 🏆 Go with Hybrid Approach

**Why:**
1. ✅ Vault is your source of truth (production-ready)
2. ✅ Git provides PR review workflow (team collaboration)
3. ✅ Automated sync keeps them in sync (no drift)
4. ✅ Can query both systems (flexibility)
5. ✅ Audit trail in both places (compliance)

**Implementation:**
1. Store relationships in Vault custom metadata
2. Auto-generate read-only YAML in Git
3. UI updates Vault, then syncs to Git
4. PRs show the snapshot for review
5. CI/CD reads from Vault (source of truth)

This gives you the best of both worlds! 🎉
