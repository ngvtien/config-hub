# Certificate Management System

## 🎉 Complete and Ready to Use!

A comprehensive certificate management system for ArgoCD applications with Vault integration and External Secrets Operator (ESO) support.

---

## Quick Start

### 1. Create a certificate file
```yaml
# environments/dev/certificates.yaml
certificates: []
chains: {}
```

### 2. Open in UI
1. Navigate to ArgoCD Application
2. Go to Configuration tab
3. Open `certificates.yaml`
4. Click "Form" button

### 3. Start managing certificates!
- Add certificates
- Define relationships
- Build chains
- Push to Vault

---

## Features

### ✅ Certificate Management
- Add/Edit/Delete certificates
- 4 types: server, client, root-ca, intermediate-ca
- Vault path and key references
- Certificate data (PEM, thumbprint, password)
- Search and filter

### ✅ Relationships
Define how certificates relate to each other:

- **signs** - "I am signed by..." (CA hierarchy)
- **trusts** - "I trust..." (Trust establishment)  
- **validates** - "I authenticate to..." (mTLS, client auth)

📖 **Learn more:** `docs/certificate-relationships-explained.md`

### ✅ Certificate Chains
- Build complete certificate chains
- Visual chain builder
- Server → Intermediate → Root CA
- Optional client certificates

### ✅ Vault Integration
- Push certificates to Vault
- Store with metadata (relationships)
- Query by relationships
- Metadata persists across renewals

### ✅ ESO Integration
Works seamlessly with External Secrets Operator:
```
certificates.yaml (Git) → ESO → Vault → Kubernetes Secrets
```

**Note:** ESO only uses `vaultRef.path` and `vaultRef.key`. Everything else (name, type, relationships, chains) is metadata for documentation and tooling.

📖 **[Learn more about ESO integration](docs/guides/eso-integration-explained.md)**

---

## Documentation

📖 **[Complete Documentation](docs/README.md)** - Start here for organized docs

### Quick Links

**Getting Started:**
- [Quick Start](docs/getting-started/QUICK_START.md) - 2-minute quick start
- [Integration Complete](docs/getting-started/INTEGRATION_COMPLETE.md) - Full details
- [Integration Guide](docs/getting-started/INTEGRATION_GUIDE.md) - Step-by-step

**Guides:**
- [Certificate Relationships](docs/guides/certificate-relationships-explained.md) ⭐ Essential reading
- [ESO Integration Explained](docs/guides/eso-integration-explained.md) - What ESO uses vs metadata
- [Vault Metadata Approach](docs/guides/vault-metadata-approach.md)
- [Certificate Encoding Formats](docs/guides/certificate-encoding-formats.md)

**Quick References:**
- [Relationships Cheatsheet](docs/reference/certificate-relationships-cheatsheet.md)
- [Vault Quick Reference](docs/reference/vault-metadata-quick-reference.md)

**Examples:**
- [test-certificates.yaml](docs/examples/test-certificates.yaml)
- [example-certificate-structure.yaml](docs/examples/example-certificate-structure.yaml)

---

## File Format

```yaml
certificates:
  - name: MyServerCert
    type: server
    vaultRef:
      path: kv-v2/dev/certs/servers
      key: MyServerCert
    data:
      thumbprint: "ABC123..."
      definition: |
        -----BEGIN CERTIFICATE-----
        MIID...
        -----END CERTIFICATE-----
      password: "secret"
    relationships:
      - type: signs
        targetPath: kv-v2/dev/certs/ca
        targetKey: IntermediateCA
      - type: trusts
        targetPath: kv-v2/dev/certs/roots
        targetKey: RootCA

chains:
  ProductionChain:
    server:
      path: kv-v2/dev/certs/servers
      key: MyServerCert
      type: server
    intermediate:
      - path: kv-v2/dev/certs/ca
        key: IntermediateCA
        type: intermediate-ca
    rootCA:
      path: kv-v2/dev/certs/roots
      key: RootCA
      type: root-ca
```

---

## Architecture

### Components
```
┌─────────────────────────────────────────────────────────┐
│  UI Components                                          │
│  - CertificateFormEditor (main UI)                     │
│  - CertificateTable (list view)                        │
│  - CertificateEditModal (add/edit)                     │
│  - CertificateChainBuilder (build chains)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Type System                                            │
│  - Certificate types                                    │
│  - Relationship types                                   │
│  - PEM/Base64 helpers                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Vault Integration                                      │
│  - Save/load with metadata                              │
│  - Query by relationships                               │
│  - Safe metadata updates                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Storage                                                │
│  - Git: certificates.yaml (ESO references)              │
│  - Vault: Certificate data + metadata                   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow
```
User edits in UI
    ↓
Changes to certificates.yaml
    ↓
Commit to Git
    ↓
ESO reads certificates.yaml
    ↓
ESO fetches from Vault
    ↓
Creates Kubernetes secrets
```

---

## Examples

### Example 1: Simple HTTPS Server
```yaml
certificates:
  - name: WebServer
    type: server
    vaultRef:
      path: kv-v2/prod/certs/servers
      key: WebServer
    relationships:
      - type: signs
        targetPath: kv-v2/prod/certs/ca
        targetKey: LetsEncrypt
```

### Example 2: Mutual TLS (mTLS)
```yaml
certificates:
  # Server
  - name: APIServer
    type: server
    vaultRef:
      path: kv-v2/prod/certs/servers
      key: APIServer
    relationships:
      - type: signs
        targetPath: kv-v2/prod/certs/ca
        targetKey: CompanyCA
      - type: trusts
        targetPath: kv-v2/prod/certs/ca
        targetKey: CompanyCA

  # Client
  - name: ServiceClient
    type: client
    vaultRef:
      path: kv-v2/prod/certs/clients
      key: ServiceClient
    relationships:
      - type: signs
        targetPath: kv-v2/prod/certs/ca
        targetKey: CompanyCA
      - type: validates
        targetPath: kv-v2/prod/certs/servers
        targetKey: APIServer
```

### Example 3: Complete Chain
```yaml
certificates:
  - name: RootCA
    type: root-ca
    vaultRef:
      path: kv-v2/prod/certs/roots
      key: RootCA

  - name: IntermediateCA
    type: intermediate-ca
    vaultRef:
      path: kv-v2/prod/certs/intermediates
      key: IntermediateCA
    relationships:
      - type: signs
        targetPath: kv-v2/prod/certs/roots
        targetKey: RootCA

  - name: ServerCert
    type: server
    vaultRef:
      path: kv-v2/prod/certs/servers
      key: ServerCert
    relationships:
      - type: signs
        targetPath: kv-v2/prod/certs/intermediates
        targetKey: IntermediateCA
      - type: trusts
        targetPath: kv-v2/prod/certs/roots
        targetKey: RootCA

chains:
  ProductionChain:
    server:
      path: kv-v2/prod/certs/servers
      key: ServerCert
      type: server
    intermediate:
      - path: kv-v2/prod/certs/intermediates
        key: IntermediateCA
        type: intermediate-ca
    rootCA:
      path: kv-v2/prod/certs/roots
      key: RootCA
      type: root-ca
```

---

## Troubleshooting

### Form button is disabled
**Solution:** File must be named `certificates.yaml` or `certs.yaml`

### Form view doesn't render
**Solution:** Check browser console for errors

### Can't save changes
**Solution:** Verify Git credentials are configured

### Vault push fails
**Solution:** Check Vault credentials in settings

---

## Contributing

### Adding New Features
1. Update types in `src/types/certificates.ts`
2. Update UI components in `src/components/secrets/`
3. Update Vault integration in `src/lib/vault-certificate-metadata.ts`
4. Update documentation

### Testing
1. Create test file: `test-certificates.yaml`
2. Open in UI
3. Test all features
4. Verify YAML generation
5. Test Vault integration

---

## License

[Your License Here]

---

## Support

- 📖 Full documentation in `docs/` folder
- 🐛 Report issues on GitHub
- 💬 Ask questions in discussions

---

**Built with ❤️ for secure certificate management**
