# Contextual Resource Management

## Current Problem: Settings Page Bottleneck

**Current Flow:**
```
User → Settings → Git Tab → Configure → Save → Back to App → Use
```

**Issues:**
- Settings page is a separate destination
- Disconnected from actual usage
- User must context-switch
- Hard to understand what's needed when

## New Approach: Contextual Resources

Resources (Git, ArgoCD, Vault) appear **where and when they're needed**, not hidden in settings.

### Concept: Just-In-Time Configuration

```
User tries to use feature → Missing resource detected → Inline configuration → Continue
```

## UI Patterns

### Pattern 1: Inline Resource Cards

Instead of hiding in settings, show resources inline:

```
┌─────────────────────────────────────────────────────────────┐
│  platform-infrastructure-dev                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📁 Git Repository                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🟦 Bitbucket Server                                  │   │
│  │ http://172.27.../scm/test/platform-infra.git        │   │
│  │ ✅ Connected • User: ngvtien                        │   │
│  │                                                      │   │
│  │ [Browse Files] [Create PR] [⚙️ Configure]          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  🔐 Vault                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ⚠️  Not configured                                   │   │
│  │                                                      │   │
│  │ Vault is needed for External Secrets management.    │   │
│  │ [Configure Vault Now]                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 2: Smart Prompts

When user tries to do something, prompt for missing resources:

```
User clicks "Edit Secret" →

┌─────────────────────────────────────────────────────────────┐
│  Configure Vault Connection                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  To manage External Secrets, we need to connect to Vault.   │
│                                                              │
│  Vault Server: [https://vault.k8s.local          ]          │
│  Token:        [••••••••••••••••••••••••••••••••]          │
│  Namespace:    [                                 ]          │
│                                                              │
│  [Test Connection] [Save & Continue]                         │
│                                                              │
│  Or [Skip - Use Sealed Secrets Instead]                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Pattern 3: Resource Sidebar

Quick access panel for current context:

```
┌──────────────┬──────────────────────────────────────────────┐
│              │  platform-infrastructure-dev                  │
│  Resources   ├──────────────────────────────────────────────┤
│              │                                               │
│  🟢 ArgoCD   │  [Main Content Area]                          │
│  🟢 Git      │                                               │
│  🔴 Vault    │  • Config files                               │
│              │  • Secrets                                    │
│  [+ Add]     │  • Parameters                                 │
│              │                                               │
└──────────────┴──────────────────────────────────────────────┘
```

### Pattern 4: Auto-Discovery Banner

When ArgoCD app is detected but resources aren't configured:

```
┌─────────────────────────────────────────────────────────────┐
│  ℹ️  We found this application in ArgoCD but need to set up │
│     Git access to manage its configuration.                  │
│                                                              │
│  Git Repository: http://172.27.../scm/test/platform-infra   │
│                                                              │
│  [Configure Git Access] [Dismiss]                            │
└─────────────────────────────────────────────────────────────┘
```

## Simplified Settings Page

Settings becomes minimal - just for global/advanced config:

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🎨 Appearance                                               │
│  ├─ Theme: [Dark ▼]                                         │
│  └─ Font Size: [Medium ▼]                                   │
│                                                              │
│  🔔 Notifications                                            │
│  ├─ ☑ PR status updates                                     │
│  └─ ☑ Sync failures                                         │
│                                                              │
│  🔧 Advanced                                                 │
│  ├─ Default branch: [main]                                  │
│  ├─ Auto-sync: [Enabled ▼]                                  │
│  └─ [View All Credentials]  ← Only if needed                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Resource Management Flows

### Flow 1: Auto-Configure from ArgoCD

```typescript
// When viewing an ArgoCD application
async function ensureGitAccess(app: ArgoCDApplication) {
  const gitSource = app.spec.source.repoURL
  
  // Check if we have credentials
  const credential = await findGitCredential(gitSource)
  
  if (!credential) {
    // Show inline prompt
    showGitConfigPrompt({
      repoUrl: gitSource,
      suggestedName: `${app.name} Git`,
      onComplete: (cred) => {
        // Link and continue
        linkAppToCredential(app.name, cred.id)
        refreshAppView()
      }
    })
  }
}
```

### Flow 2: Quick Add Resource

```
User in app detail → Clicks "⚙️" next to resource → Quick config dialog

┌─────────────────────────────────────────────────────────────┐
│  Configure Git Access                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Repository: http://172.27.../scm/test/platform-infra.git   │
│  (detected from ArgoCD)                                      │
│                                                              │
│  Username: [ngvtien                    ]                     │
│  Token:    [••••••••••••••••••••••••••]                     │
│                                                              │
│  [Test] [Save]                                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Flow 3: Resource Health Indicators

Show status inline, click to fix:

```
┌─────────────────────────────────────────────────────────────┐
│  Resources                                                   │
│                                                              │
│  🟢 ArgoCD          ✅ Connected                             │
│  🟡 Git             ⚠️  Token expired → [Refresh]           │
│  🔴 Vault           ❌ Not configured → [Configure]          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Navigation Structure

### Option A: Application-Centric (Recommended)

```
Main Navigation:
├─ 📱 Applications (from ArgoCD)
│  ├─ platform-infrastructure-dev
│  │  ├─ Overview
│  │  ├─ Configuration (inline Git access)
│  │  ├─ Secrets (inline Vault access)
│  │  └─ Pull Requests
│  └─ api-gateway-dev
│     └─ ...
│
├─ 🔄 Pull Requests (all apps)
├─ 🔍 Search
└─ ⚙️  Settings (minimal)
```

### Option B: Hybrid

```
Main Navigation:
├─ 📱 Applications
├─ 🔄 Pull Requests
├─ 📦 Resources (when needed)
│  ├─ Git Repositories
│  ├─ Vault Connections
│  └─ ArgoCD Servers
└─ ⚙️  Settings
```

## Implementation Strategy

### Phase 1: Add Contextual Prompts
- Detect missing resources when needed
- Show inline configuration dialogs
- Keep settings page as fallback

### Phase 2: Inline Resource Cards
- Show Git/Vault status in app detail
- Add quick actions (test, configure, refresh)
- Link to full settings if needed

### Phase 3: Auto-Discovery
- Detect Git sources from ArgoCD
- Suggest credential configuration
- Auto-link when possible

### Phase 4: Simplify Settings
- Move resource management to context
- Keep only global settings
- Make settings optional

## Benefits

### For Users
- ✅ Less navigation
- ✅ Context-aware
- ✅ Faster workflows
- ✅ Clear what's needed when

### For Development
- ✅ Better UX
- ✅ Clearer user intent
- ✅ Easier to guide users
- ✅ Less overwhelming

## Example: Complete Flow

```
1. User opens app "platform-infrastructure-dev"
   
2. App detail shows:
   ┌─────────────────────────────────────────┐
   │ 📁 Git Repository                       │
   │ ⚠️  Not configured                      │
   │ [Configure Now]                         │
   └─────────────────────────────────────────┘

3. User clicks "Configure Now"
   → Inline dialog appears
   → Pre-filled with repo URL from ArgoCD
   → User enters credentials
   → Test → Save

4. Card updates:
   ┌─────────────────────────────────────────┐
   │ 📁 Git Repository                       │
   │ ✅ Connected                            │
   │ [Browse Files] [Create PR]              │
   └─────────────────────────────────────────┘

5. User can now edit configs, create PRs, etc.
   → No need to visit settings page
   → Everything in context
```

## Key Principle

**"Configuration should be invisible until it's needed, and obvious when it is."**

Resources aren't something users "set up" - they're something that naturally emerges from using the application.

## Next Steps

1. ✅ Commit current work
2. Design contextual resource components
3. Implement inline Git configuration
4. Add auto-discovery from ArgoCD
5. Gradually migrate away from settings-heavy approach

This makes Config Hub feel more like a **tool** and less like a **configuration manager**.
