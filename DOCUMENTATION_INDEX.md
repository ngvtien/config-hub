# Certificate Management - Documentation Index

## 📚 Organized Documentation Structure

All documentation is now organized in the `docs/` folder:

```
docs/
├── README.md                    ← Start here!
├── getting-started/             ← New users
├── guides/                      ← In-depth guides
├── reference/                   ← Quick references
└── examples/                    ← Sample files
```

---

## 🚀 Quick Navigation

### Start Here
- **[docs/README.md](docs/README.md)** - Main documentation hub
- **[docs/getting-started/QUICK_START.md](docs/getting-started/QUICK_START.md)** - Get started in 2 minutes

### Main README
- **[README-CERTIFICATES.md](README-CERTIFICATES.md)** - System overview

---

## 📁 Documentation Structure

### Getting Started (`docs/getting-started/`)
Perfect for new users and integration:

- **[QUICK_START.md](docs/getting-started/QUICK_START.md)**
  - 2-minute quick start
  - Create your first certificate file
  - Test the UI

- **[INTEGRATION_COMPLETE.md](docs/getting-started/INTEGRATION_COMPLETE.md)**
  - Full integration details
  - What was implemented
  - Testing guide
  - Troubleshooting

- **[INTEGRATION_GUIDE.md](docs/getting-started/INTEGRATION_GUIDE.md)**
  - Step-by-step integration
  - Code changes needed
  - 5-minute setup

---

### Guides (`docs/guides/`)
In-depth explanations and how-tos:

#### Certificate Relationships
- **[certificate-relationships-explained.md](docs/guides/certificate-relationships-explained.md)** ⭐ **ESSENTIAL**
  - Complete guide to signs, trusts, validates
  - Real-world examples and analogies
  - Visual diagrams
  - Use case scenarios
  - Best practices
  - Common patterns

#### Vault Integration
- **[vault-metadata-approach.md](docs/guides/vault-metadata-approach.md)**
  - Architecture and design
  - Why use Vault metadata
  - API operations
  - Benefits and trade-offs

- **[vault-metadata-persistence.md](docs/guides/vault-metadata-persistence.md)**
  - How metadata persists across certificate renewals
  - What survives what operations
  - Timeline examples
  - Scenarios and tests

- **[vault-metadata-updates.md](docs/guides/vault-metadata-updates.md)**
  - Update metadata anytime
  - Safe update patterns
  - Common scenarios
  - Code examples

#### Technical Details
- **[certificate-encoding-formats.md](docs/guides/certificate-encoding-formats.md)**
  - PEM vs Base64 explained
  - When to use each
  - Conversion examples
  - Validation

- **[certificate-storage-comparison.md](docs/guides/certificate-storage-comparison.md)**
  - YAML in Git
  - Vault metadata
  - Hybrid approach
  - Recommendations

---

### Reference (`docs/reference/`)
Quick references and cheat sheets:

- **[certificate-relationships-cheatsheet.md](docs/reference/certificate-relationships-cheatsheet.md)**
  - One-page cheat sheet
  - Visual guide
  - Common patterns
  - Quick examples

- **[vault-metadata-quick-reference.md](docs/reference/vault-metadata-quick-reference.md)**
  - Common commands
  - Code snippets
  - Quick lookup

- **[vault-metadata-visual-guide.md](docs/reference/vault-metadata-visual-guide.md)**
  - Visual diagrams
  - Architecture overview
  - Operation effects

- **[pem-vs-base64-visual.md](docs/reference/pem-vs-base64-visual.md)**
  - Side-by-side comparison
  - Tool compatibility
  - Storage recommendations

- **[integration-status.md](docs/reference/integration-status.md)**
  - What's implemented
  - What's pending
  - Component status

---

### Examples (`docs/examples/`)
Sample files and working examples:

- **[test-certificates.yaml](docs/examples/test-certificates.yaml)**
  - Complete working example
  - All certificate types
  - Relationships
  - Chains

- **[example-certificate-structure.yaml](docs/examples/example-certificate-structure.yaml)**
  - Detailed structure example
  - Comments and explanations
  - Best practices

---

## 🎓 Learning Paths

### Beginner (30 minutes)
1. [docs/README.md](docs/README.md) - 2 min
2. [QUICK_START.md](docs/getting-started/QUICK_START.md) - 5 min
3. [Certificate Relationships Cheatsheet](docs/reference/certificate-relationships-cheatsheet.md) - 5 min
4. Try [test-certificates.yaml](docs/examples/test-certificates.yaml) - 10 min
5. [INTEGRATION_COMPLETE.md](docs/getting-started/INTEGRATION_COMPLETE.md) - 8 min

### Intermediate (1 hour)
1. [Certificate Relationships Explained](docs/guides/certificate-relationships-explained.md) - 20 min
2. [Vault Metadata Approach](docs/guides/vault-metadata-approach.md) - 20 min
3. [Certificate Encoding Formats](docs/guides/certificate-encoding-formats.md) - 10 min
4. Implement your first setup - 10 min

### Advanced (2 hours)
1. [Vault Metadata Persistence](docs/guides/vault-metadata-persistence.md) - 30 min
2. [Vault Metadata Updates](docs/guides/vault-metadata-updates.md) - 30 min
3. [Storage Comparison](docs/guides/certificate-storage-comparison.md) - 30 min
4. Implement complex hierarchies - 30 min

---

## 🔍 Find What You Need

### By Task

**I want to get started quickly**
→ [QUICK_START.md](docs/getting-started/QUICK_START.md)

**I want to understand certificate relationships**
→ [Certificate Relationships Explained](docs/guides/certificate-relationships-explained.md)

**I need a quick reference for relationships**
→ [Certificate Relationships Cheatsheet](docs/reference/certificate-relationships-cheatsheet.md)

**I want to learn about Vault integration**
→ [Vault Metadata Approach](docs/guides/vault-metadata-approach.md)

**I need to understand PEM vs Base64**
→ [Certificate Encoding Formats](docs/guides/certificate-encoding-formats.md)

**I want to see examples**
→ [docs/examples/](docs/examples/)

**I need quick Vault commands**
→ [Vault Metadata Quick Reference](docs/reference/vault-metadata-quick-reference.md)

**I want to integrate the system**
→ [Integration Guide](docs/getting-started/INTEGRATION_GUIDE.md)

---

## 📊 Documentation by Topic

### Certificate Relationships
- Guide: [certificate-relationships-explained.md](docs/guides/certificate-relationships-explained.md) ⭐
- Reference: [certificate-relationships-cheatsheet.md](docs/reference/certificate-relationships-cheatsheet.md)

### Vault Integration
- Guide: [vault-metadata-approach.md](docs/guides/vault-metadata-approach.md)
- Guide: [vault-metadata-persistence.md](docs/guides/vault-metadata-persistence.md)
- Guide: [vault-metadata-updates.md](docs/guides/vault-metadata-updates.md)
- Reference: [vault-metadata-quick-reference.md](docs/reference/vault-metadata-quick-reference.md)
- Reference: [vault-metadata-visual-guide.md](docs/reference/vault-metadata-visual-guide.md)

### Certificate Formats
- Guide: [certificate-encoding-formats.md](docs/guides/certificate-encoding-formats.md)
- Reference: [pem-vs-base64-visual.md](docs/reference/pem-vs-base64-visual.md)

### Integration
- Getting Started: [INTEGRATION_COMPLETE.md](docs/getting-started/INTEGRATION_COMPLETE.md)
- Getting Started: [INTEGRATION_GUIDE.md](docs/getting-started/INTEGRATION_GUIDE.md)
- Reference: [integration-status.md](docs/reference/integration-status.md)

### Storage
- Guide: [certificate-storage-comparison.md](docs/guides/certificate-storage-comparison.md)

---

## 📝 Essential Reading (Top 5)

1. **[docs/README.md](docs/README.md)** - Documentation hub
2. **[QUICK_START.md](docs/getting-started/QUICK_START.md)** - Get started fast
3. **[Certificate Relationships Explained](docs/guides/certificate-relationships-explained.md)** - Understand relationships
4. **[INTEGRATION_COMPLETE.md](docs/getting-started/INTEGRATION_COMPLETE.md)** - Integration details
5. **[README-CERTIFICATES.md](README-CERTIFICATES.md)** - System overview

---

## 🎯 Quick References (Top 3)

1. **[Certificate Relationships Cheatsheet](docs/reference/certificate-relationships-cheatsheet.md)**
2. **[Vault Metadata Quick Reference](docs/reference/vault-metadata-quick-reference.md)**
3. **[test-certificates.yaml](docs/examples/test-certificates.yaml)**

---

## 🗂️ File Organization

### Root Level
- `README-CERTIFICATES.md` - Main system README
- `DOCUMENTATION_INDEX.md` - This file

### docs/ Folder
- `docs/README.md` - Documentation hub
- `docs/getting-started/` - Tutorials and quick starts
- `docs/guides/` - In-depth explanations
- `docs/reference/` - Quick references
- `docs/examples/` - Sample files

### Other
- `scripts/` - Test scripts
- `src/` - Source code

---

## 🎉 Start Here!

**New to the system?**
→ [docs/README.md](docs/README.md)

**Want to get started quickly?**
→ [QUICK_START.md](docs/getting-started/QUICK_START.md)

**Need a complete overview?**
→ [README-CERTIFICATES.md](README-CERTIFICATES.md)

---

**All documentation is organized and easy to navigate!** 📚✨
