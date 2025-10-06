# PR Approval Feature

## Overview
Added the ability to approve pull requests directly from the Config Hub UI.

## Implementation

### 1. Backend (Electron)

#### Git Provider Interface (`electron/git-providers/git-provider.interface.ts`)
- Added `approvePullRequest(prId: number): Promise<PullRequest>` method to the interface

#### Bitbucket Server Client (`electron/git-providers/bitbucket-server-client.ts`)
- Implemented `approvePullRequest()` method
- Uses Bitbucket Server REST API endpoint: `/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/approve`
- Returns the updated PR after approval

#### IPC Handler (`electron/git-handler.ts`)
- Added `git:approvePullRequest` IPC handler
- Validates credentials and delegates to the Git provider client

#### Preload Script (`electron/preload.ts`)
- Exposed `approvePullRequest` method via `window.electronAPI.git`

### 2. Frontend (React)

#### Type Definitions (`src/vite-env.d.ts`)
- Added `approvePullRequest` to the `Window.electronAPI.git` interface

#### PR Detail Dialog (`src/components/pr-detail-dialog.tsx`)
- Added "Approve" button in the footer
- Button only shows if the current user hasn't already approved
- Handles approval with loading state and error handling
- Closes dialog and refreshes PR list on successful approval

## Usage

1. Open a pull request from the PR Status section
2. Click "View Details" to open the PR Detail Dialog
3. Click the "Approve" button
4. The PR will be approved and the dialog will close
5. The PR list will refresh to show the updated approval count

## API Endpoints Used

### Bitbucket Server
- **Approve PR**: `POST /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/approve`
  - No request body required
  - Returns the updated PR object with approval information

## Future Enhancements

1. **Unapprove functionality**: Add ability to remove approval
2. **Current user detection**: Properly detect which reviewers are the current user
3. **Approval requirements**: Show if PR meets approval requirements for merging
4. **Reviewer suggestions**: Suggest reviewers based on file changes
5. **Approval comments**: Allow adding comments when approving

## Testing

To test the approval feature:

1. Create a PR using the Config Files section
2. Open the PR detail dialog
3. Click "Approve"
4. Verify the approval count increases
5. Verify the "Approve" button disappears after approval
6. Verify the "Merge" button becomes enabled (if approval requirements are met)
