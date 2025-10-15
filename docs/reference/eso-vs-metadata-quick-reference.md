# ESO vs Metadata - Quick Reference

## What ESO Uses vs What's Metadata

---

## TL;DR

```yaml
certificates:
  - name: MyCert              # ❌ Metadata only
    type: server              # ❌ Metadata only
    vaultRef:
      path: kv-v2/dev/certs   # ✅ ESO USES THIS
      key: MyCert             # ✅ ESO USES THIS
    relationships: [...]      # ❌ Metadata only
    data: { ... }             # ❌ Metadata only

chains:                       # ❌ Metadata only
  MyChain: { ... }
```

---

## Quick Lookup

| Field | ESO Uses? | Purpose |
|-------|-----------|---------|
| `vaultRef.path` | ✅ YES | Where to fetch from Vault |
| `vaultRef.key` | ✅ YES | Which key to fetch |
| `name` | ❌ NO | Human-readable identifier |
| `type` | ❌ NO | Certificate type (UI, filtering) |
| `relationships` | ❌ NO | Document hierarchy |
| `data` | ❌ NO | Preview/push to Vault |
| `chains` | ❌ NO | Documentation, deployment planning |

---

## ESO Workflow

```
1. ESO reads certificates.yaml
2. ESO extracts vaultRef.path + vaultRef.key
3. ESO fetches from Vault at that location
4. ESO creates Kubernetes secret
```

**Everything else is ignored by ESO.**

---

## Why Include Metadata?

### For Humans
- 📝 Documentation
- 👁️ Visual understanding
- 🔍 Searchability

### For Tooling
- 🎨 UI features (icons, filtering)
- 🔗 Relationship tracking
- ⚙️ Future automation

### For Vault
- 💾 Store in Vault custom metadata
- 🔎 Query by relationships
- 📊 Track certificate lifecycle

---

## Examples

### Minimal (ESO only)
```yaml
certificates:
  - vaultRef:
      path: kv-v2/dev/certs/servers
      key: ServerCert
```
**Works but not recommended** - No documentation

### Recommended (ESO + Metadata)
```yaml
certificates:
  - name: APIServerCertificate
    type: server
    vaultRef:
      path: kv-v2/dev/certs/servers
      key: ServerCert
    relationships:
      - type: signs
        targetKey: CompanyCA
```
**Best practice** - ESO works + good documentation

---

## Certificate Chains

```yaml
chains:
  ProductionChain:
    server: { path: ..., key: ..., type: server }
    intermediate: [ ... ]
    rootCA: { path: ..., key: ..., type: root-ca }
```

**Purpose:**
- ❌ NOT used by ESO
- ✅ Documents which certs work together
- ✅ Deployment planning
- ✅ Future automation
- ✅ Human understanding

---

## Key Takeaway

**certificates.yaml has two purposes:**

1. **ESO Config** - `vaultRef` (required)
2. **Documentation** - Everything else (recommended)

Both are valuable!

---

📖 **Full guide:** [ESO Integration Explained](../guides/eso-integration-explained.md)
