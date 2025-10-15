# Vault Metadata Approach for Certificate Relationships

## Architecture

### Data Storage
- **Certificate Data** → Vault KV2 secret data
- **Relationships** → Vault KV2 custom metadata
- **Git YAML** → Read-only snapshot (auto-generated)

### Flow
```
User edits cert in UI
    ↓
Update Vault secret data
    ↓
Update Vault custom metadata (relationships)
    ↓
Sync metadata to Git YAML (read-only)
    ↓
Commit to Git for audit trail
```

## Vault Structure

### Secret Data (KV2 Data)
```
kv-v2/dev/org1/cai/certs/servers:CaiServerCertificate
  data:
    thumbprint: "ABCD1234EFGH5678"
    definition: "-----BEGIN CERTIFICATE-----..."
    password: "server-cert-pass"
```

### Custom Metadata (KV2 Metadata)
```
kv-v2/dev/org1/cai/certs/servers:CaiServerCertificate
  custom_metadata:
    cert_type: "server"
    cert_name: "CaiServerCertificate"
    signed_by_path: "kv-v2/dev/org1/cai/certs/intermediates"
    signed_by_key: "intermediateCA"
    trusts_path: "kv-v2/dev/org1/cai/certs/roots"
    trusts_key: "rootCA1"
    chain_ids: "production-server-chain,backup-chain"
    expires_at: "2025-12-31T23:59:59Z"
    owner_team: "platform-team"
    environment: "dev"
    created_at: "2025-01-15T10:00:00Z"
    updated_at: "2025-10-15T10:30:00Z"
```

## API Operations

### 1. Create/Update Certificate with Metadata

```typescript
async function saveCertificateWithMetadata(
  credentialId: string,
  cert: CertificateItem
) {
  const pathParts = cert.vaultRef.path.split('/')
  const secretPath = pathParts.slice(1).join('/')
  
  // 1. Save certificate data
  if (cert.data) {
    await window.electronAPI.vault.putSecret(
      credentialId,
      secretPath,
      {
        [cert.vaultRef.key]: {
          thumbprint: cert.data.thumbprint,
          definition: cert.data.definition,
          password: cert.data.password || ''
        }
      }
    )
  }
  
  // 2. Save metadata (relationships)
  const metadata: Record<string, string> = {
    cert_type: cert.type,
    cert_name: cert.name,
    environment: environment,
    updated_at: new Date().toISOString()
  }
  
  // Add relationships to metadata
  if (cert.relationships) {
    cert.relationships.forEach((rel, index) => {
      metadata[`relationship_${index}_type`] = rel.type
      metadata[`relationship_${index}_target_path`] = rel.targetPath
      metadata[`relationship_${index}_target_key`] = rel.targetKey
    })
    metadata['relationship_count'] = cert.relationships.length.toString()
  }
  
  await window.electronAPI.vault.putMetadata(
    credentialId,
    secretPath,
    metadata
  )
}
```

### 2. Read Certificate with Metadata

```typescript
async function getCertificateWithMetadata(
  credentialId: string,
  path: string,
  key: string
): Promise<CertificateItem> {
  const pathParts = path.split('/')
  const secretPath = pathParts.slice(1).join('/')
  
  // 1. Get secret data
  const secretResult = await window.electronAPI.vault.getSecret(
    credentialId,
    secretPath
  )
  
  const certData = secretResult.data?.data?.data?.[key]
  
  // 2. Get metadata
  const metadataResult = await window.electronAPI.vault.getMetadata(
    credentialId,
    secretPath
  )
  
  const metadata = metadataResult.data?.custom_metadata || {}
  
  // 3. Reconstruct relationships from metadata
  const relationships: CertificateRelationship[] = []
  const relCount = parseInt(metadata.relationship_count || '0')
  
  for (let i = 0; i < relCount; i++) {
    relationships.push({
      type: metadata[`relationship_${i}_type`] as any,
      targetPath: metadata[`relationship_${i}_target_path`],
      targetKey: metadata[`relationship_${i}_target_key`]
    })
  }
  
  return {
    name: metadata.cert_name || key,
    type: metadata.cert_type as CertificateType,
    vaultRef: { path, key },
    data: certData ? {
      thumbprint: certData.thumbprint,
      definition: certData.definition,
      password: certData.password
    } : undefined,
    relationships: relationships.length > 0 ? relationships : undefined
  }
}
```

### 3. Query Certificates by Relationship

```typescript
async function findCertificatesSignedBy(
  credentialId: string,
  caPath: string,
  caKey: string
): Promise<CertificateItem[]> {
  // List all secrets in the mount
  const allSecrets = await listAllSecrets(credentialId, 'kv-v2/dev/org1/cai/certs')
  
  const results: CertificateItem[] = []
  
  for (const secretPath of allSecrets) {
    const metadata = await window.electronAPI.vault.getMetadata(
      credentialId,
      secretPath
    )
    
    const customMetadata = metadata.data?.custom_metadata || {}
    
    // Check if this cert is signed by the specified CA
    if (
      customMetadata.signed_by_path === caPath &&
      customMetadata.signed_by_key === caKey
    ) {
      const cert = await getCertificateWithMetadata(
        credentialId,
        secretPath,
        customMetadata.cert_name
      )
      results.push(cert)
    }
  }
  
  return results
}
```

### 4. Sync to Git (Read-Only Snapshot)

```typescript
async function syncVaultMetadataToGit(
  credentialId: string,
  environment: string
): Promise<string> {
  // 1. Fetch all certificates from Vault
  const allCerts = await getAllCertificatesFromVault(credentialId, environment)
  
  // 2. Generate YAML
  const yamlData = {
    _metadata: {
      source: 'vault',
      synced_at: new Date().toISOString(),
      environment: environment,
      warning: 'This file is auto-generated from Vault. Do not edit manually.'
    },
    certificates: allCerts.map(cert => ({
      name: cert.name,
      type: cert.type,
      vaultRef: cert.vaultRef,
      relationships: cert.relationships,
      // Don't include actual cert data in Git for security
      has_data: !!cert.data
    }))
  }
  
  return yaml.dump(yamlData)
}
```

## Benefits

### 1. Single Source of Truth
- Vault metadata is authoritative
- No sync issues between Git and Vault

### 2. Queryable
```bash
# Find all certs signed by a specific CA
vault kv metadata get -format=json kv-v2/dev/certs/servers/server1 | \
  jq '.data.custom_metadata.signed_by_path'

# Find all certs in a chain
vault kv metadata get -format=json kv-v2/dev/certs/servers/server1 | \
  jq '.data.custom_metadata.chain_ids'
```

### 3. Audit Trail
- Vault tracks all metadata changes
- Git has read-only snapshots for review

### 4. Access Control
- Vault policies control who can update metadata
- Separate permissions for data vs metadata

### 5. Versioning
- Vault KV2 versions both data and metadata
- Can rollback relationships if needed

## Migration Path

1. **Phase 1**: Keep current YAML approach
2. **Phase 2**: Add Vault metadata writes (dual-write)
3. **Phase 3**: Read from Vault metadata (Vault as source)
4. **Phase 4**: Make Git YAML read-only (auto-generated)

## Example Vault Policy

```hcl
# Allow reading cert data
path "kv-v2/data/dev/org1/cai/certs/*" {
  capabilities = ["read"]
}

# Allow updating cert data
path "kv-v2/data/dev/org1/cai/certs/*" {
  capabilities = ["create", "update"]
}

# Allow reading and updating metadata (relationships)
path "kv-v2/metadata/dev/org1/cai/certs/*" {
  capabilities = ["read", "update"]
}

# Platform team can manage all metadata
path "kv-v2/metadata/dev/org1/cai/certs/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
```
