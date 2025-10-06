# Git Commit "Missing Necessary Objects" Fix

## Problem

When creating pull requests, the commit operation was failing with:
```
Failed to create commit: To http://...
! refs/heads/config-hub/... [remote rejected] (missing necessary objects)
remote: fatal: bad object refs/heads/...
error: failed to push some refs
```

## Root Causes

1. **Shallow Clone Issues**: Using `--depth 1` creates a shallow clone that doesn't have all Git objects, causing push failures
2. **Directory Structure**: Cloning directly into temp directory instead of a subdirectory
3. **Failed Attempt Cleanup**: Previous failed pushes left bad branch references on the server
4. **Missing Objects**: Git couldn't find necessary objects to complete the push

## Solutions Implemented

### 1. Removed Shallow Clone
**Before:**
```typescript
await git.clone(repoUrl, tempDir, [
  '--depth', '1',  // Shallow clone - causes issues
  '--branch', branch,
  '--single-branch'
])
```

**After:**
```typescript
const cloneDir = path.join(tempDir, 'repo')
await git.clone(repoUrl, cloneDir, [
  '--branch', branch,
  '--single-branch'  // Still single branch, but full history
])
```

**Why:** Full clone ensures all necessary Git objects are available for push operations.

### 2. Fixed Directory Structure
**Before:** Cloned directly into `tempDir`
**After:** Clone into `tempDir/repo` subdirectory

**Why:** Cleaner separation and avoids potential conflicts with temp directory structure.

### 3. Added Remote Branch Cleanup
```typescript
// Check if remote branch exists and delete it if it does
try {
  const remoteBranches = await repoGit.branch(['-r'])
  const remoteBranchName = `origin/${branch}`
  if (remoteBranches.all.includes(remoteBranchName)) {
    console.log(`Remote branch ${branch} exists, deleting it before push`)
    await repoGit.push('origin', `:${branch}`) // Delete remote branch
  }
} catch (branchCheckError) {
  console.warn('Could not check/delete remote branch:', branchCheckError)
}
```

**Why:** Cleans up any bad branch references from previous failed attempts.

### 4. Added Set Upstream Flag
```typescript
await repoGit.push('origin', branch, ['--set-upstream'])
```

**Why:** Properly establishes the upstream relationship for the new branch.

## Trade-offs

### Performance
- **Before:** Shallow clone was faster (only downloads recent commits)
- **After:** Full clone is slower but more reliable

**Mitigation:** Still using `--single-branch` to only clone the target branch, reducing clone time.

### Disk Space
- **Before:** Minimal disk usage with shallow clone
- **After:** More disk usage with full clone

**Mitigation:** Temporary directory is cleaned up after operation completes.

## Testing

To test the fix:

1. **Create a PR** - Should succeed without "missing necessary objects" error
2. **Create Multiple PRs** - Should handle cleanup of previous branches
3. **Check Server** - Verify no orphaned bad branches remain

## Alternative Solutions Considered

### 1. Force Push
```typescript
await repoGit.push('origin', branch, ['--force'])
```
**Rejected:** Too aggressive and doesn't solve the root cause.

### 2. Fetch Before Push
```typescript
await repoGit.fetch('origin', branch)
await repoGit.push('origin', branch)
```
**Rejected:** Doesn't help with shallow clone issues.

### 3. Use Bitbucket REST API
**Rejected:** Already tried this approach, had issues with file encoding and API limitations.

## Manual Cleanup (If Needed)

If you still have bad branches on the server, you can clean them up manually:

### Via Git CLI:
```bash
# List all branches
git branch -r

# Delete bad remote branch
git push origin :config-hub/customer-01-product-a/2025-10-06T04-21-44
```

### Via Bitbucket UI:
1. Go to Repository → Branches
2. Find the problematic branch
3. Click Delete

### Via Bitbucket REST API:
```bash
curl -X DELETE \
  -u username:token \
  http://bitbucket-server:7990/rest/branch-utils/1.0/projects/PROJECT/repos/REPO/branches
```

## Prevention

The fix now includes automatic cleanup, so this issue should not recur. However, if it does:

1. Check the error message for the specific branch name
2. Manually delete that branch from Bitbucket
3. Try creating the PR again

## Related Issues

- Shallow clones and Git object integrity
- Bitbucket Server branch reference handling
- Temporary directory management in Electron apps
