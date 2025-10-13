# Pull Requests Tab Design

## Overview
The Pull Requests tab provides a dedicated space for managing pull requests related to configuration changes for ArgoCD applications, without cluttering the Configuration tab's editing interface.

## User Experience Goals
1. **Clear Separation**: Keep PR management separate from active configuration editing
2. **Contextual Relevance**: Show PRs related to the current application's Git sources
3. **Actionable Interface**: Provide quick actions for common PR workflows
4. **Status Visibility**: Clear indication of PR status and impact

## Tab Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Pull Request Management                              [Create PR] │
├─────────────────────────────────────────────────────────────────┤
│  Manage pull requests for configuration changes across all Git   │
│  sources associated with this application.                       │
│                                                                  │
│  [Create New PR] [Refresh PRs]                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Active Pull Requests                                    0 open  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    🔄 No active pull requests                   │
│                                                                  │
│              Create a pull request to propose                    │
│              configuration changes                               │
│                                                                  │
│                    [Create First PR]                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Recent Pull Requests                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  No recent pull request history available                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## With Git Sources and Active PRs

```
┌─────────────────────────────────────────────────────────────────┐
│  Source 1: platform-infra                              0 PRs    │
├─────────────────────────────────────────────────────────────────┤
│  Repository: http://172.27.../scm/test/platform-infra.git      │
│  Branch: main                                                   │
│  Path: k8s/                                                     │
│                                                                  │
│  🔄 No active pull requests                                     │
│  No PRs found for this repository and branch                   │
│                                                                  │
│  [Edit Files] [View in Git]                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Source 2: helm-charts                                 1 PR     │
├─────────────────────────────────────────────────────────────────┤
│  Repository: http://172.27.../scm/test/helm-charts.git         │
│  Branch: main                                                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ #123  Update deployment configuration            [Open]      │ │
│  │ feat: increase replica count for production workload        │ │
│  │ by john.doe • 2 hours ago • main ← feature/increase-replicas│ │
│  │                                          [View] [Review]    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ #124  Add monitoring configuration               [Draft]     │ │
│  │ feat: add prometheus monitoring for new services            │ │
│  │ by jane.smith • 1 day ago • main ← feature/monitoring      │ │
│  │                                          [View] [Continue]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. Configuration Tab Integration
- "Create PR" button in Configuration tab can switch to Pull Requests tab
- After creating PR from Configuration tab, user is directed to Pull Requests tab
- Cross-references between tabs (e.g., "View in Configuration" from PR tab)

### 2. Source Tab Integration  
- Show PR count badge on Source tab when relevant PRs exist
- Link from Git repository cards to related PRs

### 3. Header Actions
- Global "Create PR" action in application header
- PR status indicators in application overview

## Features

### Current Implementation
✅ Dedicated Pull Requests tab
✅ Clean separation from Configuration editing  
✅ Git source-aware PR display (per repository)
✅ **Real PR data fetching** using Git API
✅ Cross-tab navigation (Configuration ↔ Pull Requests)
✅ Repository-specific PR sections with live data
✅ Loading states and error handling
✅ PR status badges and metadata display
✅ Individual refresh buttons per source
✅ Credential-aware PR loading
✅ **Comprehensive diff viewing** in both contexts:
  - **Editor diff**: View changes before saving files
  - **PR review diff**: View file changes in pull requests
✅ Full PR review interface with approval/merge actions

### Future Enhancements
✅ **Phase 1: Basic PR Display** 
- Fetch and display existing PRs from Git providers
- Show PR status, author, timestamps  
- Basic PR metadata (title, description, branch info)
- Loading states and error handling
- Credential validation and management

✅ **Phase 2: PR Actions**
- View PR details with comprehensive diff viewer
- Quick approve/merge actions (where supported)
- PR creation workflow integration
- File-by-file diff review with syntax highlighting
- PR metadata display (reviewers, approvals, conflicts)

🔄 **Phase 3: Advanced Features**
- PR diff preview
- Inline comments and reviews
- Automated PR creation from Configuration tab changes
- PR templates and workflows

## Benefits

### For End Users
1. **Focused Workflow**: Dedicated space for PR management without configuration editing distractions
2. **Clear Overview**: See all PRs related to the application in one place
3. **Quick Actions**: Easy access to common PR operations
4. **Status Awareness**: Clear indication of pending changes and their status

### For Development
1. **Modular Design**: PR functionality is separate from configuration editing
2. **Extensible**: Easy to add new PR features without affecting other tabs
3. **Provider Agnostic**: Can support multiple Git providers (GitHub, GitLab, Bitbucket)
4. **Performance**: Only loads PR data when tab is accessed

## Technical Considerations

### Data Sources
- Git provider APIs (GitHub, GitLab, Bitbucket Server/Cloud)
- ArgoCD application Git source configuration
- User authentication/authorization for Git providers

### State Management
- PR list state (loading, error, data)
- Refresh mechanisms and caching
- Real-time updates (webhooks or polling)

### Error Handling
- Git provider API failures
- Authentication issues
- Network connectivity problems
- Rate limiting

## Recommendation

This approach provides the best user experience by:

1. **Keeping concerns separated**: Configuration editing and PR management are distinct workflows
2. **Maintaining context**: PRs are clearly associated with the application
3. **Providing growth path**: Easy to enhance with more PR features over time
4. **Avoiding clutter**: Configuration tab remains focused on editing tasks

The dedicated tab approach is superior to integrating PRs into the Source tab because:
- PRs are actionable items that need dedicated space
- Source tab is about current state, PRs are about proposed changes
- Allows for richer PR management features without overwhelming the Source view