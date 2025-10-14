# Secrets Form Staging Issue

## What Works
1. ✅ Vault connection and authentication
2. ✅ Push secrets to Vault
3. ✅ Add/edit/delete secrets in form (in-memory)
4. ✅ Review Changes button shows diff dialog
5. ✅ Diff dialog shows changes correctly
6. ✅ Key merging when pushing multiple keys to same Vault path

## What's Broken
❌ **Staging Flow**: When user clicks "Stage Changes" in the diff dialog, the file does NOT appear in the "Staged Changes" panel

## Expected Flow (Based on User's Screenshot)
1. User edits secrets in form
2. Click "Review Changes" → Diff dialog opens
3. Click "Stage Changes" → File should appear in "Staged Changes" panel (bottom left, shows "2 staged")
4. Click "Create PR" → Creates PR with all staged files

## ROOT CAUSE FOUND ✅
The `stageFile()` function IS being called correctly, but:

**Problem**: `repoUrl` is EMPTY STRING (`""`)
**Expected**: `repoUrl` should be `"http://172.27.161.37:7990/scm/test/platform-infrastructure.git"`

The StagedChangesPanel filters staged files by `repoUrl`:
```typescript
const stagedFiles = getStagedForRepo(repoUrl)
```

When the secrets file is staged with `repoUrl: ""`, but the panel is looking for files with `repoUrl: "http://..."`, it finds 0 matches!

## What Needs Investigation
1. What is the correct `repoUrl` format?
2. Where does EditorPanel get called from and does that parent have the repoUrl?
3. How do other files (like Chart.yaml, values.yaml) get staged successfully?
4. What's the exact data structure that `stageFile()` expects?

## Code Changes Made
- Added `repoUrl` prop to EditorPanel (optional, defaults to '')
- SecretsFormEditor calls `stageFile()` with all required fields
- But something is still wrong with the data being passed

## THE FIX
Find where `EditorPanel` component is instantiated (likely in argocd-application-detail.tsx or a parent component) and pass the `repoUrl` prop:

```typescript
<EditorPanel
  openFiles={openFiles}
  activeFileId={activeFileId}
  onCloseFile={handleCloseFile}
  onSaveFile={handleSaveFile}
  onContentChange={handleContentChange}
  onSetActiveFile={setActiveFileId}
  credentialId={credentialId}
  currentBranch={branch}
  repoUrl={application.spec.source.repoURL}  // ← ADD THIS LINE
/>
```

The `repoUrl` should come from the ArgoCD application's spec.source.repoURL field.
