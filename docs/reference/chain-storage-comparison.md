# Chain Storage in Vault - Quick Comparison

## Four Approaches to Store Certificate Chains

---

## Approach 1: Chain ID on Each Certificate ⭐ Recommended

### Storage
```
Server Cert Metadata:
  chain_ids: "production-chain,backup-chain"
  chain_role_production_chain: "server"

Intermediate Cert Metadata:
  chain_ids: "production-chain,backup-chain"
  chain_role_production_chain: "intermediate"

Root CA Metadata:
  chain_ids: "production-chain,backup-chain"
  chain_role_production_chain: "rootCA"
```

### Visual
```
┌─────────────────┐
│  Server Cert    │
│  chain_ids:     │
│  "prod,backup"  │
└─────────────────┘

┌─────────────────┐
│  Intermediate   │
│  chain_ids:     │
│  "prod,backup"  │
└─────────────────┘

┌─────────────────┐
│  Root CA        │
│  chain_ids:     │
│  "prod,backup"  │
└─────────────────┘
```

### Queries
- ✅ "Which chains is this cert in?" → Read cert metadata
- ✅ "Which certs are in this chain?" → Query all certs, filter by chain_id
- ⚠️ "What's the chain structure?" → Need to query all certs and reconstruct

---

## Approach 2: Separate Chain Secret

### Storage
```
kv-v2/dev/chains/production-chain:
  server: "kv-v2/dev/certs/servers:server1"
  intermediate: "kv-v2/dev/certs/intermediates:intermediate1"
  rootCA: "kv-v2/dev/certs/roots:root1"

Server Cert Metadata:
  chain_ids: "production-chain"
```

### Visual
```
┌─────────────────────────────────────┐
│  kv-v2/dev/chains/production-chain  │
│  ┌───────────────────────────────┐  │
│  │ server: servers:server1       │  │
│  │ intermediate: intermediates:1 │  │
│  │ rootCA: roots:root1           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         ↓ references
┌─────────────────┐
│  Server Cert    │
│  chain_ids:     │
│  "production"   │
└─────────────────┘
```

### Queries
- ✅ "What's the chain structure?" → Read chain secret
- ✅ "Which chains is this cert in?" → Read cert metadata
- ✅ "Which certs are in this chain?" → Read chain secret

---

## Approach 3: Chain in Root CA Metadata

### Storage
```
Root CA Metadata:
  chains: {
    "production-chain": {
      "server": {"path": "...", "key": "..."},
      "intermediate": [{"path": "...", "key": "..."}]
    }
  }

Server Cert Metadata:
  chain_ids: "production-chain"
  chain_root: "kv-v2/dev/certs/roots/root1"
```

### Visual
```
┌─────────────────────────────────────┐
│  Root CA Metadata                   │
│  ┌───────────────────────────────┐  │
│  │ chains: {                     │  │
│  │   "production-chain": {       │  │
│  │     server: {...},            │  │
│  │     intermediate: [{...}]     │  │
│  │   }                           │  │
│  │ }                             │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         ↑ points to
┌─────────────────┐
│  Server Cert    │
│  chain_root:    │
│  "roots/root1"  │
└─────────────────┘
```

### Queries
- ✅ "What's the chain structure?" → Read root CA metadata
- ⚠️ "Which chains is this cert in?" → Need to know which root to check
- ⚠️ "Which certs are in this chain?" → Parse JSON from root metadata

---

## Approach 4: Hybrid (Chain ID + Separate Secret)

### Storage
```
kv-v2/dev/chains/production-chain:
  server: "kv-v2/dev/certs/servers:server1"
  intermediate: "kv-v2/dev/certs/intermediates:intermediate1"
  rootCA: "kv-v2/dev/certs/roots:root1"

Server Cert Metadata:
  chain_ids: "production-chain"

Chain Metadata:
  environment: "production"
  owner: "platform-team"
```

### Visual
```
┌─────────────────────────────────────┐
│  kv-v2/dev/chains/production-chain  │
│  Data: server, intermediate, rootCA │
│  Metadata: environment, owner       │
└─────────────────────────────────────┘
         ↕ bidirectional
┌─────────────────┐
│  Server Cert    │
│  chain_ids:     │
│  "production"   │
└─────────────────┘
```

### Queries
- ✅ "What's the chain structure?" → Read chain secret
- ✅ "Which chains is this cert in?" → Read cert metadata
- ✅ "Which certs are in this chain?" → Read chain secret
- ✅ "Chain metadata?" → Read chain metadata

---

## Comparison Table

| Feature | Approach 1 | Approach 2 | Approach 3 | Approach 4 |
|---------|------------|------------|------------|------------|
| **Complexity** | Low | Medium | Low | High |
| **Query Speed** | Fast | Fast | Slow | Fast |
| **Scalability** | High | Medium | Low | High |
| **Maintenance** | Easy | Medium | Hard | Medium |
| **Extra Secrets** | No | Yes | No | Yes |
| **Bidirectional** | Yes | Yes | No | Yes |
| **Chain Versioning** | No | Yes | No | Yes |

---

## Query Examples

### "Which chains is server1 in?"

**Approach 1:**
```bash
vault kv metadata get kv-v2/dev/certs/servers/server1 | jq '.data.custom_metadata.chain_ids'
# "production-chain,backup-chain"
```

**Approach 2:**
```bash
vault kv metadata get kv-v2/dev/certs/servers/server1 | jq '.data.custom_metadata.chain_ids'
# "production-chain"
```

**Approach 3:**
```bash
vault kv metadata get kv-v2/dev/certs/servers/server1 | jq '.data.custom_metadata.chain_root'
# "kv-v2/dev/certs/roots/root1"
# Then query root CA metadata
```

**Approach 4:**
```bash
vault kv metadata get kv-v2/dev/certs/servers/server1 | jq '.data.custom_metadata.chain_ids'
# "production-chain"
```

---

### "What's in production-chain?"

**Approach 1:**
```bash
# Query all certs, filter by chain_id
vault kv list -format=json kv-v2/dev/certs/servers | \
  jq -r '.[]' | \
  while read cert; do
    vault kv metadata get -format=json kv-v2/dev/certs/servers/$cert | \
      jq -r 'select(.data.custom_metadata.chain_ids | contains("production-chain"))'
  done
```

**Approach 2:**
```bash
vault kv get -format=json kv-v2/dev/chains/production-chain | jq '.data.data'
# {
#   "server": "kv-v2/dev/certs/servers:server1",
#   "intermediate": "kv-v2/dev/certs/intermediates:intermediate1",
#   "rootCA": "kv-v2/dev/certs/roots:root1"
# }
```

**Approach 3:**
```bash
# Need to know which root CA
vault kv metadata get -format=json kv-v2/dev/certs/roots/root1 | \
  jq '.data.custom_metadata.chains | fromjson | .["production-chain"]'
```

**Approach 4:**
```bash
vault kv get -format=json kv-v2/dev/chains/production-chain | jq '.data.data'
# Same as Approach 2
```

---

## Recommendation by Use Case

### Simple Setup (< 10 chains)
→ **Approach 1** (Chain ID on certificates)
- Easy to implement
- No extra secrets
- Good enough for most cases

### Medium Setup (10-50 chains)
→ **Approach 2** (Separate chain secrets)
- Clear chain definitions
- Easy to version
- Manageable number of secrets

### Complex Setup (> 50 chains)
→ **Approach 4** (Hybrid)
- Best query performance
- Bidirectional lookups
- Scalable

### Hierarchical Setup
→ **Approach 3** (Root CA metadata)
- Logical hierarchy
- Good for simple chains
- Not recommended for complex setups

---

## Implementation Complexity

### Approach 1: Simplest
```typescript
// Just update cert metadata
await vault.kv.metadata.put(certPath, {
  chain_ids: 'production-chain,backup-chain'
})
```

### Approach 2: Medium
```typescript
// Update cert metadata + create chain secret
await vault.kv.metadata.put(certPath, {
  chain_ids: 'production-chain'
})
await vault.kv.put('kv-v2/dev/chains/production-chain', {
  server: 'kv-v2/dev/certs/servers:server1',
  // ...
})
```

### Approach 3: Simple but Limited
```typescript
// Update root CA metadata (can get large)
await vault.kv.metadata.put(rootPath, {
  chains: JSON.stringify({
    'production-chain': { /* chain def */ }
  })
})
```

### Approach 4: Most Complex
```typescript
// Update cert metadata + chain secret + chain metadata
await vault.kv.metadata.put(certPath, {
  chain_ids: 'production-chain'
})
await vault.kv.put('kv-v2/dev/chains/production-chain', {
  server: 'kv-v2/dev/certs/servers:server1',
  // ...
})
await vault.kv.metadata.put('kv-v2/dev/chains/production-chain', {
  environment: 'production',
  owner: 'platform-team'
})
```

---

## Summary

### For Most Cases: Approach 1 ⭐
- Store `chain_ids` on each certificate
- Simple, scalable, easy to maintain

### For Complex Cases: Approach 4
- Separate chain secrets + cert metadata
- Best query performance
- Bidirectional lookups

### Avoid: Approach 3
- Root CA metadata gets too large
- Hard to query
- Not scalable

---

📖 **Full guide:** [Storing Chains in Vault](../guides/storing-chains-in-vault.md)
