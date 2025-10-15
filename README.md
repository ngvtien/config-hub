# Certificate Management System

Complete certificate management for ArgoCD applications with Vault integration and External Secrets Operator (ESO) support.

---

## 🚀 Quick Start

```bash
# 1. Create a certificate file
cat > environments/dev/certificates.yaml << EOF
certificates: []
chains: {}
EOF

# 2. Open in UI
# Navigate to ArgoCD Application → Configuration → certificates.yaml

# 3. Click "Form" button to manage certificates
```

**[→ Full Quick Start Guide](docs/getting-started/QUICK_START.md)**

---

## 📚 Documentation

### Start Here
- **[docs/README.md](docs/README.md)** - Complete documentation hub
- **[README-CERTIFICATES.md](README-CERTIFICATES.md)** - System overview
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Find anything

### Quick Links
- [Quick Start](docs/getting-started/QUICK_START.md) - Get started in 2 minutes
- [Certificate Relationships](docs/guides/certificate-relationships-explained.md) - Understand signs, trusts, validates
- [Integration Guide](docs/getting-started/INTEGRATION_GUIDE.md) - How to integrate
- [Examples](docs/examples/) - Sample files

---

## ✨ Features

- ✅ Form-based certificate management
- ✅ 4 certificate types (server, client, root-ca, intermediate-ca)
- ✅ Certificate relationships (signs, trusts, validates)
- ✅ Certificate chain builder
- ✅ Vault integration with metadata
- ✅ ESO (External Secrets Operator) support
- ✅ Split view (form + YAML)

---

## 🔐 Certificate Relationships

Three types of relationships to model your PKI:

- **signs** - "I am signed by..." (CA hierarchy)
- **trusts** - "I trust..." (Trust establishment)
- **validates** - "I authenticate to..." (mTLS, client auth)

**[→ Learn More](docs/guides/certificate-relationships-explained.md)**

---

## 📖 Documentation Structure

```
docs/
├── README.md                    # Documentation hub
├── getting-started/             # Tutorials and quick starts
│   ├── QUICK_START.md
│   ├── INTEGRATION_COMPLETE.md
│   └── INTEGRATION_GUIDE.md
├── guides/                      # In-depth guides
│   ├── certificate-relationships-explained.md
│   ├── vault-metadata-approach.md
│   └── ...
├── reference/                   # Quick references
│   ├── certificate-relationships-cheatsheet.md
│   ├── vault-metadata-quick-reference.md
│   └── ...
└── examples/                    # Sample files
    ├── test-certificates.yaml
    └── example-certificate-structure.yaml
```

---

## 🎯 Use Cases

### Simple HTTPS Server
```yaml
certificates:
  - name: WebServer
    type: server
    vaultRef:
      path: kv-v2/prod/certs/servers
      key: WebServer
    relationships:
      - type: signs
        targetKey: LetsEncrypt
```

### Mutual TLS (mTLS)
```yaml
certificates:
  - name: APIServer
    type: server
    relationships:
      - type: signs
        targetKey: CompanyCA
      - type: trusts
        targetKey: CompanyCA

  - name: ServiceClient
    type: client
    relationships:
      - type: signs
        targetKey: CompanyCA
      - type: validates
        targetKey: APIServer
```

**[→ More Examples](docs/examples/)**

---

## 🛠️ Integration

The system is already integrated and ready to use!

1. Open any `certificates.yaml` file
2. Click "Form" button
3. Start managing certificates

**[→ Integration Details](docs/getting-started/INTEGRATION_COMPLETE.md)**

---

## 🆘 Need Help?

- 📖 [Documentation Hub](docs/README.md)
- 🚀 [Quick Start](docs/getting-started/QUICK_START.md)
- 📋 [Cheat Sheet](docs/reference/certificate-relationships-cheatsheet.md)
- 💡 [Examples](docs/examples/)

---

## 📝 License

[Your License Here]

---

**Built with ❤️ for secure certificate management** 🔐✨
