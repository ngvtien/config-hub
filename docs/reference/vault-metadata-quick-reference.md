# Vault Metadata Quick Reference

## TL;DR

✅ **YES, you can update metadata anytime!**
✅ **Metadata persists when certificate data changes!**
✅ **Metadata is independent from data!**

---

## Quick Commands

### Update Metadata (Bash)
```bash
# Get existing metadata first
EXISTING=$(vault kv metadata get -format=json kv-v2/dev/certs/servers/server1 | jq -r '.data.custom_metadata')

# Merge with new fields
UPDATED=$(echo $EXISTING | jq '. + {"new_field": "new_value"}')

# Update
vault kv metadata put kv-v2/dev/certs/servers/server1 custom_metadata="$UPDATED"
```

### Update Metadata (TypeScript)
```typescript
// Safe update (merges with existing)
await updateMetadataSafely(vaultAPI, credId, path, {
  new_field: 'new_value'
})

// Update relationships only
await updateCertificateRelationships(vaultAPI, credId, path, [
  { type: 'signs', targetPath: '...', targetKey: '...' }
])

// Add to chain
await addCertificateToChain(vaultAPI, credId, path, 'production-chain')
```

---

## Common Scenarios

### 1. Add a New Relationship
```typescript
// Certificate already exists, just update metadata
await updateMetadataSafely(vaultAPI, credId, path, {
  trusts_path: 'kv-v2/dev/certs/roots',
  trusts_key: 'root-ca'
})
```

### 2. Change Chain Assignment
```typescript
await updateMetadataSafely(vaultAPI, credId, path, {
  chain_id: 'backup-chain',
  previous_chain_id: 'production-chain'
})
```

### 3. Track Expiration
```typescript
await updateMetadataSafely(vaultAPI, credId, path, {
  expires_at: '2026-01-15T00:00:00Z',
  renewal_reminder: 'true'
})
```

### 4. Change Ownership
```typescript
await updateMetadataSafely(vaultAPI, credId, path, {
  owner: 'security-team',
  transferred_at: new Date().toISOString()
})
```

---

## What Happens When...

| Action | Data | Metadata | Result |
|--------|------|----------|--------|
| `kv put` (update cert) | New version | ✅ Unchanged | Metadata persists |
| `kv metadata put` | ✅ Unchanged | Updated | Data unchanged |
| `kv delete` (soft) | Marked deleted | ✅ Unchanged | Both recoverable |
| `kv metadata delete` | ❌ Destroyed | ❌ Destroyed | Everything gone |

---

## Important Rules

### ✅ DO
- ✅ Update metadata anytime
- ✅ Update metadata multiple times
- ✅ Merge with existing metadata
- ✅ Use helper functions

### ❌ DON'T
- ❌ Overwrite metadata without merging
- ❌ Use `kv metadata delete` unless you want to destroy everything
- ❌ Forget to include existing fields when updating

---

## Code Snippets

### Safe Update Pattern
```typescript
// Always merge!
const existing = await getMetadata(path)
const updated = { ...existing, ...newFields }
await putMetadata(path, updated)
```

### Update Relationships
```typescript
const relationships = [
  { type: 'signs', targetPath: 'kv-v2/dev/certs/ca', targetKey: 'ca1' },
  { type: 'trusts', targetPath: 'kv-v2/dev/certs/root', targetKey: 'root1' }
]

await updateCertificateRelationships(vaultAPI, credId, path, relationships)
```

### Bulk Update
```typescript
// Update metadata for multiple certificates
const certs = ['server1', 'server2', 'server3']

for (const cert of certs) {
  await updateMetadataSafely(vaultAPI, credId, `kv-v2/dev/certs/servers/${cert}`, {
    chain_id: 'production-chain',
    updated_by: 'admin'
  })
}
```

---

## Timeline Example

```
Day 1: Create cert + metadata
  Data: V1
  Metadata: {signed_by: ca1}

Day 30: Update metadata (add chain)
  Data: V1 (unchanged)
  Metadata: {signed_by: ca1, chain_id: prod}

Day 60: Update metadata (add owner)
  Data: V1 (unchanged)
  Metadata: {signed_by: ca1, chain_id: prod, owner: team}

Day 365: Renew certificate
  Data: V1, V2 (new cert)
  Metadata: {signed_by: ca1, chain_id: prod, owner: team} (unchanged!)

Day 366: Update metadata (track renewal)
  Data: V1, V2 (unchanged)
  Metadata: {signed_by: ca1, chain_id: prod, owner: team, renewed_at: 2025-10-15}
```

---

## Key Takeaway

**Metadata is completely independent from data!**

You can:
- Update metadata without touching certificate
- Update certificate without touching metadata
- Update both independently
- Update metadata as many times as you want

This makes Vault metadata perfect for managing certificate relationships! 🎉
