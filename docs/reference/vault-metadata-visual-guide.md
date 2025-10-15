# Vault KV2 Metadata: Visual Guide

## The Two-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Vault KV2 Secret: kv-v2/dev/certs/servers/server1              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: DATA (Versioned)                                      │
│  Endpoint: /v1/kv-v2/data/dev/certs/servers/server1             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Version 1 (2024-01-15)                                         │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ thumbprint: "OLD_ABC123"                              │      │
│  │ definition: "-----BEGIN CERT----- OLD ..."            │      │
│  │ password: "oldpass"                                   │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                 │
│  Version 2 (2025-01-15) ← Certificate Renewed                   │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ thumbprint: "NEW_XYZ789"                              │      │
│  │ definition: "-----BEGIN CERT----- NEW ..."            │      │
│  │ password: "newpass"                                   │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                 │
│  Version 3 (2025-10-15) ← Certificate Renewed Again             │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ thumbprint: "LATEST_DEF456"                           │      │
│  │ definition: "-----BEGIN CERT----- LATEST ..."         │      │
│  │ password: "latestpass"                                │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: METADATA (NOT Versioned - Single Copy)                │
│  Endpoint: /v1/kv-v2/metadata/dev/certs/servers/server1         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  custom_metadata:                                               │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ cert_type: "server"                                   │      │
│  │ cert_name: "ServerCert1"                              │      │
│  │ signed_by_path: "kv-v2/dev/certs/intermediate-ca"     │      │
│  │ signed_by_key: "intermediate-ca"                      │      │
│  │ trusts_path: "kv-v2/dev/certs/root-ca"                │      │
│  │ trusts_key: "root-ca"                                 │      │
│  │ chain_id: "production-chain"                          │      │
│  │ owner: "platform-team"                                │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                 │
│  ⚠️  This metadata applies to ALL versions above!              │
│  ✅  Persists when data is updated!                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Certificate Renewal Timeline

```
Day 1: Initial Certificate
═══════════════════════════════════════════════════════════════════

vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="OLD_ABC123" \
  definition="-----BEGIN CERT----- OLD ..."

vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{"signed_by": "intermediate-ca", ...}'

┌─────────────────────────────────────────────────────────────────┐
│ Data Version 1                                                  │
│ ┌─────────────────────┐                                         │
│ │ OLD_ABC123          │                                         │
│ │ OLD CERT            │                                         │
│ └─────────────────────┘                                         │
│                                                                 │
│ Metadata                                                        │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ signed_by: intermediate-ca                              │     │
│ │ chain_id: production-chain                              │     │
│ └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘


Day 365: Certificate Expires - Renew It
═══════════════════════════════════════════════════════════════════

vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="NEW_XYZ789" \
  definition="-----BEGIN CERT----- NEW ..."

⚠️  NOTE: We did NOT update metadata!

┌─────────────────────────────────────────────────────────────────┐
│ Data Version 1 (old)                                            │
│ ┌─────────────────────┐                                         │
│ │ OLD_ABC123          │                                         │
│ │ OLD CERT            │                                         │
│ └─────────────────────┘                                         │
│                                                                 │
│ Data Version 2 (new) ← CURRENT                                  │
│ ┌─────────────────────┐                                         │
│ │ NEW_XYZ789          │                                         │
│ │ NEW CERT            │                                         │
│ └─────────────────────┘                                         │
│                                                                 │
│ Metadata (UNCHANGED!)                                           │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ signed_by: intermediate-ca  ✅ STILL HERE!              │    │
│ │ chain_id: production-chain  ✅ STILL HERE!              │    │
│ └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘

✅ Relationships preserved!


Day 730: Another Renewal
═══════════════════════════════════════════════════════════════════

vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="LATEST_DEF456" \
  definition="-----BEGIN CERT----- LATEST ..."

┌─────────────────────────────────────────────────────────────────┐
│ Data Version 1 (oldest)                                         │
│ ┌─────────────────────┐                                         │
│ │ OLD_ABC123          │                                         │
│ └─────────────────────┘                                         │
│                                                                 │
│ Data Version 2 (old)                                            │
│ ┌─────────────────────┐                                         │
│ │ NEW_XYZ789          │                                         │
│ └─────────────────────┘                                         │
│                                                                 │
│ Data Version 3 (latest) ← CURRENT                               │
│ ┌─────────────────────┐                                         │
│ │ LATEST_DEF456       │                                         │
│ │ LATEST CERT         │                                         │
│ └─────────────────────┘                                         │
│                                                                 │
│ Metadata (STILL UNCHANGED!)                                     │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ signed_by: intermediate-ca  ✅ STILL HERE!              │    │
│ │ chain_id: production-chain  ✅ STILL HERE!              │    │
│ └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘

✅ Relationships STILL preserved after multiple renewals!
```

---

## What Happens with Different Operations

### ✅ Safe Operations (Metadata Preserved)

```
┌──────────────────────────────────────────────────────────────┐
│ vault kv put (update data)                                   │
├──────────────────────────────────────────────────────────────┤
│ Data:     Creates new version                                │
│ Metadata: ✅ PRESERVED                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ vault kv delete (soft delete)                                │
├──────────────────────────────────────────────────────────────┤
│ Data:     Marks version as deleted (recoverable)             │
│ Metadata: ✅ PRESERVED                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ vault kv undelete (restore)                                  │
├──────────────────────────────────────────────────────────────┤
│ Data:     Restores deleted version                           │
│ Metadata: ✅ PRESERVED                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ vault kv destroy (hard delete version)                       │
├──────────────────────────────────────────────────────────────┤
│ Data:     Permanently destroys specific version              │
│ Metadata: ✅ PRESERVED                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ vault kv metadata put (update metadata)                      │
├──────────────────────────────────────────────────────────────┤
│ Data:     No change                                          │
│ Metadata: Updated (overwrites previous)                      │
└──────────────────────────────────────────────────────────────┘
```

### ⚠️ Dangerous Operation (Metadata Lost)

```
┌──────────────────────────────────────────────────────────────┐
│ vault kv metadata delete (DESTROYS EVERYTHING!)              │
├──────────────────────────────────────────────────────────────┤
│ Data:     ❌ ALL VERSIONS DESTROYED                          │
│ Metadata: ❌ DESTROYED                                       │
│ Result:   Secret path completely removed                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Real-World Example: Certificate Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│  Production Server Certificate Lifecycle                        │
└─────────────────────────────────────────────────────────────────┘

Year 1: Initial Deployment
──────────────────────────
vault kv put kv-v2/prod/certs/api-server \
  thumbprint="2024_CERT" \
  definition="..." \
  password="..."

vault kv metadata put kv-v2/prod/certs/api-server \
  custom_metadata='{
    "signed_by": "intermediate-ca",
    "chain_id": "production",
    "expires": "2025-01-15"
  }'

State: Version 1 + Metadata


Year 2: Certificate Renewal
────────────────────────────
vault kv put kv-v2/prod/certs/api-server \
  thumbprint="2025_CERT" \
  definition="..." \
  password="..."

State: Version 1, Version 2 + Metadata (unchanged)
✅ Relationships still intact!


Year 3: Another Renewal
───────────────────────
vault kv put kv-v2/prod/certs/api-server \
  thumbprint="2026_CERT" \
  definition="..." \
  password="..."

State: Version 1, Version 2, Version 3 + Metadata (unchanged)
✅ Relationships STILL intact!


Incident: Rollback Needed
──────────────────────────
vault kv get -version=2 kv-v2/prod/certs/api-server

State: Reading old version, metadata still applies
✅ Can rollback to any version, relationships preserved!
```

---

## Key Takeaways

### ✅ DO's
- ✅ Update certificate data freely - metadata persists
- ✅ Use metadata for relationships - they survive renewals
- ✅ Soft delete when needed - metadata survives
- ✅ Keep version history - all versions share same metadata

### ❌ DON'Ts
- ❌ Don't use `vault kv metadata delete` unless you want to destroy everything
- ❌ Don't store relationships in data - they'll be versioned separately
- ❌ Don't worry about losing relationships during renewal - they persist!

### 🎯 Best Practice
```typescript
// Certificate renewal - metadata automatically preserved!
async function renewCertificate(path: string, newCert: CertData) {
  // Just update the data - metadata (relationships) persist automatically
  await vault.kv.put(path, newCert)
  
  // Optional: Update metadata with renewal timestamp
  await vault.kv.metadata.put(path, {
    ...existingMetadata,
    renewed_at: new Date().toISOString()
  })
}
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Certificate Data (thumbprint, PEM)                             │
│  ↓                                                              │
│  Versioned (1, 2, 3, ...)                                       │
│  ↓                                                              │
│  Changes with each renewal                                      │
│                                                                 │
│  ═══════════════════════════════════════════════════════        │
│                                                                 │
│  Metadata (relationships, chain_id)                             │
│  ↓                                                              │
│  NOT versioned (single copy)                                    │
│  ↓                                                              │
│  Persists across all data updates                               │
│                                                                 │
│  ✅ Relationships survive certificate renewal!                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
