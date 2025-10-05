# Implementation Plan: Git Configuration Management

This implementation plan breaks down the Git Configuration Management feature into discrete, manageable coding tasks. Each task builds incrementally on previous tasks, following test-driven development principles where appropriate.

## Phase 1: Foundation and Core Infrastructure

**Note:** Much of the Git credential infrastructure already exists! We can reuse:
- ✅ `electron/secure-credential-manager.ts` - Already handles Git credentials
- ✅ `electron/git-handler.ts` - Already has credential storage, testing, listing
- ✅ Git credential types (GitCredential interface)
- ✅ IPC handlers for credential management

**What's New:** Bitbucket API client for file operations and PR management

- [x] 1. Set up additional Git types for file operations and PRs





  - Create `src/types/git.ts` with file operation types (GitFile, GitFileContent, etc.)
  - Create `src/types/bitbucket.ts` with Bitbucket-specific API types
  - Define GitProvider interface for provider abstraction
  - **Reuse existing:** GitCredential type from secure-credential-manager.ts
  - _Requirements: 5.1, 5.2, 7.1_

- [x] 2. Implement Bitbucket Server Client (Main Process)





  - [x] 2.1 Create `electron/git-providers/git-provider.interface.ts` with GitProvider interface


    - Define all methods (listFiles, getFileContent, createBranch, etc.)
    - _Requirements: 5.1, 7.1_

  - [x] 2.2 Create `electron/git-providers/bitbucket-server-client.ts`


    - Implement constructor with URL parsing (project key, repo slug extraction)
    - Set up axios instance with authentication headers
    - **Reuse existing:** GitCredential type for authentication
    - **Reuse existing:** Provider detection logic from `simple-git-handler.ts` `detectProviderType()` method
    - _Requirements: 5.1, 5.10_

  - [x] 2.3 Implement repository file operations


    - Implement `listFiles()` method with Bitbucket Server API `/browse` endpoint
    - Implement `getFileContent()` method with `/raw` endpoint
    - Handle pagination for large directories
    - **CRITICAL:** Use ONLY Bitbucket REST API - NO local Git commands
    - **CRITICAL:** All operations in-memory - NO file system writes
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.4 Implement branch operations


    - Implement `getBranches()` method with API
    - Implement `createBranch()` method with API
    - Handle branch name conflicts
    - **CRITICAL:** Use ONLY Bitbucket REST API - NO `git branch` commands
    - _Requirements: 3.1, 3.10_

  - [x] 2.5 Implement commit operations


    - Implement `createCommit()` method with API
    - Format commit request with user attribution
    - Handle multiple file changes in single commit
    - **CRITICAL:** Use ONLY Bitbucket REST API - NO `git commit` commands
    - **CRITICAL:** All changes in-memory - NO local working directory
    - _Requirements: 3.2, 3.6_

  - [x] 2.6 Implement Pull Request operations


    - Implement `createPullRequest()` method
    - Implement `getPullRequest()` method
    - Implement `mergePullRequest()` method
    - Handle PR creation errors
    - _Requirements: 3.3, 3.4, 3.5, 4.2, 4.3_

  - [ ]* 2.7 Write unit tests for Bitbucket Server Client
    - Test URL parsing and initialization
    - Test all API methods with mocked responses
    - Test error handling scenarios
    - _Requirements: All from 2.1-2.6_

- [x] 3. Extend existing Git IPC Handlers (Main Process)







  - **Reuse existing:** `electron/git-handler.ts` already has:
    - ✅ `git:store-credential` handler
    - ✅ `git:test-credential` handler
    - ✅ `git:list-credentials` handler
    - ✅ `git:get-credential` handler
    - ✅ `git:delete-credential` handler
    - ✅ `git:find-credentials-by-repo` handler

  - [x] 3.1 Add file operation handlers to `electron/git-handler.ts`


    - Implement `git:listFiles` handler
    - Implement `git:getFileContent` handler
    - **Reuse existing:** `detectProviderType()` method to determine which client to instantiate
    - Instantiate appropriate client (BitbucketServerClient or BitbucketCloudClient) based on detection
    - Add error handling and logging
    - _Requirements: 1.2, 1.4, 1.6, 7.1_

  - [x] 3.2 Add branch and commit handlers


    - Implement `git:createBranch` handler
    - Implement `git:commitChanges` handler
    - _Requirements: 3.1, 3.2_


  - [x] 3.3 Add Pull Request handlers

    - Implement `git:createPullRequest` handler
    - Implement `git:getPullRequest` handler
    - Implement `git:mergePullRequest` handler
    - _Requirements: 3.3, 4.2, 4.3_


  - [x] 3.4 Add webhook notification handler

    - Implement `git:sendWebhookNotification` handler
    - Support MS Teams and Slack webhook formats
    - Handle notification failures gracefully
    - _Requirements: 3.7, 3.8, 3.9_

  - [x] 3.5 Verify Git handlers are registered in main process





    - Check `electron/main.ts` calls `setupGitHandlers()`
    - **Reuse existing:** Handler registration pattern already in place
    - _Requirements: 5.1_

- [x] 4. Update Preload Script



  - [x] 4.1 Add new Git file operation APIs to preload script


    - Update `electron/preload.ts` with new git IPC methods
    - Add: listFiles, getFileContent, createBranch, commitChanges, createPullRequest, etc.
    - **Reuse existing:** Credential management APIs already exposed
    - Update TypeScript declarations for window.electronAPI
    - _Requirements: 5.1_

## Phase 2: Renderer Services and State Management

**Note:** Follow existing patterns from ArgoCD integration!
- **Reuse pattern:** `src/services/argocd-service.ts` - Same IPC communication pattern
- **Reuse pattern:** `src/hooks/use-argocd-credentials.ts` - Same credential management pattern
- **Reuse pattern:** `src/hooks/use-argocd.ts` - Same data fetching pattern

- [x] 5. Implement Git Service (Renderer Process)








  - [x] 5.1 Create `src/services/git-service.ts` following ArgoCD service pattern


    - **Copy pattern from:** `argocd-service.ts`
    - Implement `isElectron` check (same as ArgoCD)
    - Implement `ensureCredentials()` method (same pattern as ArgoCD)
    - Use `window.electronAPI.git.*` instead of `window.electronAPI.argocd.*`
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 5.2 Implement file operations in Git Service


    - Implement `listFiles()` method with IPC calls
    - Implement `getFileContent()` method
    - Implement `getFileSchema()` method (fetch .schema.json)
    - Add caching for file content (5 minute TTL)
    - **Follow pattern:** Same error handling as ArgoCD service
    - _Requirements: 1.2, 1.4, 2.4_

  - [x] 5.3 Implement branch and commit operations


    - Implement `createBranch()` method
    - Implement `commitChanges()` method
    - _Requirements: 3.1, 3.2_

  - [x] 5.4 Implement Pull Request operations


    - Implement `createPullRequest()` method
    - Implement `getPullRequest()` method
    - Implement `mergePullRequest()` method
    - _Requirements: 3.3, 4.2, 4.3_

  - [x] 5.5 Implement webhook notifications


    - Implement `sendWebhookNotification()` method
    - _Requirements: 3.7, 3.8_

  - [x] 5.6 Add path restriction validation


    - Implement method to validate file paths against app configuration
    - Reject access to files outside allowed paths
    - _Requirements: 8.3, 8.4, 8.5, 8.6_

  - [ ]* 5.7 Write unit tests for Git Service
    - Test credential management
    - Test all operations with mocked IPC
    - Test path restriction validation
    - Test error handling
    - _Requirements: All from 5.1-5.6_

  - [x] 5.8 Create singleton instance and export

    - Export `gitService` singleton (same as `argoCDService`)
    - _Requirements: 5.1_

- [x] 6. Create custom React hooks for Git operations







  - [x] 6.1 Create `src/hooks/use-git-credentials.ts`




    - **Copy pattern from:** `use-argocd-credentials.ts`
    - Hook to manage Git credential state
    - Check if credentials exist for a repository
    - Trigger authentication dialog
    - _Requirements: 5.2, 5.7_

  - [x] 6.2 Create `src/hooks/use-git-files.ts`








    - **Follow pattern from:** `use-argocd.ts`
    - Hook to fetch and manage file list
    - Handle loading and error states
    - Implement refresh functionality
    - _Requirements: 1.1, 1.2, 1.6_

  - [x] 6.3 Create `src/hooks/use-file-editor.ts`




    - Hook to manage file editing state
    - Handle YAML/form view toggle
    - Manage validation errors
    - _Requirements: 2.1, 2.3, 2.4, 2.6, 2.7, 2.8_

## Phase 3: UI Components - Authentication and File Viewing

**Note:** Reuse existing UI components and patterns!
- **Reuse components:** shadcn/ui Dialog, Card, Button, Input, etc.
- **Reuse pattern:** Existing modal dialogs in Config Hub
- **Reuse styling:** Existing Tailwind classes and theme

- [-] 7. Create Git Authentication Dialog



  - [x] 7.1 Create `src/components/git-auth-dialog.tsx`











    - **Reuse components:** Dialog, Tabs, Input, Button from shadcn/ui
    - **Follow pattern:** Similar to existing credential dialogs
    - Create dialog component with tabs (Token/OAuth)
    - Implement form fields for username and token
    - Add validation for required fields
    - _Requirements: 5.2, 5.7_


  - [x] 7.2 Implement authentication logic








    - Call gitService.ensureCredentials() on submit
    - Handle authentication errors
    - Show success message and close dialog
    - **Follow pattern:** Same error handling as ArgoCD credential dialogs
    - _Requirements: 5.3, 5.8_


  - [x] 7.3 Add help links and documentation







    - Link to token creation guide
    - Link to security best practices
    - **Reuse component:** HelpCircle icon from lucide-react
    - _Requirements: 5.2_

  - [ ]* 7.4 Write component tests for Git Auth Dialog
    - Test form validation
    - Test authentication flow
    - Test error handling
    - _Requirements: 7.1, 7.2_


- [ ] 8. Create Configuration Files Section Component
  - [x] 8.1 Create `src/components/config-files-section.tsx`








    - **Reuse components:** Card, CardHeader, CardTitle, CardContent from shadcn/ui
    - **Follow pattern:** Similar to existing sections in application detail page
    - Extract Git source info from ArgoCD application using `getApplicationSource()` helper
    - Implement loading state
    - Implement error state with retry
    - _Requirements: 1.1, 1.2, 1.6_

  - [x] 8.2 Implement authentication check and prompt











    - Check if Git credentials exist using useGitCredentials hook
    - Show authentication prompt if no credentials
    - Show file list if credentials exist
    - **Reuse pattern:** Similar to how ArgoCD credentials are checked
    - _Requirements: 1.7, 2.10_


  - [x] 8.3 Implement file list display







    - **Reuse components:** Table or custom list with shadcn/ui styling
    - Display files with metadata (name, size, last modified, author)
    - Filter to show only YAML and JSON files
    - Show file path relative to app path
    - Add refresh button
    - **Reuse icons:** FileText, RefreshCw from lucide-react
    - _Requirements: 1.4, 1.5_


  - [x] 8.4 Add edit buttons with permission checks





    - **Reuse component:** Button from shadcn/ui
    - Show edit button for each file
    - Disable edit button if no credentials
    - Handle edit button click to open editor
    - **Reuse icon:** Edit from lucide-react
    - _Requirements: 2.1, 2.10_

  - [x] 8.5 Implement path restriction enforcement









    - Only show files within app's configured path
    - Display message if attempting to access restricted files
    - **Reuse component:** Alert from shadcn/ui for warnings
    - _Requirements: 8.3, 8.4_

  - [ ]* 8.6 Write component tests for Config Files Section
    - Test authentication prompt display
    - Test file list rendering
    - Test edit button behavior
    - Test path restrictions
    - _Requirements: All from 8.1-8.5_

- [ ] 9. Integrate Configuration Files Section into Application Detail Page

  - [x] 9.1 Update `src/components/argocd-application-detail.tsx`

















    - Import ConfigFilesSection component
    - Add ConfigFilesSection below existing Git Source section
    - Pass application and environment props
    - **Minimal change:** Just add one component, no restructuring
    - _Requirements: 1.1_

  - [ ] 9.2 Update environment settings type
    - Add git configuration to EnvironmentSettings interface in `src/hooks/use-environment-settings.ts`
    - Include enabled, serverUrl, credentialId, webhooks
    - **Follow pattern:** Same structure as argocd settings
    - _Requirements: 5.1_

## Phase 4: File Editing - YAML Editor

- [ ] 10. Create File Editor Dialog - YAML View
  - [ ] 10.1 Create `src/components/file-editor-dialog.tsx` base structure
    - Create dialog component with header and footer
    - Display file path and branch information
    - Add cancel and save buttons
    - _Requirements: 2.2_

  - [ ] 10.2 Integrate Monaco Editor or CodeMirror for YAML editing
    - Install and configure editor library
    - Set up YAML syntax highlighting
    - Configure editor theme to match Config Hub
    - _Requirements: 2.3_

  - [ ] 10.3 Implement real-time YAML validation
    - Parse YAML on change with debouncing (300ms)
    - Display syntax errors inline
    - Show validation status indicator
    - _Requirements: 2.7_

  - [ ] 10.4 Implement save functionality
    - Validate YAML before allowing save
    - Call onSave callback with edited content
    - Handle save errors
    - _Requirements: 2.9_

  - [ ]* 10.5 Write component tests for YAML editor
    - Test editor rendering
    - Test validation
    - Test save functionality
    - _Requirements: All from 10.1-10.4_

## Phase 5: File Editing - Form-Based Editor

- [ ] 11. Create Form-Based Editor
  - [ ] 11.1 Add schema detection and view toggle
    - Check if .schema.json exists for the file
    - Show/hide form view toggle based on schema existence
    - Implement view switching (YAML ↔ Form)
    - _Requirements: 2.4, 2.6_

  - [ ] 11.2 Integrate react-jsonschema-form or similar library
    - Install and configure form generation library
    - Create custom theme matching Config Hub design
    - _Requirements: 2.5_

  - [ ] 11.3 Implement form generation from JSON schema
    - Parse JSON schema
    - Generate form fields with appropriate types
    - Add field descriptions and validation rules
    - _Requirements: 2.5_

  - [ ] 11.4 Implement YAML ↔ Form synchronization
    - Convert YAML to form data when switching to form view
    - Convert form data to YAML when switching to YAML view
    - Preserve changes during view switching
    - _Requirements: 2.6_

  - [ ] 11.5 Implement schema validation
    - Validate form data against JSON schema
    - Display validation errors on form fields
    - Prevent save if validation fails
    - _Requirements: 2.8_

  - [ ]* 11.6 Write component tests for form editor
    - Test schema detection
    - Test form generation
    - Test view synchronization
    - Test schema validation
    - _Requirements: All from 11.1-11.5_

## Phase 6: Diff Preview and Pull Request Creation

- [ ] 12. Create Diff Preview Component
  - [ ] 12.1 Create `src/components/diff-preview-dialog.tsx`
    - Create dialog with side-by-side diff view
    - Integrate react-diff-viewer or similar library
    - _Requirements: 2.9_

  - [ ] 12.2 Implement diff generation
    - Compare original and edited content
    - Highlight additions, deletions, and modifications
    - Show line numbers
    - _Requirements: 2.9_

  - [ ] 12.3 Add change summary
    - Count additions and deletions
    - List affected sections
    - _Requirements: 2.9_

  - [ ] 12.4 Add navigation to PR creation
    - Add "Create Pull Request" button
    - Pass changes to PR dialog
    - _Requirements: 2.9, 3.1_

  - [ ]* 12.5 Write component tests for diff preview
    - Test diff rendering
    - Test change summary
    - Test navigation
    - _Requirements: All from 12.1-12.4_

- [ ] 13. Create Pull Request Dialog
  - [ ] 13.1 Create `src/components/pull-request-dialog.tsx`
    - Create dialog with PR metadata form
    - Add fields for title, description, target branch
    - Display changes summary
    - _Requirements: 3.3, 3.4_

  - [ ] 13.2 Implement branch name generation
    - Generate descriptive branch name (e.g., config-hub/app-name-timestamp)
    - Allow user to customize branch name
    - Validate branch name format
    - _Requirements: 3.1_

  - [ ] 13.3 Implement commit message generation
    - Generate meaningful commit message from changes
    - Allow user to edit commit message
    - Include affected applications
    - _Requirements: 3.2, 3.4_

  - [ ] 13.4 Add reviewer selection (optional)
    - Fetch available reviewers from Git server
    - Allow multi-select for reviewers
    - _Requirements: 4.1_

  - [ ] 13.5 Add webhook notification configuration
    - Show configured webhook channels
    - Allow user to select which channels to notify
    - _Requirements: 3.7, 3.8_

  - [ ] 13.6 Implement PR creation flow
    - Create branch using gitService
    - Commit changes with user attribution
    - Create Pull Request
    - Send webhook notifications
    - Handle errors at each step
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.10, 3.11_

  - [ ]* 13.7 Write component tests for PR dialog
    - Test form validation
    - Test branch name generation
    - Test PR creation flow
    - Test error handling
    - _Requirements: All from 13.1-13.6_

- [ ] 14. Create PR Success Dialog
  - [ ] 14.1 Create `src/components/pr-success-dialog.tsx`
    - Display success message with PR details
    - Show PR number, title, author, reviewers
    - Provide link to view PR in Bitbucket
    - _Requirements: 3.5, 3.6_

  - [ ] 14.2 Display notification status
    - Show which channels were notified
    - Display any notification failures
    - _Requirements: 3.8, 3.9_

  - [ ] 14.3 Add next steps guidance
    - Explain review and merge process
    - Mention auto-sync after merge
    - _Requirements: 4.4_

  - [ ]* 14.4 Write component tests for PR success dialog
    - Test rendering with PR data
    - Test link functionality
    - _Requirements: All from 14.1-14.3_

## Phase 7: Pull Request Review and Merge

- [ ] 15. Implement PR Status Display
  - [ ] 15.1 Add PR status section to application detail page
    - Fetch open PRs for the application's repository and path
    - Display PR list with status, reviewers, approvals
    - _Requirements: 4.2_

  - [ ] 15.2 Implement PR detail view
    - Show PR description and changes
    - Display reviewer status and approvals
    - Show merge conflicts if any
    - _Requirements: 4.2, 4.5_

  - [ ] 15.3 Add merge button for approved PRs
    - Enable merge button when PR has required approvals
    - Check user permissions before allowing merge
    - _Requirements: 4.3_

  - [ ] 15.4 Implement merge functionality
    - Call gitService.mergePullRequest()
    - Handle merge conflicts
    - Display merge result
    - _Requirements: 4.3, 4.5_

  - [ ]* 15.5 Write component tests for PR status display
    - Test PR list rendering
    - Test merge button behavior
    - Test merge functionality
    - _Requirements: All from 15.1-15.4_

## Phase 8: ArgoCD Sync Integration

- [ ] 16. Implement Auto-Sync on PR Merge
  - [ ] 16.1 Create webhook listener or polling mechanism
    - Implement webhook endpoint to receive merge events
    - OR implement polling to check for merged PRs
    - _Requirements: 9.1_

  - [ ] 16.2 Implement application matching logic
    - Match repository URL and path to ArgoCD applications
    - Identify all affected applications
    - _Requirements: 9.2_

  - [ ] 16.3 Trigger ArgoCD sync
    - Use existing argoCDService.syncApplication() method
    - Sync all affected applications
    - _Requirements: 9.3_

  - [ ] 16.4 Update UI with sync status
    - Refresh application detail page
    - Show updated commit SHA in Git source section
    - Display sync progress
    - _Requirements: 9.4, 9.5_

  - [ ] 16.5 Handle sync failures
    - Display error details using existing error patterns
    - Provide retry option
    - _Requirements: 9.6_

  - [ ]* 16.6 Write integration tests for auto-sync
    - Test webhook/polling mechanism
    - Test application matching
    - Test sync triggering
    - _Requirements: All from 16.1-16.5_

## Phase 9: Documentation and Help System

- [ ] 17. Create User Documentation
  - [ ] 17.1 Write main feature documentation
    - Create `docs/git/GIT_CONFIG_MANAGEMENT.md`
    - Include overview, prerequisites, workflows, troubleshooting
    - _Requirements: All_

  - [ ] 17.2 Write quick start guide
    - Create `docs/git/QUICK_START_GIT_CONFIG.md`
    - Include 5-minute setup and common tasks
    - _Requirements: All_

  - [ ] 17.3 Write API reference for developers
    - Create `docs/git/API_REFERENCE.md`
    - Document GitService methods with examples
    - _Requirements: All_

  - [ ] 17.4 Write troubleshooting guide
    - Create `docs/git/TROUBLESHOOTING_GIT.md`
    - Cover common issues and solutions
    - _Requirements: 5.7, 5.8, 5.9_

  - [ ] 17.5 Write Bitbucket setup guide
    - Create `docs/git/BITBUCKET_SETUP.md`
    - Cover server configuration and token creation
    - _Requirements: 5.1, 5.2_

- [ ] 18. Update In-App Help System
  - [ ] 18.1 Create help content for Git features
    - Create `src/components/help/git-config-help.tsx`
    - Add help articles for authentication, editing, PRs, etc.
    - _Requirements: All_

  - [ ] 18.2 Add contextual help tooltips
    - Add help icons throughout Git UI components
    - Provide inline explanations
    - _Requirements: All_

  - [ ] 18.3 Create interactive tutorial
    - Implement guided walkthrough for first-time users
    - Use react-joyride or similar library
    - _Requirements: All_

  - [ ]* 18.4 Create video tutorials
    - Record 4 short videos (2-3 minutes each)
    - Cover getting started, editing, PRs, troubleshooting
    - _Requirements: All_

- [ ] 19. Update Existing Documentation
  - [ ] 19.1 Update main README.md
    - Add Git configuration management to features list
    - Link to Git documentation
    - _Requirements: All_

  - [ ] 19.2 Update ARGOCD_INTEGRATION.md
    - Document how Git features integrate with ArgoCD
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 19.3 Update SECURITY.md
    - Add Git credential security information
    - Document path-level restrictions
    - _Requirements: 5.10, 8.1, 8.2, 8.3_

  - [ ] 19.4 Update deployment guide
    - Include Git setup in `docs/deployment/QUICK_DEPLOY.md`
    - _Requirements: 5.1_

- [ ] 20. Create Release Notes
  - [ ] 20.1 Write release notes
    - Document new features
    - Include getting started steps
    - List known issues
    - _Requirements: All_

## Phase 10: Testing and Quality Assurance

- [ ] 21. Integration Testing
  - [ ] 21.1 Test end-to-end file editing flow
    - View files → Edit → Preview → Create PR
    - _Requirements: All from Phases 3-6_

  - [ ] 21.2 Test authentication flow
    - First-time authentication → Credential storage → Reuse
    - _Requirements: 5.2, 5.3, 5.4, 5.7, 5.8_

  - [ ] 21.3 Test multi-repository support
    - Different credentials per repository
    - Repository isolation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 21.4 Test path restrictions
    - File access within allowed paths
    - Rejection of out-of-path access
    - _Requirements: 8.3, 8.4, 8.5, 8.6_

  - [ ] 21.5 Test PR workflow
    - Create PR → Review → Merge → Auto-sync
    - _Requirements: All from Phase 7-8_

- [ ] 22. Error Scenario Testing
  - [ ] 22.1 Test authentication failures
    - Invalid credentials
    - Expired tokens
    - Network errors
    - _Requirements: 5.7, 5.8_

  - [ ] 22.2 Test permission errors
    - Insufficient repository permissions
    - Path restriction violations
    - _Requirements: 3.11, 8.7, 8.8_

  - [ ] 22.3 Test merge conflicts
    - Concurrent modifications
    - Conflict detection and display
    - _Requirements: 4.5_

  - [ ] 22.4 Test network failures
    - Repository unavailable
    - Timeout handling
    - Retry mechanisms
    - _Requirements: 1.6, 5.7_

- [ ] 23. Performance Testing
  - [ ] 23.1 Test with large files
    - Files > 1MB
    - Loading performance
    - Editor performance
    - _Requirements: 1.4, 2.3_

  - [ ] 23.2 Test with many files
    - Directories with 100+ files
    - Pagination
    - Loading performance
    - _Requirements: 1.2_

  - [ ] 23.3 Test caching effectiveness
    - File content caching
    - Schema caching
    - Cache invalidation
    - _Requirements: 1.2, 2.4_

- [ ] 24. Security Testing
  - [ ] 24.1 Test credential storage security
    - Encryption at rest
    - No credential logging
    - Secure transmission
    - _Requirements: 5.10_

  - [ ] 24.2 Test path restriction enforcement
    - Attempt to access restricted paths
    - Verify rejection
    - _Requirements: 8.3, 8.4, 8.5, 8.6_

  - [ ] 24.3 Test input validation
    - YAML injection attempts
    - Commit message sanitization
    - PR description sanitization
    - _Requirements: 2.7, 3.2, 3.4_

## Phase 11: Bitbucket Cloud Support (Future)

- [ ] 25. Implement Bitbucket Cloud Client
  - [ ] 25.1 Create `electron/git-providers/bitbucket-cloud-client.ts`
    - Implement GitProvider interface for Bitbucket Cloud
    - Handle workspace/repository structure
    - Use Basic auth with app passwords
    - _Requirements: 5.1, 7.1_

  - [ ] 25.2 Implement API format conversion
    - Convert Cloud API responses to standard format
    - Handle differences in PR structure
    - _Requirements: 7.1_

  - [ ] 25.3 Update provider factory
    - Add auto-detection for bitbucket.org
    - Create appropriate client based on URL
    - _Requirements: 7.1_

  - [ ] 25.4 Update authentication dialog
    - Support app password authentication
    - Add Cloud-specific help links
    - _Requirements: 5.2_

  - [ ]* 25.5 Write unit tests for Bitbucket Cloud client
    - Test all API methods
    - Test format conversion
    - _Requirements: All from 25.1-25.4_

  - [ ] 25.6 Update documentation for Cloud support
    - Document Cloud-specific setup
    - Update troubleshooting guide
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for MVP
- Each task should be completed and tested before moving to the next
- Requirements are referenced to ensure traceability
- All code should follow existing Config Hub patterns and conventions
- Use existing UI components and styling from shadcn/ui
- Follow the credential management pattern established by ArgoCD integration
