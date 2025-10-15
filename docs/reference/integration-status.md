# Certificate Management Integration Status

## Current Status: ✅ Components Built, ❌ Not Wired Up

### What We Have Built

#### 1. ✅ Core Components
- `src/components/secrets/certificate-form-editor.tsx` - Main certificate management UI
- `src/components/secrets/certificate-table.tsx` - Certificate list/table view
- `src/components/secrets/certificate-edit-modal.tsx` - Add/edit certificate dialog
- `src/components/secrets/certificate-chain-builder.tsx` - Build certificate chains
- `src/components/ui/table.tsx` - Table UI component

#### 2. ✅ Type Definitions
- `src/types/certificates.ts` - Complete type system with helper functions
  - Certificate types (server, client, root-ca, intermediate-ca)
  - Relationship types (signs, trusts, validates)
  - Chain definitions
  - PEM/Base64 conversion helpers

#### 3. ✅ Vault Integration Library
- `src/lib/vault-certificate-metadata.ts` - Vault metadata management
  - Save/load certificates with metadata
  - Update metadata safely (merge with existing)
  - Query certificates by relationships
  - Find certificates in chains

#### 4. ✅ Documentation
- `docs/vault-metadata-approach.md` - Architecture guide
- `docs/vault-metadata-persistence.md` - How metadata persists
- `docs/vault-metadata-updates.md` - How to update metadata
- `docs/certificate-storage-comparison.md` - Storage options comparison
- `docs/certificate-encoding-formats.md` - PEM vs Base64 explained
- `example-certificate-structure.yaml` - Example data structure

---

## What Needs to Be Wired Up

### Integration Point: EditorPanel Component

The `EditorPanel` component (`src/components/editor-panel.tsx`) already has a pattern for special file handling:

```typescript
// Current pattern for secrets.yaml
const isSecretsFile = activeFile && activeFile.name.toLowerCase() === 'secrets.yaml'

// Renders SecretsFormEditor for secrets.yaml
{isSecretsFile && viewMode === 'form' && (
  <SecretsFormEditor
    content={activeFile.content}
    onChange={handleContentChange}
    environment={environment}
    filePath={activeFile.path}
    repoUrl={repoUrl}
    branch={currentBranch}
    credentialId={credentialId}
  />
)}
```

### What We Need to Add:

#### Option 1: Separate Certificate File (Recommended)
```typescript
// Add detection for certificates.yaml
const isCertificatesFile = activeFile && 
  (activeFile.name.toLowerCase() === 'certificates.yaml' ||
   activeFile.name.toLowerCase() === 'certs.yaml')

// Render CertificateFormEditor for certificates.yaml
{isCertificatesFile && viewMode === 'form' && (
  <CertificateFormEditor
    content={activeFile.content}
    onChange={handleContentChange}
    environment={environment}
    filePath={activeFile.path}
    repoUrl={repoUrl}
    branch={currentBranch}
    credentialId={credentialId}
  />
)}
```

#### Option 2: Extend Existing secrets.yaml
Modify `SecretsFormEditor` to detect and handle certificate structures within secrets.yaml

---

## Integration Steps

### Step 1: Add Certificate File Detection
```typescript
// In src/components/editor-panel.tsx

// Add after line 136 (where isSecretsFile is defined)
const isCertificatesFile = activeFile && 
  (activeFile.name.toLowerCase() === 'certificates.yaml' ||
   activeFile.name.toLowerCase() === 'certs.yaml')
```

### Step 2: Import CertificateFormEditor
```typescript
// Add to imports at top of editor-panel.tsx
import { CertificateFormEditor } from './secrets/certificate-form-editor'
```

### Step 3: Add Form View Support
```typescript
// Update canHaveSchema logic (around line 138)
const canHaveSchema = isYamlFile && !isTemplateFile && !isSecretsFile && !isCertificatesFile
```

### Step 4: Add Rendering Logic
```typescript
// Add in the render section (around line 692, after SecretsFormEditor)
{isCertificatesFile && viewMode === 'form' && (
  <CertificateFormEditor
    content={activeFile.content}
    onChange={handleContentChange}
    environment={environment}
    filePath={activeFile.path}
    repoUrl={repoUrl}
    branch={currentBranch}
    credentialId={credentialId}
  />
)}
```

### Step 5: Add Form/YAML Toggle Button
```typescript
// Add button to switch between YAML and Form view for certificates
{isCertificatesFile && (
  <Button
    variant={viewMode === 'form' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setViewMode(viewMode === 'form' ? 'yaml' : 'form')}
  >
    <FormInput className="h-4 w-4 mr-2" />
    {viewMode === 'form' ? 'YAML View' : 'Form View'}
  </Button>
)}
```

---

## File Structure

### Current Structure
```
your-repo/
├── environments/
│   ├── dev/
│   │   └── secrets.yaml          ← Existing (generic secrets)
│   ├── staging/
│   │   └── secrets.yaml
│   └── prod/
│       └── secrets.yaml
```

### Proposed Structure (Option 1 - Separate Files)
```
your-repo/
├── environments/
│   ├── dev/
│   │   ├── secrets.yaml          ← Generic secrets
│   │   └── certificates.yaml     ← Certificate management
│   ├── staging/
│   │   ├── secrets.yaml
│   │   └── certificates.yaml
│   └── prod/
│       ├── secrets.yaml
│       └── certificates.yaml
```

### Proposed Structure (Option 2 - Combined)
```
your-repo/
├── environments/
│   ├── dev/
│   │   └── secrets.yaml          ← Contains both secrets and certificates
│   ├── staging/
│   │   └── secrets.yaml
│   └── prod/
│       └── secrets.yaml
```

---

## Example certificates.yaml

```yaml
# environments/dev/certificates.yaml
certificates:
  - name: CaiServerCertificate
    type: server
    vaultRef:
      path: kv-v2/dev/org1/cai/certs/servers
      key: CaiServerCertificate
    data:
      thumbprint: "ABCD1234EFGH5678"
      definition: |
        -----BEGIN CERTIFICATE-----
        MIID...
        -----END CERTIFICATE-----
      password: "server-cert-pass"
    relationships:
      - type: signs
        targetPath: kv-v2/dev/org1/cai/certs/intermediates
        targetKey: intermediateCA

  - name: RootCA1-TrustedRootCertificate
    type: root-ca
    vaultRef:
      path: kv-v2/dev/org1/cai/certs/roots
      key: rootCA1
    data:
      thumbprint: "AABBCCDD11223344"
      definition: |
        -----BEGIN CERTIFICATE-----
        MIID...
        -----END CERTIFICATE-----
      password: ""

chains:
  ProductionServerChain:
    server:
      path: kv-v2/dev/org1/cai/certs/servers
      key: CaiServerCertificate
      type: server
    intermediate:
      - path: kv-v2/dev/org1/cai/certs/intermediates
        key: intermediateCA
        type: intermediate-ca
    rootCA:
      path: kv-v2/dev/org1/cai/certs/roots
      key: rootCA1
      type: root-ca
```

---

## Testing Plan

### 1. Create Test File
```bash
# Create a test certificates.yaml file
mkdir -p environments/dev
cat > environments/dev/certificates.yaml << 'EOF'
certificates: []
chains: {}
EOF
```

### 2. Open in UI
- Navigate to ArgoCD Application
- Go to Configuration tab
- Browse to `environments/dev/certificates.yaml`
- Click to open

### 3. Test Form View
- Click "Form View" button
- Should see CertificateFormEditor
- Add a certificate
- Save changes
- Verify YAML is generated correctly

### 4. Test Vault Integration
- Configure Vault credentials
- Add certificate with data
- Click "Push to Vault"
- Verify certificate appears in Vault

---

## Next Steps

### Immediate (Wire Up)
1. ✅ Add file detection in EditorPanel
2. ✅ Import CertificateFormEditor
3. ✅ Add rendering logic
4. ✅ Test with sample file

### Short Term (Enhance)
1. Add certificate validation
2. Add certificate preview
3. Add bulk operations
4. Add certificate expiration tracking

### Long Term (Advanced)
1. Implement Vault metadata approach
2. Add certificate chain validation
3. Add certificate renewal workflow
4. Add certificate discovery from Vault

---

## Summary

**Status:** 🟡 Components built, integration pending

**What's Done:**
- ✅ All UI components
- ✅ Type system
- ✅ Vault integration library
- ✅ Documentation

**What's Needed:**
- ❌ Wire up to EditorPanel (5 lines of code)
- ❌ Test with real data
- ❌ Deploy to users

**Estimated Time to Wire Up:** 15-30 minutes

**Recommendation:** Use Option 1 (separate certificates.yaml file) for cleaner separation of concerns.
