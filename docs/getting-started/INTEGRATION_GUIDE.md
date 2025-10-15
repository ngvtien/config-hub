# Certificate Management - Integration Guide

## Quick Start: Wire It Up in 5 Minutes

### What You Have
✅ All components built and ready
✅ Type system complete
✅ Vault integration library ready
✅ Documentation complete

### What You Need
❌ Connect components to the editor (5 code changes)

---

## Integration Steps

### Step 1: Import the Component

**File:** `src/components/editor-panel.tsx`

**Add this import** (around line 26, after SecretsFormEditor):
```typescript
import { CertificateFormEditor } from './secrets/certificate-form-editor'
```

---

### Step 2: Add File Detection

**File:** `src/components/editor-panel.tsx`

**Add this code** (around line 136, after `isSecretsFile`):
```typescript
const isCertificatesFile = activeFile && 
  (activeFile.name.toLowerCase() === 'certificates.yaml' ||
   activeFile.name.toLowerCase() === 'certs.yaml')
```

---

### Step 3: Update Schema Logic

**File:** `src/components/editor-panel.tsx`

**Find this line** (around line 138):
```typescript
const canHaveSchema = isYamlFile && !isTemplateFile && !isSecretsFile
```

**Change to:**
```typescript
const canHaveSchema = isYamlFile && !isTemplateFile && !isSecretsFile && !isCertificatesFile
```

---

### Step 4: Add Form View Toggle

**File:** `src/components/editor-panel.tsx`

**Find the button section** (around line 304-320 where form mode switching happens)

**Add this code** (after the secrets file form mode check):
```typescript
// Allow form view for certificates.yaml
if (isCertificatesFile) {
  setViewMode(newMode)
  return
}
```

---

### Step 5: Add Rendering Logic

**File:** `src/components/editor-panel.tsx`

**Find the SecretsFormEditor rendering** (around line 692)

**Add this code right after the SecretsFormEditor block:**
```typescript
{/* Certificate Form Editor */}
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

---

## Complete Code Changes

Here's a diff-style view of all changes:

```diff
// src/components/editor-panel.tsx

// 1. Add import
import { SecretsFormEditor } from './secrets/secrets-form-editor'
+import { CertificateFormEditor } from './secrets/certificate-form-editor'
import { ImprovedFormEditor } from './improved-form-editor'

// 2. Add file detection
const isSecretsFile = activeFile && activeFile.name.toLowerCase() === 'secrets.yaml'
+const isCertificatesFile = activeFile && 
+  (activeFile.name.toLowerCase() === 'certificates.yaml' ||
+   activeFile.name.toLowerCase() === 'certs.yaml')

// 3. Update schema logic
-const canHaveSchema = isYamlFile && !isTemplateFile && !isSecretsFile
+const canHaveSchema = isYamlFile && !isTemplateFile && !isSecretsFile && !isCertificatesFile

// 4. Add form view toggle (in handleViewModeChange function)
if (isSecretsFile) {
  setViewMode(newMode)
  return
}
+if (isCertificatesFile) {
+  setViewMode(newMode)
+  return
+}

// 5. Add rendering (after SecretsFormEditor)
{isSecretsFile && viewMode === 'form' && (
  <SecretsFormEditor ... />
)}
+{isCertificatesFile && viewMode === 'form' && (
+  <CertificateFormEditor
+    content={activeFile.content}
+    onChange={handleContentChange}
+    environment={environment}
+    filePath={activeFile.path}
+    repoUrl={repoUrl}
+    branch={currentBranch}
+    credentialId={credentialId}
+  />
+)}
```

---

## Testing

### 1. Create Test File

Create `environments/dev/certificates.yaml`:
```yaml
certificates: []
chains: {}
```

### 2. Open in UI
1. Navigate to your ArgoCD Application
2. Click "Configuration" tab
3. Browse to `environments/dev/certificates.yaml`
4. Click to open the file

### 3. Test Form View
1. Click the "Form View" button (should appear in toolbar)
2. You should see the Certificate Management UI
3. Click "Add Certificate"
4. Fill in certificate details
5. Click "Save Certificate"
6. Switch back to "YAML View" to see generated YAML

### 4. Test Features
- ✅ Add certificate
- ✅ Edit certificate
- ✅ Delete certificate
- ✅ Add relationships
- ✅ Build certificate chain
- ✅ Search/filter certificates
- ✅ Push to Vault (if configured)

---

## File Structure

### Option 1: Separate Certificate File (Recommended)
```
your-repo/
├── environments/
│   ├── dev/
│   │   ├── secrets.yaml          ← Generic secrets
│   │   └── certificates.yaml     ← NEW: Certificate management
│   ├── staging/
│   │   ├── secrets.yaml
│   │   └── certificates.yaml
│   └── prod/
│       ├── secrets.yaml
│       └── certificates.yaml
```

### Option 2: Combined File
Keep everything in `secrets.yaml` - the component will auto-detect certificate structures

---

## Troubleshooting

### Issue: Form View button doesn't appear
**Solution:** Make sure file is named `certificates.yaml` or `certs.yaml`

### Issue: Component doesn't render
**Solution:** Check browser console for import errors

### Issue: Can't save changes
**Solution:** Verify Git credentials are configured

### Issue: Vault push fails
**Solution:** Check Vault credentials in settings

---

## What's Next?

After integration, you can:

1. **Add certificates** via the form UI
2. **Define relationships** between certificates
3. **Build certificate chains** for deployment
4. **Push to Vault** with metadata
5. **Query certificates** by relationships
6. **Track certificate lifecycle**

---

## Advanced: Vault Metadata Integration

Once basic integration is working, you can enable Vault metadata:

1. Configure Vault credentials
2. Certificates will be stored with metadata
3. Relationships persist in Vault custom metadata
4. Query certificates by relationships
5. Metadata survives certificate renewals

See `docs/vault-metadata-approach.md` for details.

---

## Summary

**Time to integrate:** 5-10 minutes
**Lines of code:** ~20 lines
**Files to modify:** 1 file (`editor-panel.tsx`)
**Testing time:** 5 minutes

**You're ready to go!** 🚀
