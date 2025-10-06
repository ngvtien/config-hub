# Config Hub - Contextual Resources Wireframes

## 1. ArgoCD Application Detail - With Resources

### Current State (Before)
```
┌────────────────────────────────────────────────────────────────────┐
│  platform-infrastructure-dev                    [Sync] [Refresh]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Status: Synced • Health: Healthy • Last Sync: 2 minutes ago      │
│                                                                     │
│  [Configuration] [Parameters] [Resources] [Events]                 │
│                                                                     │
│  ... content ...                                                   │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### New State (After)
```
┌────────────────────────────────────────────────────────────────────┐
│  platform-infrastructure-dev                    [Sync] [Refresh]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─ Status ──────────────────────────────────────────────────────┐ │
│  │ Sync: ✅ Synced (2 min ago) • Health: ✅ Healthy             │ │
│  │ Revision: abc123 - "Update config" (main)                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─ Resources ───────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │  📁 Git Repository                                            │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ 🟦 Bitbucket Server                                      │ │ │
│  │  │ http://172.27.../scm/test/platform-infrastructure.git    │ │ │
│  │  │                                                          │ │ │
│  │  │ ✅ Connected • User: ngvtien • Last tested: 5 min ago   │ │ │
│  │  │                                                          │ │ │
│  │  │ [Browse Files] [Create PR] [Test] [⚙️]                   │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │  🔐 Vault                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ ⚠️  Not configured                                       │ │ │
│  │  │                                                          │ │ │
│  │  │ Vault is needed for External Secrets management.         │ │ │
│  │  │                                                          │ │ │
│  │  │ [Configure Vault]                                        │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  [Configuration] [Parameters] [Secrets] [Pull Requests]            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. ResourceStatusCard Component States

### State A: Connected (Git)
```
┌──────────────────────────────────────────────────────────────┐
│ 📁 Git Repository                                           │
│ ┌─────────────────────────────────────────────────────── ┐   │
│ │ 🟦 Bitbucket Server                                   │   │
│ │ http://172.27.../scm/test/platform-infrastructure.git  │   │
│ │                                                        │   │
│ │ ✅ Connected • User: ngvtien • Last tested: 5 min ago  │   │
│ │                                                        │   │
│ │ [Browse Files] [Create PR] [Test] [⚙️]                 │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### State B: Not Configured
```
┌──────────────────────────────────────────────────────────────┐
│ 📁 Git Repository                                           │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ ⚠️  Not configured                                     │   │
│ │                                                        │   │
│ │ Git access is required to browse files and create PRs. │   │
│ │                                                        │   │
│ │ Repository: http://172.27.../scm/test/platform-infra   │   │
│ │ (detected from ArgoCD)                                 │   │
│ │                                                        │   │
│ │ [Configure Git Access]                                 │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### State C: Error
```
┌──────────────────────────────────────────────────────────────┐
│ 📁 Git Repository                                            │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ ❌ Connection failed                                   │   │
│ │                                                        │   │
│ │ 🟦 Bitbucket Server                                    │   │
│ │ http://172.27.../scm/test/platform-infrastructure.git  │   │
│ │                                                        │   │
│ │ Error: Authentication failed (401)                     │   │
│ │ Token may have expired or been revoked.                │   │
│ │                                                        │   │
│ │ [Retry] [Reconfigure] [View Details]                   │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### State D: Testing
```
┌──────────────────────────────────────────────────────────────┐
│ 📁 Git Repository                                           │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 🔄 Testing connection...                               │   │
│ │                                                        │   │
│ │ 🟦 Bitbucket Server                                    │   │
│ │ http://172.27.../scm/test/platform-infrastructure.git  │   │
│ │                                                        │   │
│ │ [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]   │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Inline Git Configuration Dialog

### Step 1: Basic Info
```
┌────────────────────────────────────────────────────────────────┐
│  Configure Git Access                              [✕]         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Repository URL (detected from ArgoCD)                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ http://172.27.../scm/test/platform-infrastructure.git     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  Provider Type                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🟦 Bitbucket Server (auto-detected)                  [▼] │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  Configuration Name                                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ platform-infrastructure-dev Git                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  Authentication Method                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ○ Username/Password  ● Token  ○ SSH Key                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  Username                                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ngvtien                                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  Access Token                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ••••••••••••••••••••••••••••••••••••••••••••••••••••••••  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  💡 Tip: Generate a Personal Access Token in Bitbucket Server  │
│     with repository read/write permissions.                    │
│                                                                │
│                                    [Cancel] [Test & Save]      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Step 2: Testing
```
┌────────────────────────────────────────────────────────────────┐
│  Configure Git Access                              [✕]         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Testing connection...                                         │
│                                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  🔄 Connecting to Bitbucket Server...                     │ │
│  │                                                           │ │
│  │  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]   │ │
│  │                                                           │ │
│  │  ✓ Authentication successful                              │ │
│  │  ✓ Repository accessible                                  │ │
│  │  ✓ Permissions verified                                   │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│                                                      [Cancel]  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Step 3: Success
```
┌────────────────────────────────────────────────────────────────┐
│  Configure Git Access                              [✕]         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  ✅ Git access configured successfully!                  │ │
│  │                                                           │ │
│  │  You can now browse files, edit configurations, and       │ │
│  │  create pull requests for this application.               │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│                                                      [Done]    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. Inline Vault Configuration Dialog

```
┌────────────────────────────────────────────────────────────────┐
│  Configure Vault Connection                        [✕]         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Vault is needed to manage External Secrets for this app.      │
│                                                                │
│  Vault Server URL                                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ https://vault.k8s.local                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  Authentication Method                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ● Token  ○ Username/Password  ○ Kubernetes                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  Vault Token                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ••••••••••••••••••••••••••••••••••••••••••••••••••••••••  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  Namespace (optional)                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  Mount Path                                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ secret                                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  💡 Tip: You can get a Vault token from your Vault admin or    │
│     generate one using the Vault CLI.                          │
│                                                                │
│                                    [Cancel] [Test & Save]      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Resource Sidebar (Alternative Layout)

```
┌──────────────┬──────────────────────────────────────────────────┐
│              │  platform-infrastructure-dev                     │
│  Resources   ├──────────────────────────────────────────────────┤
│              │                                                  │
│  🟢 ArgoCD  │   ┌─ Status ────────────────────────────────────┐ │
│  Connected   │  │ Sync: ✅ Synced • Health: ✅ Healthy       │ │
│              │  └─────────────────────────────────────────────┘ │
│  🟢 Git      │                                                  │
│  Connected   │  [Configuration] [Parameters] [Secrets] [PRs]    │
│  [Test]      │                                                   │
│              │  ... content ...                                  │
│  🔴 Vault   │                                                   │
│  Not Setup   │                                                   │
│  [Configure] │                                                   │
│              │                                                   │
│  ─────────   │                                                   │
│              │                                                   │
│  [+ Add]     │                                                   │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 6. Smart Detection Banner

### When Git is Missing
```
┌────────────────────────────────────────────────────────────────┐
│  platform-infrastructure-dev                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ℹ️  Git Access Required                                   │ │
│  │                                                           │ │
│  │ We detected this application uses Git repository:         │ │
│  │ http://172.27.../scm/test/platform-infrastructure.git     │ │
│  │                                                           │ │
│  │ Configure Git access to browse files and create PRs.      │ │
│  │                                                           │ │
│  │ [Configure Now] [Remind Me Later]                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  ... rest of content (limited functionality) ...               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### When Vault is Recommended
```
┌────────────────────────────────────────────────────────────────┐
│  platform-infrastructure-dev                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 💡 Vault Integration Available                            │ │
│  │                                                           │ │
│  │ This application has 3 External Secrets that could be     │ │
│  │ managed through Vault.                                    │ │
│  │                                                           │ │
│  │ [Set Up Vault] [Learn More] [Dismiss]                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Resource Health Indicators

### Compact View (Top Bar)
```
┌────────────────────────────────────────────────────────────────┐
│  platform-infrastructure-dev                                   │
│                                                                │
│  Resources: 🟢 ArgoCD  🟢 Git  🔴 Vault                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Expanded View (Hover/Click)
```
┌────────────────────────────────────────────────────────────────┐
│  Resources                                                     │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ 🟢 ArgoCD          ✅ Connected                           ││
│  │ 🟢 Git             ✅ Connected (tested 5m ago)           ││
│  │ 🔴 Vault           ❌ Not configured → [Configure]        ││
│  └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Configuration Tab with Inline Git

### Before (Current)
```
┌────────────────────────────────────────────────────────────────┐
│  [Configuration] [Parameters] [Resources] [Events]             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Configuration Files                                           │
│                                                                │
│  📄 values.yaml                                                │
│  📄 config/app.yaml                                            │
│  📄 config/database.yaml                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### After (With Git Integration)
```
┌────────────────────────────────────────────────────────────────┐
│  [Configuration] [Parameters] [Secrets] [Pull Requests]        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📁 Git Repository: 🟦 Bitbucket Server (✅ Connected)        │
│     http://172.27.../scm/test/platform-infrastructure.git      │
│     Branch: main • Last commit: abc123 (2 hours ago)           │
│                                                                │
│  Configuration Files                                           │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ 📄 values.yaml                    [Edit] [History] [Blame]││
│  │ 📄 config/app.yaml               [Edit] [History] [Blame] ││
│  │ 📄 config/database.yaml          [Edit] [History] [Blame] ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
│  [Browse All Files] [Create Pull Request]                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
ArgoCD Application Detail
├─ ApplicationHeader
│  ├─ Title
│  ├─ Actions (Sync, Refresh)
│  └─ ResourceHealthIndicator (compact)
│
├─ StatusCard
│  ├─ Sync Status
│  ├─ Health Status
│  └─ Git Revision
│
├─ ResourcesSection
│  ├─ ResourceStatusCard (Git)
│  │  ├─ Header (icon, title, provider)
│  │  ├─ Status (connected/error/not-configured)
│  │  ├─ Details (URL, user, last tested)
│  │  └─ Actions (browse, test, configure)
│  │
│  └─ ResourceStatusCard (Vault)
│     ├─ Header
│     ├─ Status
│     └─ Actions
│
├─ TabNavigation
│  ├─ Configuration
│  ├─ Parameters
│  ├─ Secrets
│  └─ Pull Requests
│
└─ TabContent
   └─ ... (depends on active tab)

Dialogs (Overlay)
├─ InlineGitConfigDialog
│  ├─ Form (URL, provider, auth)
│  ├─ TestConnection
│  └─ SaveAndLink
│
└─ InlineVaultConfigDialog
   ├─ Form (server, token, namespace)
   ├─ TestConnection
   └─ SaveAndLink
```

---

## Responsive Behavior

### Desktop (> 1024px)
- Resources section visible inline
- Side-by-side layout possible
- Full details shown

### Tablet (768px - 1024px)
- Resources section stacked
- Compact actions
- Collapsible sections

### Mobile (< 768px)
- Resources as expandable cards
- Bottom sheet for configuration
- Simplified actions

---

These wireframes show the complete flow from detection to configuration to usage. Ready to implement! 🎨
