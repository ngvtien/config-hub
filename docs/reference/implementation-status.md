# Implementation Status

## What's Implemented vs What's Planned

---

## ✅ Currently Implemented

### Certificate Management (YAML)
- ✅ Add/edit/delete certificates
- ✅ Certificate types (server, client, root-ca, intermediate-ca)
- ✅ Vault references (path + key)
- ✅ Certificate data (thumbprint, PEM, password)
- ✅ Relationships (signs, trusts, validates)
- ✅ Certificate chains
- ✅ Search and filter
- ✅ Form-based UI

### Vault Integration (Basic)
- ✅ Test Vault connection
- ✅ Push certificate DATA to Vault
  - Thumbprint
  - PEM definition
  - Password
- ✅ Get existing secrets
- ✅ Merge with existing data

### ESO Integration
- ✅ certificates.yaml format
- ✅ vaultRef (path + key)
- ✅ ESO can read and fetch from Vault

### UI Features
- ✅ Split view (form + YAML)
- ✅ Certificate table
- ✅ Add/edit modal
- ✅ Chain builder
- ✅ Diff preview
- ✅ Success/error messages

---

## ❌ NOT Implemented (Yet)

### Vault Metadata Integration
- ❌ Store relationships in Vault custom metadata
- ❌ Store certificate type in Vault metadata
- ❌ Store chain information in Vault metadata
- ❌ Query certificates by relationships
- ❌ Find certificates signed by specific CA
- ❌ Metadata persistence across renewals

### Advanced Features
- ❌ Certificate validation (expiry, chain validation)
- ❌ Certificate renewal workflow
- ❌ Certificate discovery from Vault
- ❌ Bulk operations on Vault
- ❌ Certificate expiration tracking
- ❌ Auto-renewal reminders

---

## Current Data Flow

### What Happens Now

```
User edits certificates.yaml
    ↓
Changes saved to Git
    ↓
Optional: Push certificate DATA to Vault
    ↓
ESO reads certificates.yaml
    ↓
ESO fetches from Vault
    ↓
Creates Kubernetes secrets
```

### Where Data Lives

**Git (certificates.yaml):**
- ✅ Certificate name
- ✅ Certificate type
- ✅ Vault references (path + key)
- ✅ Relationships
- ✅ Chains
- ⚠️ Certificate data (optional, for preview)

**Vault (Secret Data):**
- ✅ Thumbprint
- ✅ PEM definition
- ✅ Password
- ❌ NO metadata (type, relationships, chains)

**Vault (Custom Metadata):**
- ❌ NOT USED (yet)

---

## Code Status

### Implemented Functions

```typescript
// ✅ Implemented in certificate-form-editor.tsx
pushCertificateToVault(cert: CertificateItem)
  - Pushes thumbprint, definition, password
  - Does NOT push metadata

checkVaultConnection()
  - Tests Vault connectivity
```

### Available But Not Used

```typescript
// ✅ Available in vault-certificate-metadata.ts
// ❌ But NOT called by UI

saveCertificateToVault(vaultAPI, credId, cert, environment)
  - Would save data + metadata
  - NOT currently used

updateMetadataSafely(vaultAPI, credId, path, updates)
  - Would update metadata
  - NOT currently used

findCertificatesSignedBy(vaultAPI, credId, caPath, caKey)
  - Would query by relationships
  - NOT currently used
```

---

## Why Vault Metadata Isn't Implemented Yet

### Current Approach is Simpler
- Git is the source of truth
- Relationships in YAML are easy to edit
- No complex Vault metadata management needed
- Works for most use cases

### Vault Metadata Would Add
- More complexity
- Additional API calls
- Need to sync Git ↔ Vault
- More error handling

### When to Add Vault Metadata
- When you need to query relationships
- When you want single source of truth
- When you need metadata to survive renewals
- When you have automation that needs it

---

## How to Enable Vault Metadata (Future)

### Step 1: Update pushCertificateToVault

```typescript
// Current (data only)
await vault.putSecret(credId, secretPath, certData)

// Future (data + metadata)
await vault.putSecret(credId, secretPath, certData)
await vault.putMetadata(credId, secretPath, {
  cert_type: cert.type,
  cert_name: cert.name,
  relationship_count: cert.relationships?.length || 0,
  // ... relationships
})
```

### Step 2: Add Query Functions

```typescript
// Add to UI
const certsSignedByCA = await findCertificatesSignedBy(
  vaultAPI,
  credId,
  'kv-v2/dev/certs/ca',
  'MyCA'
)
```

### Step 3: Add Sync Option

```typescript
// Option to sync from Vault metadata to Git
await syncVaultMetadataToGit(credId, environment)
```

---

## Comparison

### Current Implementation (YAML Only)

**Data Storage:**
```
Git (certificates.yaml):
  - vaultRef ✅
  - name ✅
  - type ✅
  - relationships ✅
  - chains ✅

Vault (Secret Data):
  - thumbprint ✅
  - definition ✅
  - password ✅

Vault (Metadata):
  - (empty) ❌
```

**Capabilities:**
- ✅ Manage certificates
- ✅ Push to Vault
- ✅ ESO integration
- ❌ Query by relationships
- ❌ Metadata in Vault

### Future Implementation (With Vault Metadata)

**Data Storage:**
```
Git (certificates.yaml):
  - vaultRef ✅
  - (read-only snapshot) ✅

Vault (Secret Data):
  - thumbprint ✅
  - definition ✅
  - password ✅

Vault (Metadata):
  - cert_type ✅
  - cert_name ✅
  - relationships ✅
  - chains ✅
```

**Capabilities:**
- ✅ Manage certificates
- ✅ Push to Vault
- ✅ ESO integration
- ✅ Query by relationships
- ✅ Metadata in Vault
- ✅ Single source of truth

---

## Summary

### What Works Now
✅ **Certificate management in YAML**
✅ **Push certificate data to Vault**
✅ **ESO integration**
✅ **Full UI features**

### What Doesn't Work Yet
❌ **Vault metadata storage**
❌ **Query by relationships**
❌ **Metadata persistence**

### Why It's OK
The current implementation works for most use cases:
- ESO can fetch certificates
- Relationships documented in Git
- Simple and maintainable

### When to Add Vault Metadata
- Need to query relationships
- Want single source of truth
- Need metadata with certificates
- Building automation

---

## Related Documentation

- [Vault Metadata Approach](../guides/vault-metadata-approach.md) - How it would work
- [ESO Integration Explained](../guides/eso-integration-explained.md) - What ESO uses
- [Integration Status](integration-status.md) - Component status
