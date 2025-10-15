# Storing Certificate Chains in Vault Metadata

## How to Store Chain Information in Vault

There are multiple approaches to storing certificate chain information in Vault metadata, each with different trade-offs.

---

## Approach 1: Store Chain ID on Each Certificate (Recommended)

### Concept
Each certificate stores which chain(s) it belongs to in its own metadata.

### Implementation

```bash
# Server certificate
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "cert_type": "server",
    "cert_name": "APIServerCert",
    "chain_ids": "production-chain,backup-chain",
    "chain_role_production-chain": "server",
    "chain_role_backup-chain": "server"
  }'

# Intermediate CA
vault kv metadata put kv-v2/dev/certs/intermediates/intermediate1 \
  custom_metadata='{
    "cert_type": "intermediate-ca",
    "cert_name": "IntermediateCA",
    "chain_ids": "production-chain,backup-chain",
    "chain_role_production-chain": "intermediate",
    "chain_role_backup-chain": "intermediate"
  }'

# Root CA
vault kv metadata put kv-v2/dev/certs/roots/root1 \
  custom_metadata='{
    "cert_type": "root-ca",
    "cert_name": "RootCA",
    "chain_ids": "production-chain,backup-chain",
    "chain_role_production-chain": "rootCA",
    "chain_role_backup-chain": "rootCA"
  }'
```

### Query Chain
```typescript
// Find all certificates in a chain
async function getCertificatesInChain(chainId: string) {
  const allCerts = await listAllCertificates()
  
  return allCerts.filter(cert => {
    const metadata = cert.custom_metadata
    const chainIds = metadata.chain_ids?.split(',') || []
    return chainIds.includes(chainId)
  })
}

// Result:
// [
//   { name: "APIServerCert", role: "server" },
//   { name: "IntermediateCA", role: "intermediate" },
//   { name: "RootCA", role: "rootCA" }
// ]
```

### Pros
- ✅ Distributed - Each cert knows its chains
- ✅ Easy to query - "Which chains is this cert in?"
- ✅ Scalable - No single large metadata object
- ✅ Flexible - Cert can be in multiple chains

### Cons
- ⚠️ No single chain definition
- ⚠️ Need to query multiple certs to see full chain

---

## Approach 2: Store Chain Definition in Separate Secret

### Concept
Store the complete chain definition as a separate secret in Vault.

### Implementation

```bash
# Store chain definition as a secret
vault kv put kv-v2/dev/chains/production-chain \
  name="ProductionChain" \
  description="Production server certificate chain" \
  server_path="kv-v2/dev/certs/servers" \
  server_key="server1" \
  intermediate_paths='["kv-v2/dev/certs/intermediates"]' \
  intermediate_keys='["intermediate1"]' \
  rootCA_path="kv-v2/dev/certs/roots" \
  rootCA_key="root1" \
  created_at="2025-10-15T10:00:00Z" \
  updated_at="2025-10-15T10:00:00Z"

# Also tag each certificate with chain membership
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "cert_type": "server",
    "chain_ids": "production-chain"
  }'
```

### Query Chain
```typescript
// Get complete chain definition
async function getChainDefinition(chainId: string) {
  const result = await vault.kv.get(`kv-v2/dev/chains/${chainId}`)
  return result.data
}

// Result:
// {
//   name: "ProductionChain",
//   server_path: "kv-v2/dev/certs/servers",
//   server_key: "server1",
//   intermediate_paths: ["kv-v2/dev/certs/intermediates"],
//   intermediate_keys: ["intermediate1"],
//   rootCA_path: "kv-v2/dev/certs/roots",
//   rootCA_key: "root1"
// }
```

### Pros
- ✅ Single source of truth for chain
- ✅ Easy to see complete chain
- ✅ Can version chain definitions
- ✅ Clear chain structure

### Cons
- ⚠️ Separate secret to manage
- ⚠️ Need to keep in sync with certificates
- ⚠️ Extra Vault path to manage

---

## Approach 3: Store Chain in Root CA Metadata (Hierarchical)

### Concept
Store the chain definition in the root CA's metadata, since it's the top of the chain.

### Implementation

```bash
# Root CA stores the complete chain
vault kv metadata put kv-v2/dev/certs/roots/root1 \
  custom_metadata='{
    "cert_type": "root-ca",
    "cert_name": "RootCA",
    "chains": "{\"production-chain\":{\"server\":{\"path\":\"kv-v2/dev/certs/servers\",\"key\":\"server1\"},\"intermediate\":[{\"path\":\"kv-v2/dev/certs/intermediates\",\"key\":\"intermediate1\"}]}}"
  }'

# Other certs just reference the chain
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "cert_type": "server",
    "chain_ids": "production-chain",
    "chain_root": "kv-v2/dev/certs/roots/root1"
  }'
```

### Query Chain
```typescript
// Get chain from root CA
async function getChainFromRoot(chainId: string, rootPath: string) {
  const metadata = await vault.kv.metadata.get(rootPath)
  const chains = JSON.parse(metadata.custom_metadata.chains)
  return chains[chainId]
}
```

### Pros
- ✅ Logical - Root CA owns the chain
- ✅ Single definition per root
- ✅ Clear hierarchy

### Cons
- ⚠️ Root CA metadata can get large
- ⚠️ Need to know which root to query
- ⚠️ JSON in metadata (not ideal)

---

## Approach 4: Hybrid - Chain ID + Separate Definition

### Concept
Combine approaches: certificates store chain IDs, separate secrets store definitions.

### Implementation

```bash
# 1. Each certificate stores chain membership
vault kv metadata put kv-v2/dev/certs/servers/server1 \
  custom_metadata='{
    "cert_type": "server",
    "chain_ids": "production-chain,backup-chain"
  }'

# 2. Chain definition stored separately
vault kv put kv-v2/dev/chains/production-chain \
  name="ProductionChain" \
  server="kv-v2/dev/certs/servers:server1" \
  intermediate="kv-v2/dev/certs/intermediates:intermediate1" \
  rootCA="kv-v2/dev/certs/roots:root1"

# 3. Chain metadata for additional info
vault kv metadata put kv-v2/dev/chains/production-chain \
  custom_metadata='{
    "environment": "production",
    "owner": "platform-team",
    "created_at": "2025-10-15T10:00:00Z"
  }'
```

### Query Chain
```typescript
// Get certificates in chain
async function getCertificatesInChain(chainId: string) {
  // Get chain definition
  const chainDef = await vault.kv.get(`kv-v2/dev/chains/${chainId}`)
  
  // Fetch each certificate
  const server = await vault.kv.get(chainDef.data.server)
  const intermediate = await vault.kv.get(chainDef.data.intermediate)
  const rootCA = await vault.kv.get(chainDef.data.rootCA)
  
  return { server, intermediate, rootCA }
}

// Get chains for a certificate
async function getChainsForCertificate(certPath: string) {
  const metadata = await vault.kv.metadata.get(certPath)
  const chainIds = metadata.custom_metadata.chain_ids?.split(',') || []
  
  return Promise.all(
    chainIds.map(id => vault.kv.get(`kv-v2/dev/chains/${id}`))
  )
}
```

### Pros
- ✅ Best of both worlds
- ✅ Bidirectional queries
- ✅ Clear separation
- ✅ Scalable

### Cons
- ⚠️ More complex
- ⚠️ Multiple Vault paths
- ⚠️ Need to keep in sync

---

## Recommended Approach

### For Most Use Cases: Approach 1 (Chain ID on Certificates)

**Why:**
- Simple to implement
- Each certificate is self-contained
- Easy to query "which chains is this cert in?"
- No extra secrets to manage

**Implementation:**

```typescript
// When saving certificate
async function saveCertificateWithChains(
  cert: CertificateItem,
  chainIds: string[]
) {
  // Save certificate data
  await vault.kv.put(cert.vaultRef.path, {
    [cert.vaultRef.key]: {
      thumbprint: cert.data.thumbprint,
      definition: cert.data.definition,
      password: cert.data.password
    }
  })
  
  // Save metadata with chain info
  await vault.kv.metadata.put(cert.vaultRef.path, {
    cert_type: cert.type,
    cert_name: cert.name,
    chain_ids: chainIds.join(','),
    // Add role for each chain
    ...chainIds.reduce((acc, chainId) => {
      acc[`chain_role_${chainId}`] = getRoleInChain(cert, chainId)
      return acc
    }, {})
  })
}

// Query certificates in a chain
async function getCertificatesInChain(chainId: string) {
  const allCerts = await listAllCertificates()
  
  return allCerts
    .filter(cert => {
      const chainIds = cert.custom_metadata.chain_ids?.split(',') || []
      return chainIds.includes(chainId)
    })
    .map(cert => ({
      path: cert.path,
      key: cert.key,
      name: cert.custom_metadata.cert_name,
      type: cert.custom_metadata.cert_type,
      role: cert.custom_metadata[`chain_role_${chainId}`]
    }))
    .sort((a, b) => {
      // Sort by role: server, intermediate, rootCA
      const order = { server: 0, intermediate: 1, rootCA: 2 }
      return order[a.role] - order[b.role]
    })
}
```

---

## For Complex Scenarios: Approach 4 (Hybrid)

**When to use:**
- Multiple chains with complex relationships
- Need to version chain definitions
- Want bidirectional queries
- Building automation

**Implementation:**

```typescript
// Save chain definition
async function saveChainDefinition(chain: CertificateChain, chainId: string) {
  // 1. Save chain definition as secret
  await vault.kv.put(`kv-v2/dev/chains/${chainId}`, {
    name: chainId,
    server: chain.server ? `${chain.server.path}:${chain.server.key}` : null,
    intermediate: chain.intermediate?.map(i => `${i.path}:${i.key}`).join(','),
    rootCA: chain.rootCA ? `${chain.rootCA.path}:${chain.rootCA.key}` : null,
    client: chain.client ? `${chain.client.path}:${chain.client.key}` : null
  })
  
  // 2. Update each certificate's metadata
  const certs = [
    chain.server,
    ...(chain.intermediate || []),
    chain.rootCA,
    chain.client
  ].filter(Boolean)
  
  for (const cert of certs) {
    await addCertificateToChain(cert.path, cert.key, chainId)
  }
}

// Add certificate to chain
async function addCertificateToChain(
  path: string,
  key: string,
  chainId: string
) {
  const metadata = await vault.kv.metadata.get(path)
  const existingChains = metadata.custom_metadata.chain_ids?.split(',') || []
  
  if (!existingChains.includes(chainId)) {
    existingChains.push(chainId)
  }
  
  await vault.kv.metadata.put(path, {
    ...metadata.custom_metadata,
    chain_ids: existingChains.join(',')
  })
}
```

---

## Comparison Table

| Approach | Complexity | Query Speed | Scalability | Maintenance |
|----------|------------|-------------|-------------|-------------|
| 1. Chain ID on Certs | Low | Fast | High | Easy |
| 2. Separate Secret | Medium | Medium | Medium | Medium |
| 3. Root CA Metadata | Low | Slow | Low | Hard |
| 4. Hybrid | High | Fast | High | Medium |

---

## Example: Complete Implementation

### Approach 1 (Recommended)

```typescript
// Save certificate with chain membership
await vault.kv.put('kv-v2/dev/certs/servers/server1', {
  server1: {
    thumbprint: 'ABC123',
    definition: '-----BEGIN CERT-----...',
    password: 'secret'
  }
})

await vault.kv.metadata.put('kv-v2/dev/certs/servers/server1', {
  cert_type: 'server',
  cert_name: 'APIServerCert',
  chain_ids: 'production-chain,backup-chain',
  chain_role_production_chain: 'server',
  chain_role_backup_chain: 'server',
  signed_by_path: 'kv-v2/dev/certs/intermediates',
  signed_by_key: 'intermediate1'
})

// Query: Get all certs in production-chain
const certs = await getCertificatesInChain('production-chain')
// Returns: [server1, intermediate1, root1]

// Query: Get all chains for server1
const chains = await getChainsForCertificate('kv-v2/dev/certs/servers/server1')
// Returns: ['production-chain', 'backup-chain']
```

---

## Summary

### Recommended: Approach 1 (Chain ID on Certificates)

**Store on each certificate:**
```
custom_metadata:
  chain_ids: "production-chain,backup-chain"
  chain_role_production_chain: "server"
  chain_role_backup_chain: "server"
```

**Why:**
- ✅ Simple
- ✅ Scalable
- ✅ Easy to query
- ✅ No extra secrets

**When to use Hybrid (Approach 4):**
- Need complex chain definitions
- Want to version chains
- Building automation
- Need bidirectional queries

---

## Related Documentation

- [Vault Metadata Approach](vault-metadata-approach.md)
- [Implementation Status](../reference/implementation-status.md)
- [Certificate Relationships Explained](certificate-relationships-explained.md)
