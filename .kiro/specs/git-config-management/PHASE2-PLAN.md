# Phase 2: Contextual Resource Management - Implementation Plan

## 📋 Current State (What's Done)

### ✅ Completed Features
1. **Bitbucket Support**
   - ✅ Bitbucket Server client (full CRUD)
   - ✅ Bitbucket Cloud client (full CRUD)
   - ✅ Provider type detection (Server vs Cloud)
   - ✅ File operations (list, read, write)
   - ✅ Branch operations (list, create)
   - ✅ Commit operations (create with attribution)
   - ✅ PR operations (create, list, view, diff, approve, merge)

2. **UI Components**
   - ✅ GitRepositoryCard (inline Git status in Source tab)
   - ✅ PullRequestDialog (create PRs)
   - ✅ PRDetailDialog (view, approve, merge PRs)
   - ✅ DiffPreviewDialog (visual diff with syntax highlighting)
   - ✅ FileEditorDialog (YAML editor with Monaco)
   - ✅ AlertDialog (non-blocking replacements)

3. **Infrastructure**
   - ✅ Credential management (secure storage)
   - ✅ Credential migration (electron-react-app → config-hub)
   - ✅ Environment filtering (credentials without env show everywhere)
   - ✅ IPC handlers (all Git operations)
   - ✅ Git service layer (renderer process)
   - ✅ React hooks (useGitCredentials, useGitFiles)

4. **Settings Page**
   - ✅ Git credentials management
   - ✅ ArgoCD configuration
   - ✅ Vault configuration
   - ✅ Helm configuration
   - ✅ Provider badges (Bitbucket Server/Cloud, GitHub, GitLab)

### 📁 Key Files
```
electron/
├── git-providers/
│   ├── bitbucket-server-client.ts    ✅ Complete
│   ├── bitbucket-cloud-client.ts     ✅ Complete
│   └── git-provider.interface.ts     ✅ Complete
├── git-handler.ts                     ✅ Complete
├── secure-credential-manager.ts       ✅ Complete
└── migrate-credentials.ts             ✅ Complete

src/
├── components/
│   ├── git-repository-card.tsx        ✅ Complete
│   ├── pull-request-dialog.tsx        ✅ Complete
│   ├── pr-detail-dialog.tsx           ✅ Complete
│   ├── file-editor-dialog.tsx         ✅ Complete
│   ├── diff-preview-dialog.tsx        ✅ Complete
│   └── settings-page.tsx              ✅ Complete
├── services/
│   └── git-service.ts                 ✅ Complete
└── hooks/
    ├── use-git-credentials.ts         ✅ Complete
    └── use-git-files.ts               ✅ Complete
```

---

## 🎯 Phase 2 Goals

### Vision
Transform Config Hub from a settings-driven app to a **contextual, ArgoCD-driven GitOps UI** where:
- Resources (Git, Vault) are shown where they're needed, not hidden in settings
- ArgoCD applications are the entry point
- Configuration editing is inline and contextual
- Focus on the 80/20 rule: `values.yaml` and `external-secrets.yaml`

### Key Principles
1. **ArgoCD First**: Start from ArgoCD app, not settings
2. **Context Over Settings**: Show resources in context
3. **Focus on Common Files**: values.yaml (80%), external-secrets.yaml (15%)
4. **Progressive Disclosure**: Hide complexity until needed
5. **PR Everything**: All changes through Pull Requests

---

## 📝 Implementation Tasks

### Task 1: Configuration Tab Redesign
**Goal**: Create focused, file-type-aware configuration interface

#### 1.1 Create ConfigurationTab Component
```typescript
// src/components/configuration-tab.tsx
interface ConfigurationTabProps {
  application: ArgoCDApplication
  environment: string
}

// Features:
// - Auto-detect Git sources from ArgoCD app
// - Show primary files (values.yaml, external-secrets.yaml) at top
// - Collapse other files by default
// - Smart file type handlers
```

**Files to Create/Modify:**
- `src/components/configuration-tab.tsx` (NEW)
- `src/components/argocd-application-detail.tsx` (MODIFY - add Configuration tab)

**Requirements:**
- Parse ArgoCD app spec for Git sources
- Handle single source (legacy) and multi-source (new)
- Extract repo URL, branch, path from source
- Filter files by type (YAML, JSON)
- Prioritize common files (values.yaml, external-secrets.yaml)

#### 1.2 Create PrimaryFilesSection Component
```typescript
// src/components/primary-files-section.tsx
interface PrimaryFilesSectionProps {
  files: GitFile[]
  repoUrl: string
  branch: string
  path: string
  onEdit: (file: GitFile) => void
}

// Features:
// - Always show values.yaml at top
// - Show external-secrets.yaml if exists
// - Show schema files if exist
// - Quick actions: Edit, View Diff, History
```

**Files to Create:**
- `src/components/primary-files-section.tsx` (NEW)

**Requirements:**
- Detect file importance (primary, secondary, other)
- Show file metadata (last edited, author, size)
- Quick edit buttons
- Visual indicators for file types

#### 1.3 Create OtherFilesSection Component
```typescript
// src/components/other-files-section.tsx
interface OtherFilesSectionProps {
  files: GitFile[]
  collapsed: boolean
  onToggle: () => void
  onEdit: (file: GitFile) => void
}

// Features:
// - Collapsed by default
// - Show count of hidden files
// - Expand to show all files
// - Same edit actions as primary files
```

**Files to Create:**
- `src/components/other-files-section.tsx` (NEW)

**Requirements:**
- Collapsible section
- File count badge
- Same edit capabilities as primary files

---

### Task 2: Smart File Type Detection
**Goal**: Automatically prioritize important files

#### 2.1 Create File Priority Service
```typescript
// src/services/file-priority-service.ts
type FilePriority = 'primary' | 'secondary' | 'other'

interface FileImportance {
  priority: FilePriority
  reason: string
  icon: string
}

function getFilePriority(filename: string): FileImportance {
  // Primary: values.yaml, external-secrets.yaml, *.schema.json
  // Secondary: Recently edited files
  // Other: Everything else
}
```

**Files to Create:**
- `src/services/file-priority-service.ts` (NEW)

**Requirements:**
- Detect primary files by name pattern
- Detect secondary files by edit timestamp
- Return priority with reason and icon
- Extensible for future file types

#### 2.2 Add File Metadata Tracking
```typescript
// Extend GitFile interface
interface GitFile {
  path: string
  name: string
  size: number
  lastModified: Date
  lastAuthor: string
  priority?: FileImportance  // NEW
}
```

**Files to Modify:**
- `src/types/git.ts` (MODIFY - extend GitFile interface)
- `electron/git-providers/bitbucket-server-client.ts` (MODIFY - fetch metadata)
- `electron/git-providers/bitbucket-cloud-client.ts` (MODIFY - fetch metadata)

**Requirements:**
- Fetch last commit info for each file
- Extract author and timestamp
- Cache metadata (5 min TTL)

---

### Task 3: Enhanced File Editors
**Goal**: Specialized editors for common file types

#### 3.1 Enhance ValuesYamlEditor
```typescript
// src/components/editors/values-yaml-editor.tsx
interface ValuesYamlEditorProps {
  content: string
  schema?: JSONSchema  // Optional schema for validation
  onChange: (content: string) => void
}

// Features:
// - Monaco editor with YAML syntax
// - Real-time schema validation
// - Preview changes (diff)
// - Affected resources detection
```

**Files to Create:**
- `src/components/editors/values-yaml-editor.tsx` (NEW)

**Requirements:**
- Monaco editor integration (already done in FileEditorDialog)
- Schema validation if .schema.json exists
- Show validation errors inline
- Preview pane showing changes
- Detect affected K8s resources

#### 3.2 Create ExternalSecretsEditor
```typescript
// src/components/editors/external-secrets-editor.tsx
interface ExternalSecretsEditorProps {
  content: string
  vaultUrl?: string
  onChange: (content: string) => void
}

// Features:
// - Smart UI for secret mappings
// - Vault path validation
// - Key mapping editor
// - Raw YAML view toggle
```

**Files to Create:**
- `src/components/editors/external-secrets-editor.tsx` (NEW)

**Requirements:**
- Parse external-secrets.yaml structure
- Show secret mappings in table format
- Validate Vault paths (if Vault configured)
- Allow adding/removing mappings
- Toggle between smart UI and raw YAML

#### 3.3 Create SchemaEditor
```typescript
// src/components/editors/schema-editor.tsx
interface SchemaEditorProps {
  content: string
  testData?: string  // values.yaml content for testing
  onChange: (content: string) => void
}

// Features:
// - JSON editor with validation
// - Test schema against values.yaml
// - Show validation results
```

**Files to Create:**
- `src/components/editors/schema-editor.tsx` (NEW)

**Requirements:**
- Monaco editor with JSON syntax
- JSON Schema validation
- Test schema against values.yaml
- Show validation results in preview pane

---

### Task 4: Inline Resource Configuration
**Goal**: Configure Git/Vault directly from application detail

#### 4.1 Create ResourceStatusCard Component
```typescript
// src/components/resource-status-card.tsx
interface ResourceStatusCardProps {
  type: 'git' | 'vault'
  status: 'connected' | 'not-configured' | 'error'
  resource?: GitCredential | VaultConfig
  repoUrl?: string  // For auto-detection
  onConfigure: () => void
  onTest: () => void
}

// Features:
// - Show connection status
// - Quick actions (configure, test, refresh)
// - Auto-detect from ArgoCD app
// - Inline configuration dialog
```

**Files to Create:**
- `src/components/resource-status-card.tsx` (NEW)

**Requirements:**
- Detect if credentials exist for repo
- Show status badge (connected, not-configured, error)
- Quick test connection button
- Open inline config dialog
- Auto-detect repo URL from ArgoCD app

#### 4.2 Create InlineGitConfigDialog
```typescript
// src/components/inline-git-config-dialog.tsx
interface InlineGitConfigDialogProps {
  repoUrl: string  // Pre-filled from ArgoCD
  environment: string
  onSave: (credential: GitCredential) => void
  onCancel: () => void
}

// Features:
// - Pre-filled repo URL
// - Auto-detect provider type
// - Test connection before save
// - Link to application automatically
```

**Files to Create:**
- `src/components/inline-git-config-dialog.tsx` (NEW)

**Requirements:**
- Pre-fill repo URL from ArgoCD app
- Detect provider type (Bitbucket Server/Cloud, GitHub, GitLab)
- Test connection before allowing save
- Auto-link credential to application
- Show success message with next steps

#### 4.3 Create InlineVaultConfigDialog
```typescript
// src/components/inline-vault-config-dialog.tsx
interface InlineVaultConfigDialogProps {
  environment: string
  onSave: (config: VaultConfig) => void
  onCancel: () => void
}

// Features:
// - Vault URL and token input
// - Test connection
// - Save to environment settings
```

**Files to Create:**
- `src/components/inline-vault-config-dialog.tsx` (NEW)

**Requirements:**
- Vault URL and token input
- Test connection before save
- Save to environment settings
- Show success message

---

### Task 5: Multi-Source Support
**Goal**: Handle ArgoCD apps with multiple Git sources

#### 5.1 Create SourceSelector Component
```typescript
// src/components/source-selector.tsx
interface SourceSelectorProps {
  sources: GitSource[]
  selectedSource: GitSource
  onSelect: (source: GitSource) => void
}

// Features:
// - Show all Git sources
// - Filter out non-Git sources (OCI, Helm)
// - Visual indicator for selected source
// - Show source metadata (repo, branch, path)
```

**Files to Create:**
- `src/components/source-selector.tsx` (NEW)

**Requirements:**
- Parse ArgoCD app spec for all sources
- Filter to Git sources only
- Show source metadata
- Handle source selection
- Update Configuration tab based on selection

#### 5.2 Update ConfigurationTab for Multi-Source
**Files to Modify:**
- `src/components/configuration-tab.tsx` (MODIFY)
- `src/components/primary-files-section.tsx` (MODIFY)
- `src/components/other-files-section.tsx` (MODIFY)

**Requirements:**
- Show SourceSelector if multiple Git sources
- Load files from selected source
- Show source indicator on files
- Filter PRs by selected source

---

### Task 6: Simplified Settings Page
**Goal**: Move Git/Vault config to contextual locations

#### 6.1 Simplify Settings Page
**Files to Modify:**
- `src/components/settings-page.tsx` (MODIFY)

**Changes:**
- Keep Git/Vault tabs for now (backward compatibility)
- Add notice: "Configure Git/Vault directly from applications"
- Add link to "View All Credentials" (advanced)
- Focus on appearance/notifications

#### 6.2 Create Credentials Library Page (Optional)
```typescript
// src/components/credentials-library.tsx
interface CredentialsLibraryProps {
  // Show all credentials organized by type and environment
  // Bulk operations (test all, delete unused)
  // Advanced management
}
```

**Files to Create:**
- `src/components/credentials-library.tsx` (NEW - Optional)

**Requirements:**
- List all credentials by type
- Group by environment
- Bulk test connections
- Delete unused credentials
- Link to applications using each credential

---

## 🗂️ File Structure After Phase 2

```
src/
├── components/
│   ├── configuration-tab.tsx              NEW ⭐
│   ├── primary-files-section.tsx          NEW ⭐
│   ├── other-files-section.tsx            NEW ⭐
│   ├── resource-status-card.tsx           NEW ⭐
│   ├── source-selector.tsx                NEW ⭐
│   ├── inline-git-config-dialog.tsx       NEW ⭐
│   ├── inline-vault-config-dialog.tsx     NEW ⭐
│   ├── credentials-library.tsx            NEW (Optional)
│   ├── editors/
│   │   ├── values-yaml-editor.tsx         NEW ⭐
│   │   ├── external-secrets-editor.tsx    NEW ⭐
│   │   └── schema-editor.tsx              NEW ⭐
│   ├── git-repository-card.tsx            ✅ Existing
│   ├── pull-request-dialog.tsx            ✅ Existing
│   ├── pr-detail-dialog.tsx               ✅ Existing
│   ├── file-editor-dialog.tsx             ✅ Existing (may deprecate)
│   ├── diff-preview-dialog.tsx            ✅ Existing
│   ├── argocd-application-detail.tsx      MODIFY ⭐
│   └── settings-page.tsx                  MODIFY ⭐
├── services/
│   ├── file-priority-service.ts           NEW ⭐
│   ├── git-service.ts                     ✅ Existing
│   └── argocd-service.ts                  ✅ Existing
├── hooks/
│   ├── use-git-credentials.ts             ✅ Existing
│   ├── use-git-files.ts                   ✅ Existing
│   └── use-file-editor.ts                 ✅ Existing
└── types/
    └── git.ts                             MODIFY ⭐
```

---

## 📊 Implementation Order

### Sprint 1: Configuration Tab Foundation (Week 1)
1. ✅ Create ConfigurationTab component
2. ✅ Create PrimaryFilesSection component
3. ✅ Create OtherFilesSection component
4. ✅ Create file-priority-service
5. ✅ Integrate into ArgoCD application detail

**Deliverable**: Basic Configuration tab with file prioritization

### Sprint 2: Enhanced Editors (Week 2)
6. ✅ Create ValuesYamlEditor with validation
7. ✅ Create ExternalSecretsEditor with smart UI
8. ✅ Create SchemaEditor with testing
9. ✅ Update ConfigurationTab to use new editors

**Deliverable**: Specialized editors for common file types

### Sprint 3: Inline Resource Config (Week 3)
10. ✅ Create ResourceStatusCard component
11. ✅ Create InlineGitConfigDialog
12. ✅ Create InlineVaultConfigDialog
13. ✅ Add to ArgoCD application detail

**Deliverable**: Inline Git/Vault configuration from app detail

### Sprint 4: Multi-Source Support (Week 4)
14. ✅ Create SourceSelector component
15. ✅ Update ConfigurationTab for multi-source
16. ✅ Update file sections for multi-source
17. ✅ Test with multi-source apps

**Deliverable**: Full multi-source Git support

### Sprint 5: Settings Simplification (Week 5)
18. ✅ Simplify settings page
19. ✅ Add contextual config notices
20. ✅ Create credentials library (optional)
21. ✅ Update documentation

**Deliverable**: Simplified settings, contextual config

---

## 🧪 Testing Strategy

### Unit Tests
- File priority detection
- Schema validation
- YAML parsing
- Secret mapping parsing

### Integration Tests
- Configuration tab loading
- File editing flow
- PR creation from editors
- Multi-source switching

### E2E Tests
- View app → Configure Git → Edit values.yaml → Create PR
- View app → Edit external-secrets.yaml → Create PR
- Multi-source app → Switch sources → Edit files

---

## 📈 Success Metrics

### User Experience
- **Zero Settings Navigation**: 80% of users never visit settings
- **PR Creation Time**: < 30 seconds from edit to PR
- **Auto-Configuration**: 70% of Git credentials auto-configured

### Technical
- **Test Coverage**: > 80% for new components
- **Performance**: < 2s to load Configuration tab
- **Reliability**: 99.9% uptime for Git operations

---

## 🚀 Next Steps

### Immediate (This Session)
1. Review this plan with user
2. Get approval on approach
3. Start Sprint 1: Configuration Tab Foundation

### Short Term (Next Session)
1. Complete Sprint 1
2. Start Sprint 2: Enhanced Editors
3. Test with real ArgoCD apps

### Long Term (Future Sessions)
1. Complete all sprints
2. User testing and feedback
3. Documentation and training
4. Rollout to production

---

## 📝 Notes

### Design Decisions
- **Keep existing components**: Don't break what works (GitRepositoryCard, PRDetailDialog)
- **Progressive enhancement**: Add new features without removing old ones
- **Backward compatibility**: Keep settings page during transition
- **Focus on 80/20**: Prioritize values.yaml and external-secrets.yaml

### Technical Debt
- May deprecate FileEditorDialog in favor of specialized editors
- Consider consolidating Git credential hooks
- Evaluate Monaco editor performance with large files

### Future Enhancements
- GitHub/GitLab client implementations
- Advanced secret management (rotation, scanning)
- Merge conflict resolution UI
- Deployment history and rollback

---

**Last Updated**: 2025-10-06  
**Status**: Ready for Review  
**Next Action**: Get user approval and start Sprint 1
