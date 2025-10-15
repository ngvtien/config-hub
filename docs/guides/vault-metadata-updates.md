# Updating Vault Metadata: Complete Guide

## Yes, You Can Update Metadata Anytime!

Metadata updates are **completely independent** from data updates. You can:
- ✅ Update metadata without touching certificate data
- ✅ Update metadata multiple times
- ✅ Update metadata for any version
- ✅ Update metadata even if data doesn't exist yet

---

## Scenarios

### Scenario 1: Update Relationships Without Touching Certificate

```bash
# Certificate data exists (Version 1)
vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="ABC123" \
  definition="-----BEGIN CERT-----..."

# Initial metadata
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "intermediate-ca-1"
  }'

# ⏰ Later: Change the signing CA (without touching cert data)
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "intermediate-ca-2",
    "updated_at": "2025-10-15T10:30:00Z"
  }'

# Certificate data unchanged, relationships updated! ✅
```

---

### Scenario 2: Add Relationships to Existing Certificate

```bash
# Certificate exists with no metadata
vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="ABC123" \
  definition="..."

# Add relationships later
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "intermediate-ca",
    "chain_id": "production"
  }'

# Add more relationships even later
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "intermediate-ca",
    "chain_id": "production",
    "trusts": "root-ca",
    "owner": "platform-team"
  }'
```

---

### Scenario 3: Update Metadata Multiple Times

```bash
# Day 1: Initial setup
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{"signed_by": "ca-1"}'

# Day 30: Add chain info
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "ca-1",
    "chain_id": "production"
  }'

# Day 60: Add owner
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "ca-1",
    "chain_id": "production",
    "owner": "platform-team"
  }'

# Day 90: Change signing CA
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "ca-2",
    "chain_id": "production",
    "owner": "platform-team",
    "migrated_from": "ca-1"
  }'
```

---

### Scenario 4: Metadata Before Data (Pre-provisioning)

```bash
# Create metadata BEFORE certificate exists
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "cert_type": "server",
    "planned_for": "api-gateway",
    "signed_by": "intermediate-ca",
    "status": "pending"
  }'

# Later: Add the actual certificate
vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="ABC123" \
  definition="..."

# Update metadata to mark as active
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "cert_type": "server",
    "planned_for": "api-gateway",
    "signed_by": "intermediate-ca",
    "status": "active",
    "activated_at": "2025-10-15T10:30:00Z"
  }'
```

---

## Important: Metadata Updates are NOT Incremental

⚠️ **Metadata updates REPLACE the entire custom_metadata object!**

### ❌ Wrong Way (Loses Data)
```bash
# Initial metadata
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "ca-1",
    "chain_id": "production",
    "owner": "platform-team"
  }'

# Later: Try to add just one field
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "expires_at": "2026-01-15"
  }'

# ❌ Result: Only expires_at exists now!
# signed_by, chain_id, owner are GONE!
```

### ✅ Right Way (Merge Manually)
```bash
# 1. Get existing metadata
EXISTING=$(vault kv metadata get -format=json kv-v2/dev/certs/servers/server1 | \
  jq -r '.data.custom_metadata')

# 2. Merge with new field
UPDATED=$(echo $EXISTING | jq '. + {"expires_at": "2026-01-15"}')

# 3. Update with merged data
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata="$UPDATED"

# ✅ Result: All fields preserved + new field added!
```

---

## TypeScript Helper: Safe Metadata Updates

```typescript
/**
 * Safely update metadata by merging with existing values
 */
async function updateMetadataSafely(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  path: string,
  updates: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const pathParts = path.split('/')
    const secretPath = pathParts.slice(1).join('/')
    
    // 1. Get existing metadata
    const existingResult = await vaultAPI.getMetadata(credentialId, secretPath)
    const existingMetadata = existingResult.data?.custom_metadata || {}
    
    // 2. Merge with updates
    const mergedMetadata = {
      ...existingMetadata,
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    // 3. Write merged metadata
    const result = await vaultAPI.putMetadata(credentialId, secretPath, mergedMetadata)
    
    return { success: result.success }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Usage examples:

// Add a new relationship
await updateMetadataSafely(vaultAPI, credId, path, {
  trusts_path: 'kv-v2/dev/certs/roots',
  trusts_key: 'root-ca'
})

// Change chain assignment
await updateMetadataSafely(vaultAPI, credId, path, {
  chain_id: 'backup-chain'
})

// Add expiration tracking
await updateMetadataSafely(vaultAPI, credId, path, {
  expires_at: '2026-01-15T00:00:00Z',
  renewal_reminder: 'true'
})

// Change ownership
await updateMetadataSafely(vaultAPI, credId, path, {
  owner: 'security-team',
  transferred_at: new Date().toISOString()
})
```

---

## Common Update Patterns

### Pattern 1: Add Relationship
```typescript
// Add a new "trusts" relationship
await updateMetadataSafely(vaultAPI, credId, path, {
  relationship_2_type: 'trusts',
  relationship_2_target_path: 'kv-v2/dev/certs/roots',
  relationship_2_target_key: 'root-ca',
  relationship_count: '3' // Update count
})
```

### Pattern 2: Change Chain Assignment
```typescript
// Move cert from one chain to another
await updateMetadataSafely(vaultAPI, credId, path, {
  chain_id: 'backup-chain',
  previous_chain_id: 'production-chain',
  chain_changed_at: new Date().toISOString()
})
```

### Pattern 3: Track Certificate Lifecycle
```typescript
// Mark certificate as expiring soon
await updateMetadataSafely(vaultAPI, credId, path, {
  status: 'expiring-soon',
  expires_at: '2025-11-15T00:00:00Z',
  renewal_required: 'true',
  notified_at: new Date().toISOString()
})

// Later: Mark as renewed
await updateMetadataSafely(vaultAPI, credId, path, {
  status: 'active',
  renewed_at: new Date().toISOString(),
  renewal_required: 'false'
})
```

### Pattern 4: Audit Trail
```typescript
// Track who made changes
await updateMetadataSafely(vaultAPI, credId, path, {
  last_modified_by: 'john.doe@company.com',
  last_modified_at: new Date().toISOString(),
  modification_reason: 'CA migration'
})
```

---

## Real-World Example: CA Migration

```typescript
/**
 * Migrate certificates from old CA to new CA
 */
async function migrateCertificateCA(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  certPath: string,
  oldCAKey: string,
  newCAKey: string
) {
  // 1. Get current metadata
  const pathParts = certPath.split('/')
  const secretPath = pathParts.slice(1).join('/')
  const metadataResult = await vaultAPI.getMetadata(credentialId, secretPath)
  const metadata = metadataResult.data?.custom_metadata || {}
  
  // 2. Check if cert is signed by old CA
  if (metadata.signed_by_key !== oldCAKey) {
    console.log(`Certificate not signed by ${oldCAKey}, skipping`)
    return { success: false, reason: 'not-signed-by-old-ca' }
  }
  
  // 3. Update metadata to point to new CA
  await updateMetadataSafely(vaultAPI, credentialId, certPath, {
    signed_by_key: newCAKey,
    previous_ca: oldCAKey,
    migrated_at: new Date().toISOString(),
    migration_status: 'metadata-updated'
  })
  
  console.log(`✅ Updated metadata for ${certPath}`)
  
  // 4. Note: Certificate data still needs to be re-issued!
  return {
    success: true,
    action_required: 'Certificate must be re-issued with new CA'
  }
}

// Migrate all server certificates
const serverCerts = [
  'kv-v2/dev/certs/servers/server1',
  'kv-v2/dev/certs/servers/server2',
  'kv-v2/dev/certs/servers/server3'
]

for (const certPath of serverCerts) {
  await migrateCertificateCA(
    vaultAPI,
    credId,
    certPath,
    'old-intermediate-ca',
    'new-intermediate-ca'
  )
}
```

---

## Metadata Update Timeline

```
Day 1: Create Certificate
──────────────────────────
vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="ABC" definition="..."

vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{"signed_by": "ca-1"}'

State: Data V1 + Metadata {signed_by: ca-1}


Day 30: Add Chain Info (Data Unchanged)
────────────────────────────────────────
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "ca-1",
    "chain_id": "production"
  }'

State: Data V1 + Metadata {signed_by: ca-1, chain_id: production}


Day 60: Add Owner (Data Still Unchanged)
─────────────────────────────────────────
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "ca-1",
    "chain_id": "production",
    "owner": "platform-team"
  }'

State: Data V1 + Metadata {signed_by: ca-1, chain_id: production, owner: platform-team}


Day 365: Renew Certificate (Data Changes)
──────────────────────────────────────────
vault kv put kv-v2/dev/certs/servers/server1 \
  thumbprint="XYZ" definition="..."

State: Data V1, Data V2 + Metadata {signed_by: ca-1, chain_id: production, owner: platform-team}
       ↑ Metadata unchanged!


Day 366: Update Metadata After Renewal
───────────────────────────────────────
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "signed_by": "ca-1",
    "chain_id": "production",
    "owner": "platform-team",
    "renewed_at": "2025-10-15"
  }'

State: Data V1, Data V2 + Metadata {signed_by: ca-1, chain_id: production, owner: platform-team, renewed_at: 2025-10-15}
```

---

## UI Integration Example

```typescript
// Component: Update Certificate Relationships
function CertificateRelationshipEditor({ cert }: { cert: CertificateItem }) {
  const [relationships, setRelationships] = useState(cert.relationships || [])
  
  const handleSaveRelationships = async () => {
    // Build metadata updates
    const updates: Record<string, string> = {
      relationship_count: relationships.length.toString()
    }
    
    relationships.forEach((rel, index) => {
      updates[`relationship_${index}_type`] = rel.type
      updates[`relationship_${index}_target_path`] = rel.targetPath
      updates[`relationship_${index}_target_key`] = rel.targetKey
    })
    
    // Update metadata (certificate data unchanged!)
    await updateMetadataSafely(
      vaultAPI,
      credentialId,
      cert.vaultRef.path,
      updates
    )
    
    toast.success('Relationships updated!')
  }
  
  return (
    <div>
      <h3>Edit Relationships</h3>
      {/* Relationship editor UI */}
      <Button onClick={handleSaveRelationships}>
        Save Relationships
      </Button>
      <p className="text-sm text-muted-foreground">
        Note: This only updates relationships, certificate data is unchanged
      </p>
    </div>
  )
}
```

---

## Summary

### ✅ You Can Update Metadata:
- ✅ Anytime (independent of data)
- ✅ Multiple times
- ✅ Before data exists
- ✅ After data exists
- ✅ Without touching certificate data
- ✅ For any version

### ⚠️ Remember:
- ⚠️ Metadata updates REPLACE entire custom_metadata
- ⚠️ Always merge with existing values
- ⚠️ Use helper functions to avoid data loss

### 🎯 Best Practice:
```typescript
// Always merge when updating
const existing = await getMetadata(path)
const updated = { ...existing, ...newFields }
await putMetadata(path, updated)
```

This flexibility makes Vault metadata perfect for managing certificate relationships! 🎉
