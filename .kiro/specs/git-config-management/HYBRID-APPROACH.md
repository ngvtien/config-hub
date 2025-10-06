# Hybrid Resource Management Approach

## Philosophy

**Infrastructure vs Application Resources**

### Infrastructure Resources (Settings Page)
- **ArgoCD Servers** - Set up once, used across all apps
- **Vault Connections** - Set up once, shared infrastructure
- **Global Settings** - Appearance, notifications, defaults

### Application Resources (Contextual)
- **Git Repositories** - Dynamic, per-application
- **Git Credentials** - Auto-configured from app context
- **Branch/Path Selection** - Varies per app

## Why This Makes Sense

### ArgoCD & Vault: Infrastructure Layer
```
┌─────────────────────────────────────────────────────────────┐
│  Settings → ArgoCD                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ArgoCD Servers                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🟢 Production ArgoCD                                 │   │
│  │    https://argocd.k8s.local                          │   │
│  │    Namespace: argocd                                 │   │
│  │    [Test] [Edit] [Delete]                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ Add ArgoCD Server]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- ✅ Set up once
- ✅ Rarely changes
- ✅ Shared across all applications
- ✅ Requires admin/ops knowledge
- ✅ Infrastructure-level concern

### Git: Application Layer
```
┌─────────────────────────────────────────────────────────────┐
│  platform-infrastructure-dev                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 Git Repository                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🟦 Bitbucket Server                                  │   │
│  │ http://172.27.../scm/test/platform-infra.git         │   │
│  │ ✅ Connected • Branch: main                          │   │
│  │ [Browse] [Create PR] [⚙️]                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- ✅ Per-application
- ✅ Auto-discovered from ArgoCD
- ✅ Changes frequently (different repos, branches)
- ✅ Developer-focused
- ✅ Application-level concern

## Updated Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Settings Page                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Infrastructure Resources (Set Once)                 │   │
│  │  ├─ ArgoCD Servers                                   │   │
│  │  ├─ Vault Connections                                │   │
│  │  └─ Global Settings                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Used by all apps
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Application Detail View                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Application Resources (Dynamic)                     │   │
│  │  ├─ Git Repository (contextual)                      │   │
│  │  ├─ Git Credentials (auto-configured)                │   │
│  │  └─ Branch/Path Selection                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Updated Settings Page

### Simplified Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [General] [ArgoCD] [Vault] [Advanced]                      │
│                                                             │
│  ┌─ ArgoCD Servers ────────────────────────────────────┐    │
│  │                                                     │    │
│  │  🟢 Production ArgoCD                               │    │
│  │     https://argocd.k8s.local                        │    │
│  │     Connected • 12 applications                     │    │
│  │     [Test] [Edit] [Delete]                          │    │
│  │                                                     │    │
│  │  [+ Add ArgoCD Server]                              │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─ Vault Connections ─────────────────────────────────┐    │
│  │                                                     │    │
│  │  🟢 Production Vault                                │    │
│  │     https://vault.k8s.local                         │    │
│  │     Connected • Mount: secret                       │    │
│  │     [Test] [Edit] [Delete]                          │    │
│  │                                                     │    │
│  │  [+ Add Vault Connection]                           │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  💡 Git repositories are configured per-application         │
│     and appear in each application's detail view.           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Application Detail View

### With Contextual Git
```
┌─────────────────────────────────────────────────────────────┐
│  platform-infrastructure-dev                    [Sync] [⋮]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Status ──────────────────────────────────────────────┐  │
│  │ ArgoCD: ✅ Synced • Vault: ✅ Connected              │  │
│  │ Revision: abc123 - "Update config" (main)             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Git Repository ──────────────────────────────────────┐  │
│  │ 🟦 Bitbucket Server                                   │  │
│  │ http://172.27.../scm/test/platform-infrastructure.git │  │
│  │                                                       │  │
│  │ ✅ Connected • User: ngvtien • Branch: main          │  │
│  │                                                       │  │
│  │ [Browse Files] [Create PR] [Switch Branch] [⚙️]       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [Configuration] [Parameters] [Secrets] [Pull Requests]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## User Flows

### Flow 1: Initial Setup (Infrastructure)
```
1. User opens app for first time
2. Goes to Settings → ArgoCD
3. Adds ArgoCD server (once)
4. Goes to Settings → Vault
5. Adds Vault connection (once)
6. Done with infrastructure setup
```

### Flow 2: Using Applications (Dynamic Git)
```
1. User opens application from ArgoCD
2. App auto-detects Git source from ArgoCD spec
3. If Git not configured:
   → Shows inline prompt
   → User configures Git (quick dialog)
   → Auto-linked to this app
4. User can now browse files, create PRs
5. Different app? Different Git repo? No problem!
   → Each app has its own Git configuration
```

### Flow 3: Multi-Source Application
```
1. Application has multiple Git sources
2. Each source shown as separate card
3. Configure each independently
4. Switch between sources easily
```

## Benefits of Hybrid Approach

### For Infrastructure (Settings)
- ✅ Clear separation of concerns
- ✅ Admin-focused configuration
- ✅ Set once, forget
- ✅ Easy to manage globally
- ✅ Familiar settings pattern

### For Git (Contextual)
- ✅ Per-application flexibility
- ✅ Auto-discovery from ArgoCD
- ✅ Developer-focused
- ✅ No context switching
- ✅ Dynamic and adaptive

### For Users
- ✅ Less overwhelming (Git not in settings)
- ✅ Clear mental model (infra vs app)
- ✅ Faster workflows (Git where you need it)
- ✅ Better discoverability

## Implementation Changes

### Keep in Settings Page
```typescript
// Settings Page Tabs
- General (appearance, notifications)
- ArgoCD (servers, connections)
- Vault (connections, namespaces)
- Advanced (debug, logs, etc.)
```

### Move to Application Context
```typescript
// Application Detail Components
- GitRepositoryCard (inline)
- InlineGitConfigDialog (on-demand)
- GitBranchSelector (contextual)
- GitFilesBrowser (integrated)
```

### Remove from Settings
```typescript
// No longer in settings:
- Git Repositories tab ❌
- Git Credentials management ❌
- Repository list ❌
```

## Migration Path

### Phase 1: Add Contextual Git
- Add Git cards to application detail
- Add inline configuration dialogs
- Keep settings page Git tab (deprecated notice)

### Phase 2: Encourage Migration
- Show banner: "Git configuration has moved!"
- Auto-migrate existing credentials to apps
- Link to new location

### Phase 3: Remove from Settings
- Remove Git tab from settings
- Keep only ArgoCD and Vault
- Clean up UI

## Edge Cases

### What if user wants to see all Git credentials?
**Solution:** Add "View All Git Repositories" link in Advanced settings
- Shows all configured Git repos
- Grouped by application
- Bulk operations (test all, cleanup)
- Power user feature

### What if multiple apps use same Git repo?
**Solution:** Smart credential sharing
- Detect same repo URL
- Offer to reuse existing credential
- Show which apps use which repos

### What if user configures Git before viewing app?
**Solution:** Auto-link on first view
- Detect matching repo URL
- Auto-link credential to app
- Show success message

## Updated Wireframes

### Settings Page (Simplified)
```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [General] [ArgoCD] [Vault] [Advanced]                      │
│                                                             │
│  Currently viewing: ArgoCD                                  │
│                                                             │
│  ┌─ ArgoCD Servers ────────────────────────────────────┐    │
│  │  🟢 Production ArgoCD                               │    │
│  │     https://argocd.k8s.local                        │    │
│  │     [Test] [Edit] [Delete]                          │    │
│  │                                                     │    │
│  │  [+ Add Server]                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  💡 Git repositories are configured per-application.       │
│     They appear in each application's detail view.          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Application Detail (With Git)
```
┌─────────────────────────────────────────────────────────────┐
│  platform-infrastructure-dev                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Status: ✅ Synced • ✅ Healthy                         │
│  🔗 ArgoCD: argocd.k8s.local • 🔐 Vault: vault.k8s.local   │
│                                                             │
│  📁 Git Repository                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟦 Bitbucket Server • Branch: main                  │   │
│  │ http://172.27.../scm/test/platform-infra.git        │   │
│  │ ✅ Connected • Last commit: abc123 (2h ago)         │   │
│  │ [Browse] [Create PR] [Switch Branch] [⚙️]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [Configuration] [Secrets] [Pull Requests]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Summary

**Infrastructure Resources (Settings):**
- ArgoCD Servers ✅
- Vault Connections ✅
- Global Settings ✅

**Application Resources (Contextual):**
- Git Repositories ✅
- Git Credentials ✅
- Branch/Path Selection ✅

This hybrid approach gives us:
- **Simplicity** - Clear separation
- **Flexibility** - Git where you need it
- **Scalability** - Each app independent
- **Familiarity** - Settings for infrastructure

Best of both worlds! 🎯
