# Vault KV2 Metadata Persistence

## How Vault KV2 Stores Data vs Metadata

### Two Separate Endpoints

```bash
# Data endpoint (versioned)
vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="ABC123" \
  definition="-----BEGIN CERT-----..."

# Metadata endpoint (persistent, not versioned)
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "kv-v2/dev/certs/roots/rootca1",
    "chain_id": "production"
  }'
```

### API Paths

```
# Data operations (versioned)
PUT    /v1/kv-v2/data/dev/certs/servers/server1        ← Creates version 1, 2, 3...
GET    /v1/kv-v2/data/dev/certs/servers/server1        ← Gets latest version
GET    /v1/kv-v2/data/dev/certs/servers/server1?version=2  ← Gets specific version
DELETE /v1/kv-v2/data/dev/certs/servers/server1        ← Soft delete (version still exists)

# Metadata operations (NOT versioned)
GET    /v1/kv-v2/metadata/dev/certs/servers/server1    ← Always returns same metadata
PUT    /v1/kv-v2/metadata/dev/certs/servers/server1    ← Updates metadata (no versions)
DELETE /v1/kv-v2/metadata/dev/certs/servers/server1    ← Hard delete (destroys all versions!)
```

---

## Scenario: Certificate Renewal

### Initial State
```bash
# Day 1: Create certificate
vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="OLD_THUMBPRINT_ABC123" \
  definition="-----BEGIN CERTIFICATE----- OLD CERT -----END CERTIFICATE-----" \
  password="oldpass"

# Set metadata (relationships)
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "cert_type": "server",
    "signed_by_path": "kv-v2/dev/certs/intermediates",
    "signed_by_key": "intermediate-ca",
    "chain_id": "production-chain",
    "owner": "platform-team"
  }'
```

**Result:**
```
kv-v2/dev/certs/servers/server1
├── Data Version 1
│   ├── thumbprint: "OLD_THUMBPRINT_ABC123"
│   ├── definition: "-----BEGIN CERTIFICATE----- OLD CERT ..."
│   └── password: "oldpass"
└── Metadata
    └── custom_metadata:
        ├── cert_type: "server"
        ├── signed_by_path: "kv-v2/dev/certs/intermediates"
        ├── signed_by_key: "intermediate-ca"
        ├── chain_id: "production-chain"
        └── owner: "platform-team"
```

---

### Certificate Renewal (Replace Data)
```bash
# Day 365: Certificate expires, renew it
vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="NEW_THUMBPRINT_XYZ789" \
  definition="-----BEGIN CERTIFICATE----- NEW CERT -----END CERTIFICATE-----" \
  password="newpass"

# ⚠️ NOTE: We did NOT update metadata!
```

**Result:**
```
kv-v2/dev/certs/servers/server1
├── Data Version 1 (old cert - still accessible)
│   ├── thumbprint: "OLD_THUMBPRINT_ABC123"
│   ├── definition: "-----BEGIN CERTIFICATE----- OLD CERT ..."
│   └── password: "oldpass"
├── Data Version 2 (new cert - current)
│   ├── thumbprint: "NEW_THUMBPRINT_XYZ789"
│   ├── definition: "-----BEGIN CERTIFICATE----- NEW CERT ..."
│   └── password: "newpass"
└── Metadata (UNCHANGED! Still has relationships)
    └── custom_metadata:
        ├── cert_type: "server"
        ├── signed_by_path: "kv-v2/dev/certs/intermediates"  ✅ Still here!
        ├── signed_by_key: "intermediate-ca"                  ✅ Still here!
        ├── chain_id: "production-chain"                      ✅ Still here!
        └── owner: "platform-team"                            ✅ Still here!
```

**✅ Metadata persists! Relationships are NOT lost!**

---

### Verify Metadata Persistence

```bash
# Get latest cert data (version 2)
vault kv get kv-v2/dev/certs/servers/server1
# Output:
# thumbprint: NEW_THUMBPRINT_XYZ789
# definition: -----BEGIN CERTIFICATE----- NEW CERT ...

# Get metadata (still has relationships!)
vault kv metadata get kv-v2/dev/certs/servers/server1
# Output:
# custom_metadata:
#   cert_type: server
#   signed_by_path: kv-v2/dev/certs/intermediates
#   signed_by_key: intermediate-ca
#   chain_id: production-chain
#   owner: platform-team
```

---

## When Metadata IS Lost

### ⚠️ Scenario 1: Hard Delete (Metadata Endpoint)
```bash
# This DESTROYS everything (all versions + metadata)
vault kv metadata delete kv-v2/dev/certs/servers/server1

# Result: Secret path is completely gone
# ❌ All data versions deleted
# ❌ All metadata deleted
# ❌ Relationships lost
```

### ⚠️ Scenario 2: Destroy All Versions
```bash
# Destroy all versions (but metadata survives!)
vault kv destroy -versions=1,2,3 kv-v2/dev/certs/servers/server1

# Result:
# ❌ All data versions destroyed (unrecoverable)
# ✅ Metadata still exists (relationships preserved)
```

### ✅ Scenario 3: Soft Delete (Data Endpoint)
```bash
# Soft delete latest version
vault kv delete kv-v2/dev/certs/servers/server1

# Result:
# ⚠️ Latest version marked as deleted (recoverable)
# ✅ Metadata still exists
# ✅ Can undelete: vault kv undelete -versions=2 kv-v2/dev/certs/servers/server1
```

---

## Best Practices for Certificate Renewal

### Option 1: Update Data Only (Recommended)
```bash
# Renew certificate - metadata automatically preserved
vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="NEW_THUMBPRINT" \
  definition="-----BEGIN CERTIFICATE----- NEW CERT ..." \
  password="newpass"

# Metadata (relationships) automatically persist!
# No additional action needed ✅
```

### Option 2: Update Data + Metadata Timestamp
```bash
# Renew certificate
vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="NEW_THUMBPRINT" \
  definition="-----BEGIN CERTIFICATE----- NEW CERT ..." \
  password="newpass"

# Update metadata to track renewal
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "cert_type": "server",
    "signed_by_path": "kv-v2/dev/certs/intermediates",
    "signed_by_key": "intermediate-ca",
    "chain_id": "production-chain",
    "owner": "platform-team",
    "renewed_at": "2025-10-15T10:30:00Z",
    "expires_at": "2026-10-15T10:30:00Z"
  }'
```

### Option 3: Verify Relationships After Renewal
```typescript
async function renewCertificate(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  path: string,
  key: string,
  newCertData: { thumbprint: string; definition: string; password: string }
) {
  // 1. Get existing metadata (relationships)
  const metadataResult = await vaultAPI.getMetadata(credentialId, path)
  const existingMetadata = metadataResult.data?.custom_metadata || {}
  
  console.log('Existing relationships:', existingMetadata)
  
  // 2. Update certificate data (creates new version)
  await vaultAPI.putSecret(credentialId, path, {
    [key]: newCertData
  })
  
  // 3. Verify metadata still exists
  const verifyResult = await vaultAPI.getMetadata(credentialId, path)
  const verifiedMetadata = verifyResult.data?.custom_metadata || {}
  
  console.log('Relationships after renewal:', verifiedMetadata)
  
  // 4. Optionally update metadata with renewal timestamp
  await vaultAPI.putMetadata(credentialId, path, {
    ...verifiedMetadata,
    renewed_at: new Date().toISOString()
  })
  
  return {
    success: true,
    metadataPreserved: JSON.stringify(existingMetadata) === JSON.stringify(verifiedMetadata)
  }
}
```

---

## Metadata Versioning (Vault Enterprise)

### Vault OSS (Open Source)
- ❌ Metadata is NOT versioned
- ⚠️ Updating metadata overwrites previous values
- ✅ But metadata persists across data updates

### Vault Enterprise
- ✅ Can enable metadata versioning
- ✅ Track metadata changes over time
- ✅ Rollback metadata changes

---

## Summary

| Operation | Data Versions | Metadata | Relationships |
|-----------|---------------|----------|---------------|
| `kv put` (update cert) | Creates new version | ✅ Preserved | ✅ Preserved |
| `kv delete` (soft delete) | Marks deleted | ✅ Preserved | ✅ Preserved |
| `kv undelete` | Restores version | ✅ Preserved | ✅ Preserved |
| `kv destroy` | Destroys version | ✅ Preserved | ✅ Preserved |
| `kv metadata delete` | ❌ All destroyed | ❌ Destroyed | ❌ Lost |
| `kv metadata put` | No change | Updated | Updated |

### Key Takeaway
**✅ Metadata (relationships) persist when you replace certificate data!**

The only way to lose metadata is to explicitly delete it via the metadata endpoint or destroy the entire secret path.

---

## Recommended Workflow

```typescript
// Certificate renewal workflow
async function renewCertificateWorkflow(cert: CertificateItem) {
  // 1. Load existing metadata (relationships)
  const existing = await loadCertificateFromVault(vaultAPI, credId, path, key)
  console.log('Existing relationships:', existing.relationships)
  
  // 2. Update certificate data (new thumbprint, definition)
  cert.data = {
    thumbprint: newThumbprint,
    definition: newPemCert,
    password: newPassword
  }
  
  // 3. Keep existing relationships
  cert.relationships = existing.relationships
  
  // 4. Save to Vault (data + metadata)
  await saveCertificateToVault(vaultAPI, credId, cert, environment)
  
  // ✅ Relationships preserved!
}
```

This ensures relationships are never lost during certificate renewal! 🎉
