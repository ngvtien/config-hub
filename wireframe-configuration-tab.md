# Configuration Tab - Tabbed Editor Interface Wireframe

## Layout Overview
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Configuration Tab Content                                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Git Sources Section ──────────────────────────────────────────────────────────┐   │
│ │ 🌿 Git Sources                                    [Source 1 ▼] [🔄 Refresh]   │   │
│ │                                                                                │   │
│ │ 📍 github.com/myorg/myapp-config | 🌿 main | /customers/customer-01          │   │
│ │ ✅ Authenticated | 📤 3 Pull Requests | 🔗 View Repository                    │   │
│ └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│ ┌─ File Browser Panel ──────────────┐ ┌─ Editor Panel ─────────────────────────────┐ │
│ │ [🔄] Configuration Files          │ │ ┌─ Tab Bar ─────────────────────────────────┐ │ │
│ │                                   │ │ │ [values.yaml ×] [Chart.yaml ×] [+ New]   │ │ │
│ │ 📁 customers/                     │ │ └───────────────────────────────────────────┘ │ │
│ │   📁 customer-01/                 │ │                                             │ │
│ │     📄 values.yaml        [Edit]  │ │ ┌─ Editor Toolbar ──────────────────────────┐ │ │
│ │     📄 Chart.yaml         [Edit]  │ │ │ 📄 values.yaml | 🌿 main | ✅ Valid YAML │ │ │
│ │   📁 customer-02/                 │ │ │ [💾 Save] [🔄 Reload] [📋 Format]        │ │ │
│ │     📄 values.yaml        [Edit]  │ │ └───────────────────────────────────────────┘ │ │
│ │ 📁 templates/                     │ │                                             │ │
│ │   📄 deployment.yaml      [Edit]  │ │ ┌─ Monaco Editor ───────────────────────────┐ │ │
│ │   📄 service.yaml         [Edit]  │ │ │ 1  # Default values for myapp             │ │ │
│ │                                   │ │ │ 2  replicaCount: 1                        │ │ │
│ │ [🔍 Search files...]              │ │ │ 3                                         │ │ │
│ │                                   │ │ │ 4  image:                                 │ │ │
│ │ ┌─ Staged Changes ─────────────┐   │ │ │ 5    repository: nginx                    │ │ │
│ │ │ 📝 2 files staged            │   │ │ │ 6    pullPolicy: IfNotPresent             │ │ │
│ │ │ • values.yaml (modified)     │   │ │ │ 7    tag: "1.21"                          │ │ │
│ │ │ • Chart.yaml (modified)      │   │ │ │ 8                                         │ │ │
│ │ │ [📤 Create Pull Request]     │   │ │ │ 9  service:                               │ │ │
│ │ └─────────────────────────────┘   │ │ │ 10   type: ClusterIP                      │ │ │
│ │                                   │ │ │ 11   port: 80                             │ │ │
│ └───────────────────────────────────┘ │ │ ...                                       │ │ │
│                                       │ └───────────────────────────────────────────┘ │ │
│                                       └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Git Sources Section (Top - Full Width)
```
┌─ Git Sources Section ──────────────────────────────────────────────────────────────┐
│ 🌿 Git Sources                                        [Source 1 ▼] [🔄 Refresh]   │
│                                                                                    │
│ ┌─ Current Source Info ──────────────────────────────────────────────────────────┐ │
│ │ 📍 Repository: github.com/myorg/myapp-config                                   │ │
│ │ 🌿 Branch: main                                                                │ │
│ │ 📁 Path: /customers/customer-01                                                │ │
│ │ ✅ Authentication: Connected as john.doe@company.com                           │ │
│ │                                                                                │ │
│ │ 📤 Pull Requests: [3 Open] [View All] | 🔗 [View Repository] [Clone URL]     │ │
│ └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
│ ┌─ Multi-Source Selector (when multiple sources) ───────────────────────────────┐ │
│ │ Source 1: github.com/myorg/myapp-config (/customers/customer-01)      [Active] │ │
│ │ Source 2: github.com/myorg/helm-charts (/charts/myapp)               [Switch] │ │
│ │ Source 3: gitlab.com/myorg/templates (/)                             [Switch] │ │
│ └────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 2. File Browser Panel (Left Side - 30% width)
```
┌─ File Browser ─────────────────────┐
│ [🔄] Configuration Files           │
│ [📁] Browse from root toggle       │
│                                    │
│ 📍 Path: /customers/customer-01    │
│                                    │
│ 📁 Directories:                    │
│   📁 customer-02/          [→]     │
│   📁 templates/            [→]     │
│                                    │
│ 📄 Files:                          │
│   📄 values.yaml           [Edit]  │
│   📄 Chart.yaml            [Edit]  │
│   📄 requirements.yaml     [Edit]  │
│                                    │
│ [🔍 Search files...]               │
│                                    │
│ ┌─ Staged Changes ──────────────┐   │
│ │ 📝 2 files staged             │   │
│ │ • values.yaml (modified)      │   │
│ │ • Chart.yaml (modified)       │   │
│ │ [📤 Create Pull Request]      │   │
│ └───────────────────────────────┘   │
└────────────────────────────────────┘
```

### 2. Editor Panel (Right Side - 70% width)

#### Tab Bar
```
┌─ Tab Bar ──────────────────────────────────────────────────────────────┐
│ [📄 values.yaml ×] [📄 Chart.yaml ×] [📄 deployment.yaml ×] [+ New]    │
│                                                              [⚙️ Settings] │
└────────────────────────────────────────────────────────────────────────┘
```

#### Editor Toolbar
```
┌─ Editor Toolbar ───────────────────────────────────────────────────────┐
│ 📄 values.yaml | 🌿 main | customers/customer-01/values.yaml          │
│                                                                        │
│ Status: [✅ Valid YAML] | [⚠️ 2 warnings] | [❌ Syntax error]         │
│                                                                        │
│ Actions: [💾 Save*] [🔄 Reload] [📋 Format] [🔍 Find] [📝 YAML/Form]  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Monaco Editor Area
```
┌─ Monaco Editor ────────────────────────────────────────────────────────┐
│ Line numbers, syntax highlighting, validation, autocomplete            │
│ Full-featured code editor with YAML/JSON schema support               │
│ Resizable, with minimap toggle, theme switching                       │
└────────────────────────────────────────────────────────────────────────┘
```

## States and Interactions

### Git Sources States

#### Single Source Application
```
┌─ Git Sources Section ──────────────────────────────────────────────────────────────┐
│ 🌿 Git Sources                                                    [🔄 Refresh]     │
│                                                                                    │
│ � geithub.com/myorg/myapp-config | 🌿 main | /customers/customer-01              │
│ ✅ Authenticated | 📤 3 Pull Requests | 🔗 View Repository                        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

#### Multi-Source Application
```
┌─ Git Sources Section ──────────────────────────────────────────────────────────────┐
│ 🌿 Git Sources (3 sources)                           [Source 1 ▼] [🔄 Refresh]   │
│                                                                                    │
│ 📍 github.com/myorg/myapp-config | 🌿 main | /customers/customer-01              │
│ ✅ Authenticated | 📤 3 Pull Requests | 🔗 View Repository                        │
│                                                                                    │
│ ┌─ Source Selector Dropdown ────────────────────────────────────────────────────┐ │
│ │ ✓ Source 1: myapp-config (/customers/customer-01)                    [Active] │ │
│ │   Source 2: helm-charts (/charts/myapp)                             [Switch] │ │
│ │   Source 3: templates (/)                                           [Switch] │ │
│ └────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
```

#### Authentication Required State
```
┌─ Git Sources Section ──────────────────────────────────────────────────────────────┐
│ 🌿 Git Sources                                                    [🔄 Refresh]     │
│                                                                                    │
│ 📍 github.com/myorg/myapp-config | 🌿 main | /customers/customer-01              │
│ 🔒 Authentication Required | [⚙️ Configure] [🔑 Quick Setup]                      │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Initial State (No Files Open)
```
┌─ Git Sources ──────────────────────────────────────────────────────────────────────┐
│ 🌿 github.com/myorg/myapp-config | 🌿 main | /customers/customer-01              │
│ ✅ Authenticated | 📤 3 Pull Requests | 🔗 View Repository                        │
└────────────────────────────────────────────────────────────────────────────────────┘

┌─ File Browser ─────────────┐ ┌─ Welcome Panel ──────────────────────────┐
│ Configuration Files        │ │                                          │
│                           │ │    📁 Select a file to start editing     │
│ 📁 customers/             │ │                                          │
│   📄 values.yaml   [Edit] │ │    • Click [Edit] next to any file       │
│ 📁 templates/             │ │    • Use search to find specific files   │
│   📄 deployment.yaml      │ │    • Browse directories with folder icon │
│                           │ │                                          │
│ [🔍 Search files...]      │ │    💡 Tip: You can open multiple files   │
│                           │ │       in tabs for easier editing         │
└───────────────────────────┘ └──────────────────────────────────────────┘
```

### Single File Open
```
┌─ Git Sources ──────────────────────────────────────────────────────────────────────┐
│ 🌿 github.com/myorg/myapp-config | 🌿 main | /customers/customer-01              │
│ ✅ Authenticated | 📤 3 Pull Requests | 🔗 View Repository                        │
└────────────────────────────────────────────────────────────────────────────────────┘

┌─ File Browser ─────────────┐ ┌─ Editor Panel ──────────────────────────┐
│ Configuration Files        │ │ [📄 values.yaml ×]              [+ New] │
│                           │ │                                          │
│ � custromers/             │ │ 📄 values.yaml | 🌿 main | ✅ Valid     │
│   📄 values.yaml   [📝]   │ │ [💾 Save*] [🔄] [📋] [🔍] [📝 YAML]    │
│ 📁 templates/             │ │                                          │
│   � deploy ment.yaml      │ │ ┌─ Monaco Editor ─────────────────────┐  │
│                           │ │ │ 1  # Default values for myapp       │  │
│ [� Searech files...]      │ │ │ 2  replicaCount: 1                  │  │
│                           │ │ │ 3                                   │  │
│ ┌─ Staged Changes ──────┐  │ │ │ 4  image:                           │  │
│ │ 📝 1 file staged      │  │ │ │ 5    repository: nginx              │  │
│ │ • values.yaml (mod)   │  │ │ │ ...                                 │  │
│ │ [📤 Create PR]        │  │ │ └─────────────────────────────────────┘  │
│ └───────────────────────┘  │ └──────────────────────────────────────────┘
└───────────────────────────┘
```

### Multiple Files Open
```
┌─ Git Sources ──────────────────────────────────────────────────────────────────────┐
│ 🌿 github.com/myorg/myapp-config | 🌿 main | /customers/customer-01              │
│ ✅ Authenticated | 📤 3 Pull Requests | 🔗 View Repository                        │
└────────────────────────────────────────────────────────────────────────────────────┘

┌─ File Browser ─────────────┐ ┌─ Editor Panel ──────────────────────────┐
│ Configuration Files        │ │ [📄 values.yaml] [📄 Chart.yaml ×] [+]  │
│                           │ │                                          │
│ 📁 customers/             │ │ 📄 Chart.yaml | 🌿 main | ⚠️ 1 warning  │
│   � values.iyaml   [📝]   │ │ [💾 Save*] [🔄] [📋] [🔍] [📝 YAML]    │
│   📄 Chart.yaml    [📝]   │ │                                          │
│ 📁 templates/             │ │ ┌─ Monaco Editor ─────────────────────┐  │
│   � depiloyment.yaml      │ │ │ 1  apiVersion: v2                   │  │
│                           │ │ │ 2  name: myapp                      │  │
│ [🔍 Search files...]      │ │ │ 3  description: A Helm chart        │  │
│                           │ │ │ 4  version: 0.1.0                   │  │
│ ┌─ Staged Changes ──────┐  │ │ │ 5  appVersion: "1.16.0"             │  │
│ │ 📝 2 files staged     │  │ │ │ ...                                 │  │
│ │ • values.yaml (mod)   │  │ │ └─────────────────────────────────────┘  │
│ │ • Chart.yaml (mod)    │  │ └──────────────────────────────────────────┘
│ │ [📤 Create PR]        │  │
│ └───────────────────────┘  │
└───────────────────────────┘
```

## Responsive Behavior

### Desktop (>1200px)
- File browser: 30% width (min 300px)
- Editor panel: 70% width
- Resizable splitter between panels

### Tablet (768px - 1200px)
- File browser: Collapsible sidebar (overlay)
- Editor panel: Full width when browser collapsed
- Tab bar may wrap or use dropdown for overflow

### Mobile (<768px)
- File browser: Bottom sheet or full-screen overlay
- Editor panel: Full width
- Tabs become dropdown selector
- Simplified toolbar with essential actions only

## Key Features

### Git Sources Integration
1. **Multi-source support**: Handle applications with multiple Git sources
2. **Source switching**: Easy switching between different repositories/paths
3. **Authentication status**: Clear indication of Git credentials status
4. **Pull request integration**: View and manage PRs directly from the interface
5. **Repository links**: Quick access to view files in the Git provider

### File Editing
6. **Multi-file editing**: Open multiple files in tabs
7. **Persistent state**: Remember open tabs across page refreshes
8. **File tree navigation**: Browse directories and files
9. **Search functionality**: Find files quickly
10. **Staged changes**: Visual indicator of modified files
11. **Validation**: Real-time syntax checking
12. **Form/YAML toggle**: Switch between raw YAML and form view (when schema available)

### User Experience
13. **Keyboard shortcuts**: Standard editor shortcuts (Ctrl+S, Ctrl+F, etc.)
14. **Responsive design**: Works on all screen sizes
15. **Context preservation**: Always know which source/file/path you're editing
16. **Source-aware operations**: All file operations respect the currently selected source

## Technical Implementation Notes

### Git Sources Management
- Maintain selected source state across tab switches
- Filter file browser content based on selected source
- Update breadcrumbs and paths when switching sources
- Handle authentication per source independently

### Editor Integration
- Use React state management for tab state
- Implement lazy loading for file content
- Add keyboard navigation for tabs
- Include unsaved changes warning
- Support drag-and-drop tab reordering
- Add split editor view option for comparing files

### State Management
- Track which source each open tab belongs to
- Maintain staged changes per source/repository
- Preserve tab state when switching between sources
- Handle source switching without losing open tabs

### Responsive Considerations
- Collapse Git Sources section on mobile (show as compact bar)
- Stack source selector and actions vertically on small screens
- Ensure source switching remains accessible on all screen sizes