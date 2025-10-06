# Testing Guide: PR Approval Feature

## Overview
This guide explains how to test the PR approval feature, including workarounds for the "authors cannot approve their own PRs" restriction.

## The Challenge
Bitbucket Server (and most Git platforms) prevent PR authors from approving their own pull requests. This is a security best practice to ensure code review by someone other than the author.

## Testing Options

### Option 1: Use Two Different User Accounts (Recommended)

1. **Create PR with User A:**
   - Log in to Config Hub with User A's credentials
   - Edit a configuration file
   - Create a pull request

2. **Approve PR with User B:**
   - Add User B's Git credentials to Config Hub (Settings → Git Credentials)
   - Switch to User B's credentials (or use a different browser/incognito window)
   - View the PR created by User A
   - Click "Approve" - this should succeed

3. **Merge PR:**
   - With User B's approval, the PR now has approvals > 0
   - The "Merge" button should become enabled
   - Either user can merge the PR

### Option 2: Use Bitbucket Server API Directly

If you only have one user account, you can test the approval API directly:

```bash
# Approve a PR using curl
curl -X POST \
  -u username:token \
  http://your-bitbucket-server:7990/rest/api/1.0/projects/PROJECT/repos/REPO/pull-requests/PR_ID/approve
```

### Option 3: Create PR from Different Source

1. **Use Git CLI to create a PR as a different user:**
   ```bash
   # Clone the repo
   git clone http://bitbucket-server/project/repo.git
   cd repo
   
   # Configure a different user
   git config user.name "Test User"
   git config user.email "test@example.com"
   
   # Create and push a branch
   git checkout -b test-branch
   echo "test" >> file.txt
   git add file.txt
   git commit -m "Test change"
   git push origin test-branch
   
   # Create PR via Bitbucket UI or API
   ```

2. **Then approve it in Config Hub with your main user**

## Expected Behavior

### When Author Tries to Approve Their Own PR:
- ❌ Error message: "Authors may not update their status"
- ✅ Error is displayed in the PR Detail Dialog
- ✅ Dialog remains open so user can see the error

### When Different User Approves:
- ✅ PR is approved successfully
- ✅ Dialog closes automatically
- ✅ PR list refreshes showing updated approval count
- ✅ "Merge" button becomes enabled (if approval requirements are met)

## Testing Checklist

- [ ] Open a PR detail dialog
- [ ] Verify "Approve" button is visible for open PRs
- [ ] Click "Approve" button
- [ ] Verify loading state ("Approving...")
- [ ] If author: Verify error message is shown
- [ ] If different user: Verify approval succeeds
- [ ] Verify PR list refreshes after approval
- [ ] Verify approval count increases
- [ ] Verify "Merge" button becomes enabled
- [ ] Test approving an already-approved PR
- [ ] Test approving a merged/declined PR (button should not show)

## Diff Preview Testing

The diff preview now shows before creating a PR:

- [ ] Edit a configuration file
- [ ] Click "Save Changes"
- [ ] Verify diff preview dialog opens
- [ ] Verify additions are shown in green
- [ ] Verify deletions are shown in red
- [ ] Verify statistics (additions/deletions/changes) are correct
- [ ] Click "Create Pull Request"
- [ ] Verify PR dialog opens with the changes
- [ ] Complete PR creation
- [ ] Verify PR is created successfully

## Complete Workflow Test

1. **Edit File:**
   - Navigate to Configuration tab
   - Select a Git source
   - Browse to a YAML/JSON file
   - Click "Edit"

2. **Make Changes:**
   - Modify the file content
   - Verify validation works (for YAML/JSON)
   - Click "Save Changes"

3. **Review Diff:**
   - Diff preview dialog opens
   - Review the changes
   - Click "Create Pull Request"

4. **Create PR:**
   - Fill in PR title and description
   - Add reviewers (optional)
   - Click "Create Pull Request"
   - Verify PR is created

5. **Approve PR (with different user):**
   - View the PR in the PR list
   - Click "View Details"
   - Click "Approve"
   - Verify approval succeeds

6. **Merge PR:**
   - Verify "Merge" button is enabled
   - Click "Merge Pull Request"
   - Verify PR is merged successfully

## Troubleshooting

### "Authors may not update their status" Error
- **Cause:** You're trying to approve your own PR
- **Solution:** Use a different user account or have someone else approve it

### "Approve" Button Not Showing
- **Possible causes:**
  - PR is not in "open" state
  - User has already approved
  - PR detail dialog hasn't loaded properly
- **Solution:** Refresh the PR list and try again

### Approval Doesn't Increase Count
- **Possible causes:**
  - Bitbucket Server hasn't updated yet
  - PR list needs refresh
- **Solution:** Click the refresh button in the PR section

## Notes

- The approval feature follows Bitbucket Server's security model
- Authors cannot approve their own PRs (this is correct behavior)
- Multiple approvals from different users are supported
- Approval requirements are configured in Bitbucket Server settings
