# Certificate Management - Quick Start

## ✅ Integration Complete!

Everything is wired up and ready to use.

---

## Test It Now (2 minutes)

### Step 1: Create Test File
Copy `test-certificates.yaml` to your repo:
```bash
cp test-certificates.yaml /path/to/your/repo/environments/dev/certificates.yaml
```

Or create an empty one:
```yaml
certificates: []
chains: {}
```

### Step 2: Open in UI
1. Open your application
2. Navigate to ArgoCD Application
3. Click "Configuration" tab
4. Browse to `certificates.yaml`
5. Click to open

### Step 3: Switch to Form View
1. Click the "Form" button in toolbar
2. You should see the Certificate Management UI!

### Step 4: Try It Out
- Click "Add Certificate"
- Fill in the form
- Click "Save Certificate"
- See it appear in the table
- Check the YAML preview on the right

---

## What You Can Do

### Manage Certificates
- Add/Edit/Delete certificates
- 4 types: server, client, root-ca, intermediate-ca
- Define Vault references (path + key)
- Add certificate data (PEM, thumbprint, password)

### Define Relationships
- Link certificates together
- **signs**: "This cert is signed by..." (CA hierarchy)
- **trusts**: "This cert trusts..." (Trust establishment)
- **validates**: "This cert authenticates to..." (mTLS, client auth)
- See `docs/certificate-relationships-explained.md` for details

### Build Chains
- Click "Build Chain"
- Select server, intermediate, root CA
- Save complete certificate chain

### Push to Vault
- Add certificate data
- Click "Push to Vault"
- Certificates stored with metadata

---

## File Format

```yaml
certificates:
  - name: MyServerCert
    type: server
    vaultRef:
      path: kv-v2/dev/certs/servers
      key: MyServerCert
    relationships:
      - type: signs
        targetPath: kv-v2/dev/certs/ca
        targetKey: IntermediateCA

chains:
  MyChain:
    server:
      path: kv-v2/dev/certs/servers
      key: MyServerCert
      type: server
    rootCA:
      path: kv-v2/dev/certs/roots
      key: RootCA
      type: root-ca
```

---

## ESO Integration

This file works with External Secrets Operator (ESO) just like `secrets.yaml`:

1. You define Vault references in `certificates.yaml`
2. ESO reads the file
3. ESO fetches certificates from Vault
4. ESO creates Kubernetes secrets

**Same pattern as secrets.yaml, just for certificates!**

---

## Need Help?

### Documentation
- `INTEGRATION_COMPLETE.md` - Full integration details
- `docs/INTEGRATION_GUIDE.md` - Step-by-step guide
- `docs/vault-metadata-approach.md` - Vault metadata
- `test-certificates.yaml` - Sample data

### Troubleshooting
- Form button disabled? → Check filename is `certificates.yaml`
- Form not rendering? → Check browser console
- Can't save? → Check Git credentials
- Vault push fails? → Check Vault credentials

---

## That's It!

You're ready to manage certificates. Open a `certificates.yaml` file and start using it! 🚀
