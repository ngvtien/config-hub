# ESO Integration Explained

## What ESO Uses vs What's Metadata

Understanding what External Secrets Operator (ESO) actually uses from `certificates.yaml`.

---

## TL;DR

**ESO uses:**
- ✅ `certificates[].vaultRef.path`
- ✅ `certificates[].vaultRef.key`

**ESO ignores (metadata only):**
- ❌ `certificates[].name`
- ❌ `certificates[].type`
- ❌ `certificates[].relationships`
- ❌ `certificates[].data`
- ❌ `chains`

---

## Detailed Breakdown

### What ESO Actually Uses

```yaml
certificates:
  - name: ServerCert              # ❌ ESO doesn't use this
    type: server                  # ❌ ESO doesn't use this
    vaultRef:
      path: kv-v2/dev/certs/servers  # ✅ ESO USES THIS
      key: ServerCert                 # ✅ ESO USES THIS
    relationships: [...]          # ❌ ESO doesn't use this
    data: { ... }                 # ❌ ESO doesn't use this
```

**ESO only cares about:**
- `vaultRef.path` - Where in Vault to look
- `vaultRef.key` - Which key to fetch

---

## ESO Configuration Example

### Your certificates.yaml
```yaml
certificates:
  - name: APIServerCertificate
    type: server
    vaultRef:
      path: kv-v2/prod/certs/servers
      key: APIServerCert
```

### Corresponding ESO ExternalSecret
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-server-certs
spec:
  secretStoreRef:
    name: vault-backend
  target:
    name: api-server-certs
  data:
    # ESO reads from certificates.yaml and creates this:
    - secretKey: tls.crt
      remoteRef:
        key: kv-v2/prod/certs/servers    # From vaultRef.path
        property: APIServerCert           # From vaultRef.key
```

**ESO workflow:**
1. Reads `vaultRef.path` and `vaultRef.key` from certificates.yaml
2. Fetches secret from Vault at that location
3. Creates Kubernetes secret

---

## What's Metadata (Not Used by ESO)

### 1. Certificate Name
```yaml
- name: MyServerCert    # ❌ Metadata only
```
**Purpose:** Human-readable identifier in the UI

### 2. Certificate Type
```yaml
- type: server          # ❌ Metadata only
```
**Purpose:** Categorization, UI filtering, documentation

### 3. Relationships
```yaml
relationships:          # ❌ Metadata only
  - type: signs
    targetPath: kv-v2/dev/certs/ca
    targetKey: MyCA
```
**Purpose:** 
- Document certificate hierarchy
- Track which CA signs which cert
- Enable querying in Vault metadata
- Future automation

### 4. Certificate Data
```yaml
data:                   # ❌ Metadata only
  thumbprint: "ABC123"
  definition: "-----BEGIN CERT-----..."
  password: "secret"
```
**Purpose:**
- Preview in UI
- Push to Vault via UI
- Not used by ESO (ESO fetches from Vault directly)

### 5. Certificate Chains
```yaml
chains:                 # ❌ Metadata only
  ProductionChain:
    server: { ... }
    intermediate: [ ... ]
    rootCA: { ... }
```
**Purpose:**
- **Documentation** - "This is our production chain"
- **Relationship tracking** - "These certs work together"
- **Deployment planning** - "Use these certs together"
- **Future tooling** - Could be used for automation
- **Human understanding** - Visual representation

---

## Why Have Metadata Then?

### 1. Documentation
```yaml
# Without metadata
certificates:
  - vaultRef:
      path: kv-v2/prod/certs/servers
      key: cert1

# With metadata (much clearer!)
certificates:
  - name: APIServerCertificate
    type: server
    vaultRef:
      path: kv-v2/prod/certs/servers
      key: cert1
    relationships:
      - type: signs
        targetKey: CompanyCA
```

### 2. UI/Tooling
- UI can display certificate types with icons
- Filter by type (server, client, CA)
- Show relationships visually
- Build certificate chains
- Validate configurations

### 3. Vault Metadata Integration
When you push certificates to Vault, metadata becomes useful:
```typescript
// Store relationships in Vault custom metadata
await vault.putMetadata(path, {
  cert_type: 'server',
  signed_by: 'CompanyCA',
  chain_id: 'production-chain'
})

// Later: Query certificates by relationship
const certs = await findCertificatesSignedBy('CompanyCA')
```

### 4. Future Automation
```yaml
chains:
  ProductionChain:
    server: { ... }
    intermediate: [ ... ]
    rootCA: { ... }
```

Future tooling could:
- Auto-generate ESO ExternalSecrets from chains
- Validate certificate chains
- Auto-renew certificates in a chain
- Deploy complete chains together

---

## Complete Example

### certificates.yaml
```yaml
# What ESO uses
certificates:
  - name: APIServer                    # Metadata
    type: server                       # Metadata
    vaultRef:
      path: kv-v2/prod/certs/servers   # ✅ ESO uses this
      key: APIServerCert                # ✅ ESO uses this
    relationships:                     # Metadata
      - type: signs
        targetKey: CompanyCA

  - name: CompanyCA                    # Metadata
    type: intermediate-ca              # Metadata
    vaultRef:
      path: kv-v2/prod/certs/ca        # ✅ ESO uses this
      key: CompanyCA                    # ✅ ESO uses this

# What ESO ignores (metadata only)
chains:
  ProductionChain:
    server:
      path: kv-v2/prod/certs/servers
      key: APIServerCert
      type: server
    intermediate:
      - path: kv-v2/prod/certs/ca
        key: CompanyCA
        type: intermediate-ca
```

### ESO ExternalSecret (Generated)
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-certs
spec:
  secretStoreRef:
    name: vault-backend
  target:
    name: api-certs
  data:
    # Server cert
    - secretKey: server-cert
      remoteRef:
        key: kv-v2/prod/certs/servers    # From vaultRef.path
        property: APIServerCert           # From vaultRef.key
    
    # CA cert
    - secretKey: ca-cert
      remoteRef:
        key: kv-v2/prod/certs/ca         # From vaultRef.path
        property: CompanyCA               # From vaultRef.key
```

---

## Data Flow

### Current Flow (ESO)
```
certificates.yaml (Git)
    ↓
ESO reads vaultRef.path + vaultRef.key
    ↓
ESO fetches from Vault
    ↓
ESO creates Kubernetes secrets
```

**Metadata (name, type, relationships, chains) is NOT used in this flow.**

### Future Flow (With Automation)
```
certificates.yaml (Git)
    ↓
Automation reads chains
    ↓
Auto-generates ESO ExternalSecrets
    ↓
ESO fetches from Vault
    ↓
ESO creates Kubernetes secrets
```

**Metadata becomes useful for automation.**

---

## Best Practices

### 1. Always Include Metadata
Even though ESO doesn't use it, metadata helps humans:

```yaml
✅ Good:
- name: APIServerCert
  type: server
  vaultRef:
    path: kv-v2/prod/certs/servers
    key: APIServerCert
  relationships:
    - type: signs
      targetKey: CompanyCA

❌ Bad (but works):
- vaultRef:
    path: kv-v2/prod/certs/servers
    key: APIServerCert
```

### 2. Use Chains for Documentation
```yaml
chains:
  ProductionChain:
    server: { path: ..., key: ..., type: server }
    intermediate: [ { path: ..., key: ..., type: intermediate-ca } ]
    rootCA: { path: ..., key: ..., type: root-ca }
```

This documents which certificates work together, even if ESO doesn't use it.

### 3. Keep vaultRef Accurate
```yaml
✅ Good:
vaultRef:
  path: kv-v2/prod/certs/servers  # Matches actual Vault path
  key: APIServerCert               # Matches actual Vault key

❌ Bad:
vaultRef:
  path: kv-v2/prod/certs/servers
  key: WrongKey                    # ESO will fail to fetch
```

---

## Summary

### ESO Uses (Required)
- ✅ `vaultRef.path`
- ✅ `vaultRef.key`

### Metadata Only (Optional but Recommended)
- 📝 `name` - Human-readable identifier
- 📝 `type` - Certificate type (server, client, ca)
- 📝 `relationships` - Certificate hierarchy
- 📝 `data` - Certificate preview/push
- 📝 `chains` - Deployment documentation

### Why Include Metadata?
1. **Documentation** - Makes certificates.yaml readable
2. **UI/Tooling** - Enables rich UI features
3. **Vault Integration** - Can be stored in Vault metadata
4. **Future Automation** - Enables advanced features
5. **Human Understanding** - Clear what each cert is for

---

## Key Takeaway

**certificates.yaml serves two purposes:**

1. **ESO Configuration** - `vaultRef` tells ESO where to fetch secrets
2. **Documentation/Metadata** - Everything else documents your PKI

Both are valuable! ESO uses the first, humans and tooling use the second.

---

## Related Documentation

- [Certificate Relationships Explained](certificate-relationships-explained.md)
- [Vault Metadata Approach](vault-metadata-approach.md)
- [Quick Start](../getting-started/QUICK_START.md)
