# Certificate Management Documentation

Complete documentation for the certificate management system.

---

## 📁 Documentation Structure

```
docs/
├── getting-started/          # Start here!
│   ├── QUICK_START.md
│   ├── INTEGRATION_COMPLETE.md
│   └── INTEGRATION_GUIDE.md
│
├── guides/                   # In-depth guides
│   ├── certificate-relationships-explained.md
│   ├── vault-metadata-approach.md
│   ├── vault-metadata-persistence.md
│   ├── vault-metadata-updates.md
│   ├── certificate-encoding-formats.md
│   └── certificate-storage-comparison.md
│
├── reference/                # Quick references
│   ├── certificate-relationships-cheatsheet.md
│   ├── vault-metadata-quick-reference.md
│   ├── vault-metadata-visual-guide.md
│   ├── pem-vs-base64-visual.md
│   └── integration-status.md
│
└── examples/                 # Sample files
    ├── test-certificates.yaml
    └── example-certificate-structure.yaml
```

---

## 🚀 Getting Started

### New Users Start Here:
1. **[QUICK_START.md](getting-started/QUICK_START.md)** - Get up and running in 2 minutes
2. **[INTEGRATION_COMPLETE.md](getting-started/INTEGRATION_COMPLETE.md)** - Full integration details
3. **[Certificate Relationships Explained](guides/certificate-relationships-explained.md)** - Understand signs, trusts, validates

### Quick References:
- **[Certificate Relationships Cheatsheet](reference/certificate-relationships-cheatsheet.md)** - One-page reference
- **[Vault Metadata Quick Reference](reference/vault-metadata-quick-reference.md)** - Common operations

---

## 📚 Documentation by Topic

### Certificate Relationships
Understanding how certificates relate to each other:

- **[Complete Guide](guides/certificate-relationships-explained.md)** ⭐ Start here
  - What are signs, trusts, validates?
  - Real-world examples
  - Use case scenarios
  - Best practices

- **[ESO Integration Explained](guides/eso-integration-explained.md)** ⭐ Important
  - What ESO actually uses
  - What's metadata only
  - Why chains are documentation
  - Data flow

- **[Quick Cheatsheet](reference/certificate-relationships-cheatsheet.md)**
  - One-page reference
  - Common patterns
  - Visual diagrams

### Vault Integration
How certificates are stored and managed in Vault:

- **[Vault Metadata Approach](guides/vault-metadata-approach.md)**
  - Architecture and design
  - Why use metadata
  - API operations

- **[Metadata Persistence](guides/vault-metadata-persistence.md)**
  - How metadata survives certificate renewals
  - What persists, what doesn't
  - Timeline examples

- **[Updating Metadata](guides/vault-metadata-updates.md)**
  - Update metadata anytime
  - Safe update patterns
  - Common scenarios

- **[Quick Reference](reference/vault-metadata-quick-reference.md)**
  - Common commands
  - Code snippets

- **[Visual Guide](reference/vault-metadata-visual-guide.md)**
  - Diagrams and visuals
  - Architecture overview

### Certificate Formats
Understanding PEM, Base64, and other formats:

- **[Certificate Encoding Formats](guides/certificate-encoding-formats.md)**
  - PEM vs Base64
  - When to use each
  - Conversion examples

- **[Visual Comparison](reference/pem-vs-base64-visual.md)**
  - Side-by-side comparison
  - Tool compatibility

### Storage Options
Where and how to store certificate data:

- **[Storage Comparison](guides/certificate-storage-comparison.md)**
  - YAML in Git
  - Vault metadata
  - Hybrid approach
  - Recommendations

### Integration
How to integrate the certificate management system:

- **[Integration Guide](getting-started/INTEGRATION_GUIDE.md)**
  - Step-by-step integration
  - Code changes needed

- **[Integration Status](reference/integration-status.md)**
  - What's implemented
  - What's pending

---

## 📖 Examples

### Sample Files
- **[test-certificates.yaml](examples/test-certificates.yaml)** - Complete working example
- **[example-certificate-structure.yaml](examples/example-certificate-structure.yaml)** - Detailed structure

### Common Scenarios
See [Certificate Relationships Explained](guides/certificate-relationships-explained.md) for:
- Simple HTTPS server
- Mutual TLS (mTLS)
- Multi-tier CA hierarchy
- Service-to-service authentication

---

## 🎓 Learning Paths

### Beginner (30 minutes)
1. [QUICK_START.md](getting-started/QUICK_START.md) - 5 min
2. [Certificate Relationships Cheatsheet](reference/certificate-relationships-cheatsheet.md) - 5 min
3. Try [test-certificates.yaml](examples/test-certificates.yaml) - 10 min
4. [INTEGRATION_COMPLETE.md](getting-started/INTEGRATION_COMPLETE.md) - 10 min

### Intermediate (1 hour)
1. [Certificate Relationships Explained](guides/certificate-relationships-explained.md) - 20 min
2. [Vault Metadata Approach](guides/vault-metadata-approach.md) - 20 min
3. [Certificate Encoding Formats](guides/certificate-encoding-formats.md) - 10 min
4. Implement your first setup - 10 min

### Advanced (2 hours)
1. [Vault Metadata Persistence](guides/vault-metadata-persistence.md) - 30 min
2. [Vault Metadata Updates](guides/vault-metadata-updates.md) - 30 min
3. [Storage Comparison](guides/certificate-storage-comparison.md) - 30 min
4. Implement complex hierarchies - 30 min

---

## 🔍 Quick Lookup

### I want to...

**Get started quickly**
→ [QUICK_START.md](getting-started/QUICK_START.md)

**Understand certificate relationships**
→ [Certificate Relationships Explained](guides/certificate-relationships-explained.md)

**See a quick reference for relationships**
→ [Certificate Relationships Cheatsheet](reference/certificate-relationships-cheatsheet.md)

**Learn about Vault integration**
→ [Vault Metadata Approach](guides/vault-metadata-approach.md)

**Understand PEM vs Base64**
→ [Certificate Encoding Formats](guides/certificate-encoding-formats.md)

**See example files**
→ [examples/](examples/)

**Get quick Vault commands**
→ [Vault Metadata Quick Reference](reference/vault-metadata-quick-reference.md)

**Integrate the system**
→ [Integration Guide](getting-started/INTEGRATION_GUIDE.md)

---

## 🆘 Troubleshooting

### Common Issues

**Form button is disabled**
→ Check filename is `certificates.yaml` or `certs.yaml`

**Form view doesn't render**
→ Check browser console for errors

**Can't save changes**
→ Verify Git credentials are configured

**Vault push fails**
→ Check Vault credentials in settings

**Don't understand relationships**
→ Read [Certificate Relationships Explained](guides/certificate-relationships-explained.md)

---

## 📝 Contributing

When adding new documentation:
- **Getting Started** - Tutorials and quick starts
- **Guides** - In-depth explanations and how-tos
- **Reference** - Quick references and cheat sheets
- **Examples** - Sample files and code

---

## 🎉 Ready to Start?

Begin with **[QUICK_START.md](getting-started/QUICK_START.md)** and you'll be managing certificates in minutes!

**Happy certificate managing!** 🔐✨
