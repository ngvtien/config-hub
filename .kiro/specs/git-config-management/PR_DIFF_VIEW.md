# PR Diff View Feature

## Overview
Added the ability to view file changes (diff) directly in the Pull Request Detail Dialog.

## Implementation

### 1. Backend (Electron)

#### Bitbucket Server Client (`electron/git-providers/bitbucket-server-client.ts`)
- Added `getPullRequestDiff(prId)` method
- Uses Bitbucket REST API endpoint: `/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/diff`
- Parses unified diff format into file-based diffs
- Returns array of `{ path: string, diff: string }` objects

#### Git Provider Interface (`electron/git-providers/git-provider.interface.ts`)
- Added `getPullRequestDiff` to the interface

#### IPC Handler (`electron/git-handler.ts`)
- Added `git:getPullRequestDiff` IPC handler

#### Preload Script (`electron/preload.ts`)
- Exposed `getPullRequestDiff` via `window.electronAPI.git`

### 2. Frontend (React)

#### PR Detail Dialog (`src/components/pr-detail-dialog.tsx`)
- Added "Files Changed" section showing:
  - Number of files changed
  - List of changed files
  - Toggle button to show/hide diff
  - Full unified diff for each file
- Automatically fetches diff when dialog opens
- Shows loading state while fetching
- Error handling for failed diff fetches

#### Type Definitions (`src/vite-env.d.ts`)
- Added `getPullRequestDiff` to the `Window.electronAPI.git` interface

## Features

### Files Changed Section
- **File Count Badge**: Shows number of files changed
- **File List**: Displays all changed files with file icons
- **Show/Hide Toggle**: Button to expand/collapse diff view
- **Unified Diff Display**: Shows full diff in monospace font with proper formatting

### States
- **Loading**: Shows "Loading changes..." message
- **Error**: Displays error alert if diff fetch fails
- **Empty**: Shows "No file changes found" if PR has no changes
- **Success**: Displays file list and diff viewer

## API Endpoints Used

### Bitbucket Server
- **Get PR Diff**: `GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{prId}/diff`
  - Query params:
    - `contextLines`: Number of context lines (default: 3)
    - `whitespace`: Whitespace handling (default: 'ignore-all')
  - Returns: Unified diff format

## Diff Format

The diff is displayed in standard unified diff format:
```diff
diff --git a/path/to/file.yaml b/path/to/file.yaml
index abc123..def456 100644
--- a/path/to/file.yaml
+++ b/path/to/file.yaml
@@ -10,7 +10,7 @@
 context line
-removed line
+added line
 context line
```

## Usage

1. Open a pull request from the PR Status section
2. Click "View Details"
3. Scroll to "Files Changed" section
4. See list of changed files
5. Click "Show Diff" to view the actual changes
6. Click "Hide Diff" to collapse

## Future Enhancements

1. **Syntax Highlighting**: Add syntax highlighting to diff view
2. **Side-by-Side Diff**: Option for split view instead of unified
3. **File Filtering**: Filter files by type or path
4. **Inline Comments**: Add ability to comment on specific lines
5. **Expand/Collapse Files**: Individual file expand/collapse
6. **Stats**: Show additions/deletions count per file
7. **Download Diff**: Export diff as patch file

## Benefits

- **Better Code Review**: See exactly what changed without leaving the app
- **Quick Overview**: Understand PR scope at a glance
- **No External Tools**: No need to open Bitbucket web UI
- **Integrated Workflow**: Review → Approve → Merge all in one place

## Testing

To test the diff view:

1. Create a PR with file changes
2. Open the PR detail dialog
3. Verify "Files Changed" section appears
4. Check file count badge is correct
5. Click "Show Diff" button
6. Verify diff is displayed correctly
7. Test with PRs containing:
   - Single file change
   - Multiple file changes
   - Large diffs
   - Binary files (should handle gracefully)

## Known Limitations

1. **Binary Files**: Binary file diffs may not display properly
2. **Large Diffs**: Very large diffs might be slow to render
3. **No Syntax Highlighting**: Currently plain text only
4. **No Line Numbers**: Diff shows relative line numbers only

## Performance Considerations

- Diff is fetched only when dialog opens (not on PR list load)
- Diff is collapsed by default to improve initial render time
- Large diffs are displayed as-is (no pagination yet)
