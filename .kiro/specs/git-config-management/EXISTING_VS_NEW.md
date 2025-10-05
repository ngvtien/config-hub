# Existing vs New Implementation Analysis

## Summary

After scanning the codebase, here's what already exists and what needs to be built for the Git Configuration Management feature.

## ✅ Already Implemented (Can Reuse)

### Electron Main Process

#### 1. Credential Management (`electron/secure-credential-manager.ts`)
- ✅ `SecureCredentialManager` class with encryption
- ✅ `GitCredential` interface
- ✅ `storeCredential()` method
- ✅ `getCredential()` method
- ✅ `listCredentials()` method
- ✅ `deleteCredential()` method
- ✅ `findCredentials()` method
- ✅ Electron safeStorage integration
- ✅ Keytar fallback support

#### 2. Git IPC Handlers (`electron/git-handler.ts` and `electron/simple-git-handler.ts`)
- ✅ `git:store-credential` handler
- ✅ `git:test-credential` handler
- ✅ `git:list-credentials` handler
- ✅ `git:get-credential` handler
- ✅ `git:delete-credential` handler
- ✅ `git:find-credentials-by-repo` handler
- ✅ `git:generate-ssh-key` handler
- ✅ `git:clone-repository` handler (uses Git CLI)

#### 3. Provider Detection (`electron/simple-git-handler.ts`)
- ✅ `detectProviderType()` method
  - Detects Bitbucket Server (localhost, custom ports)
  - Detects Bitbucket Cloud (bitbucket.org)
  - Detects generic Git repos

#### 4. Authentication Testing (`electron/simple-git-handler.ts`)
- ✅ `testBitbucketServerTokenAuth()` - Tests Bitbucket Server API connection
- ✅ `testBitbucketCloudAuth()` - Tests Bitbucket Cloud with username/password
- ✅ `testBitbucketCloudTokenAuth()` - Tests Bitbucket Cloud with OAuth/App Password
- ✅ `testBitbucketCloudAppPassword()` - Tests Bitbucket Cloud App Password
- ✅ `testBitbucketServerAuth()` - Tests Bitbucket Server authentication

#### 5. SSH Key Management (`electron/git-handler.ts`)
- ✅ SSH key pair generation
- ✅ SSH key storage in ~/.ssh
- ✅ SSH config management
- ✅ SSH key cleanup on credential deletion

### Renderer Process

#### 1. Service Patterns
- ✅ `src/services/argocd-service.ts` - Pattern to follow for git-service.ts
- ✅ IPC communication pattern
- ✅ Credential management pattern
- ✅ Error handling pattern

#### 2. Hook Patterns
- ✅ `src/hooks/use-argocd-credentials.ts` - Pattern for use-git-credentials.ts
- ✅ `src/hooks/use-argocd.ts` - Pattern for use-git-files.ts
- ✅ State management patterns

#### 3. UI Components
- ✅ shadcn/ui component library (Dialog, Card, Button, Input, etc.)
- ✅ Existing modal dialog patterns
- ✅ Existing credential prompt patterns
- ✅ Tailwind CSS styling
- ✅ lucide-react icons

#### 4. Application Detail Page
- ✅ `src/components/argocd-application-detail.tsx` - Where to add Configuration Files section
- ✅ Git source display (repository URL, path, revision)
- ✅ `getApplicationSource()` helper function

## ❌ NOT Implemented (Needs to be Built)

### Electron Main Process

#### 1. Bitbucket API Client
- ❌ `electron/git-providers/git-provider.interface.ts` - Provider interface
- ❌ `electron/git-providers/bitbucket-server-client.ts` - Bitbucket Server API client
- ❌ `electron/git-providers/bitbucket-cloud-client.ts` - Bitbucket Cloud API client

#### 2. File Operations (Bitbucket API)
- ❌ List files in repository path
- ❌ Get file content
- ❌ Get file metadata (size, last modified, author)

#### 3. Branch Operations (Bitbucket API)
- ❌ List branches
- ❌ Create branch
- ❌ Get branch details

#### 4. Commit Operations (Bitbucket API)
- ❌ Create commit with file changes
- ❌ Get commit history
- ❌ Get commit details

#### 5. Pull Request Operations (Bitbucket API)
- ❌ Create Pull Request
- ❌ Get Pull Request details
- ❌ Get Pull Request status
- ❌ Merge Pull Request
- ❌ Get Pull Request list

#### 6. Webhook Operations
- ❌ Send webhook notifications (MS Teams, Slack)

#### 7. New IPC Handlers
- ❌ `git:listFiles` handler
- ❌ `git:getFileContent` handler
- ❌ `git:createBranch` handler
- ❌ `git:commitChanges` handler
- ❌ `git:createPullRequest` handler
- ❌ `git:getPullRequest` handler
- ❌ `git:mergePullRequest` handler
- ❌ `git:sendWebhookNotification` handler

#### 8. Preload Script Updates
- ❌ Expose new Git file operation APIs to renderer

### Renderer Process

#### 1. Git Service
- ❌ `src/services/git-service.ts` - New service for Git operations
- ❌ File operations methods
- ❌ Branch operations methods
- ❌ Commit operations methods
- ❌ Pull Request operations methods
- ❌ Path restriction validation

#### 2. Git Types
- ❌ `src/types/git.ts` - Git operation types
- ❌ `src/types/bitbucket.ts` - Bitbucket API types

#### 3. Custom Hooks
- ❌ `src/hooks/use-git-credentials.ts` - Git credential management
- ❌ `src/hooks/use-git-files.ts` - File listing and fetching
- ❌ `src/hooks/use-file-editor.ts` - File editing state management

#### 4. UI Components
- ❌ `src/components/git-auth-dialog.tsx` - Git authentication dialog
- ❌ `src/components/config-files-section.tsx` - Configuration files section
- ❌ `src/components/file-editor-dialog.tsx` - File editor with YAML/form views
- ❌ `src/components/diff-preview-dialog.tsx` - Diff preview
- ❌ `src/components/pull-request-dialog.tsx` - PR creation dialog
- ❌ `src/components/pr-success-dialog.tsx` - PR success confirmation

#### 5. Editor Integration
- ❌ Monaco Editor or CodeMirror integration
- ❌ YAML syntax highlighting
- ❌ YAML validation
- ❌ JSON Schema validation
- ❌ Form generation from JSON Schema
- ❌ YAML ↔ Form synchronization

#### 6. Diff Viewer
- ❌ react-diff-viewer integration
- ❌ Side-by-side diff display
- ❌ Change summary

#### 7. Application Detail Integration
- ❌ Add Configuration Files section to application detail page
- ❌ Update environment settings type

## 🔄 Needs Modification (Extend Existing)

### Electron Main Process

#### 1. Git Handler (`electron/git-handler.ts` or `electron/simple-git-handler.ts`)
- 🔄 Add new IPC handlers for file operations
- 🔄 Add new IPC handlers for PR operations
- 🔄 Integrate Bitbucket API clients
- 🔄 Use provider detection to instantiate correct client

#### 2. Preload Script (`electron/preload.ts`)
- 🔄 Add new Git API methods to window.electronAPI.git

### Renderer Process

#### 1. Environment Settings
- 🔄 Add git configuration to EnvironmentSettings interface
- 🔄 Add webhook configuration

## 📊 Implementation Effort Breakdown

### High Effort (New Development)
1. **Bitbucket API Clients** - 40% of effort
   - Server client with all operations
   - Cloud client with all operations
   - Provider abstraction

2. **UI Components** - 30% of effort
   - File editor with dual views
   - Diff preview
   - PR workflow dialogs

3. **Editor Integration** - 15% of effort
   - Monaco/CodeMirror setup
   - Schema-based form generation
   - Validation

### Medium Effort (Following Patterns)
4. **Git Service** - 10% of effort
   - Follow ArgoCD service pattern
   - IPC communication

5. **Custom Hooks** - 5% of effort
   - Follow existing hook patterns

### Low Effort (Simple Extensions)
6. **IPC Handlers** - 3% of effort
   - Add to existing git-handler.ts
   - Follow existing patterns

7. **Integration** - 2% of effort
   - Add section to application detail page
   - Update settings type

## 🎯 Recommendations

### 1. Reuse Existing Infrastructure
- ✅ Use existing credential management (no changes needed)
- ✅ Use existing provider detection (no changes needed)
- ✅ Use existing authentication testing (no changes needed)
- ✅ Follow existing service patterns (ArgoCD service)
- ✅ Follow existing hook patterns (ArgoCD hooks)
- ✅ Use existing UI components (shadcn/ui)

### 2. Build New Components
- Focus effort on Bitbucket API clients (40% of work)
- Build file editor components (30% of work)
- Integrate editor libraries (15% of work)

### 3. Avoid Duplication
- ❌ Don't create new credential management
- ❌ Don't create new provider detection
- ❌ Don't create new authentication testing
- ❌ Don't duplicate UI component patterns

### 4. Safety Guardrails
- ✅ Use ONLY Bitbucket REST API (no Git CLI for file operations)
- ✅ All operations in-memory (no local file writes)
- ✅ No interaction with local Git repositories
- ✅ Stateless operations

## 📝 Updated Task Priorities

Based on this analysis, the tasks should focus on:

1. **Phase 1**: Bitbucket API clients (NEW)
2. **Phase 2**: Git service following ArgoCD pattern (REUSE PATTERN)
3. **Phase 3**: UI components using shadcn/ui (REUSE COMPONENTS)
4. **Phase 4**: Editor integration (NEW)
5. **Phase 5**: PR workflow (NEW)

**Total New Code**: ~60% of implementation
**Reused Infrastructure**: ~40% of implementation

This significantly reduces the implementation effort compared to building everything from scratch!
