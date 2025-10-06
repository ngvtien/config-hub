# Focused File Types - The 80/20 Rule

## Reality Check

**What users actually edit 95% of the time:**
- `values.yaml` - Helm values (most common)
- `external-secrets.yaml` - Secret references
- `values.schema.json` - Validation schema
- `external-secrets.schema.json` - Secret schema

**What users rarely edit:**
- K8s resource YAMLs (deployments, services, etc.)
- Only during initial setup
- Then mostly forgotten

## Optimized Configuration Tab

### Focus on the Common Files

```
┌────────────────────────────────────────────────────────────────┐
│  [Overview] [Source] [Configuration] [Pull Requests]           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📄 Configuration                                               │
│                                                                 │
│  Source: 🟦 main branch • Last updated: 2 hours ago            │
│                                                                 │
│  ┌─ Primary Files (Quick Access) ───────────────────────────┐  │
│  │                                                            │  │
│  │  📊 values.yaml                                           │  │
│  │     Helm configuration values                             │  │
│  │     Last edited: 2 hours ago by ngvtien                   │  │
│  │     [Edit] [View Diff] [History]                         │  │
│  │                                                            │  │
│  │  🔐 external-secrets.yaml                                 │  │
│  │     Secret references (2 secrets)                         │  │
│  │     Last edited: 1 day ago by ngvtien                     │  │
│  │     [Edit with Secret Manager] [View YAML] [History]     │  │
│  │                                                            │  │
│  │  📋 values.schema.json                                    │  │
│  │     Validation schema for values                          │  │
│  │     [Edit] [Validate]                                     │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Other Files (Collapsed by default) ─────────────────────┐  │
│  │  [▶ Show all files] (12 files)                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Create Pull Request]                                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Smart File Detection

### Auto-Promote Important Files

```typescript
interface FileImportance {
  priority: 'primary' | 'secondary' | 'other'
  reason: string
}

function getFilePriority(filename: string): FileImportance {
  // Primary files - always show at top
  if (filename === 'values.yaml') {
    return { priority: 'primary', reason: 'Main Helm values' }
  }
  if (filename.includes('external-secret')) {
    return { priority: 'primary', reason: 'Secret configuration' }
  }
  if (filename.endsWith('.schema.json')) {
    return { priority: 'primary', reason: 'Validation schema' }
  }
  
  // Secondary files - show if recently edited
  if (isRecentlyEdited(filename)) {
    return { priority: 'secondary', reason: 'Recently edited' }
  }
  
  // Everything else - collapsed by default
  return { priority: 'other', reason: 'Other files' }
}
```

## File Type Handlers

### values.yaml - Enhanced YAML Editor
```
┌────────────────────────────────────────────────────────────────┐
│  Edit: values.yaml                                 [✕]         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────┬────────────────────────────────┐   │
│  │ Editor                 │ Preview & Validation            │   │
│  ├────────────────────────┼────────────────────────────────┤   │
│  │ replicaCount: 3        │ ✅ Valid YAML                  │   │
│  │                        │ ✅ Schema validation passed    │   │
│  │ image:                 │                                 │   │
│  │   repository: nginx    │ Changes:                        │   │
│  │   tag: "1.21"          │ • replicaCount: 2 → 3          │   │
│  │                        │ • image.tag: 1.20 → 1.21       │   │
│  │ resources:             │                                 │   │
│  │   limits:              │ Affected Resources:             │   │
│  │     memory: 512Mi      │ • Deployment/app               │   │
│  │     cpu: 500m          │ • HPA/app-hpa                  │   │
│  │                        │                                 │   │
│  └────────────────────────┴────────────────────────────────┘   │
│                                                                 │
│  [Cancel] [Save & Create PR]                                   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### external-secrets.yaml - Smart Secret Manager
```
┌────────────────────────────────────────────────────────────────┐
│  Edit: external-secrets.yaml                       [✕]         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔐 Secret Manager Mode                                        │
│                                                                 │
│  [Secret Manager View] [Raw YAML View]                         │
│                                                                 │
│  ┌─ Secrets ─────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  api-keys                                                 │ │
│  │  ├─ Vault: secret/platform/api-keys                      │ │
│  │  ├─ stripe_key → STRIPE_API_KEY                          │ │
│  │  ├─ sendgrid_key → SENDGRID_API_KEY                      │ │
│  │  └─ jwt_secret → JWT_SECRET                              │ │
│  │  [Edit Mappings]                                          │ │
│  │                                                            │ │
│  │  database-credentials                                     │ │
│  │  ├─ Vault: secret/platform/database                      │ │
│  │  ├─ username → DB_USER                                   │ │
│  │  └─ password → DB_PASSWORD                               │ │
│  │  [Edit Mappings]                                          │ │
│  │                                                            │ │
│  │  [+ Add Secret]                                           │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Cancel] [Save & Create PR]                                   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### values.schema.json - Schema Editor
```
┌────────────────────────────────────────────────────────────────┐
│  Edit: values.schema.json                          [✕]         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 JSON Schema Editor                                         │
│                                                                 │
│  ┌────────────────────────┬────────────────────────────────┐   │
│  │ Schema                 │ Validation                      │   │
│  ├────────────────────────┼────────────────────────────────┤   │
│  │ {                      │ ✅ Valid JSON Schema           │   │
│  │   "type": "object",    │                                 │   │
│  │   "properties": {      │ Testing against values.yaml:   │   │
│  │     "replicaCount": {  │ ✅ All fields valid            │   │
│  │       "type": "number",│ ✅ No missing required fields  │   │
│  │       "minimum": 1     │                                 │   │
│  │     }                  │                                 │   │
│  │   }                    │                                 │   │
│  │ }                      │                                 │   │
│  └────────────────────────┴────────────────────────────────┘   │
│                                                                 │
│  [Cancel] [Save & Create PR]                                   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Workflow Optimization

### 95% Use Case: Edit values.yaml
```
1. User opens Configuration tab
2. Sees values.yaml at top (always)
3. Clicks [Edit]
4. Makes changes
5. Sees validation + preview
6. Clicks [Save & Create PR]
7. Done in < 30 seconds
```

### 4% Use Case: Edit External Secrets
```
1. User opens Configuration tab
2. Sees external-secrets.yaml at top
3. Clicks [Edit with Secret Manager]
4. Smart UI for mappings
5. Validates Vault paths
6. Clicks [Save & Create PR]
7. Done
```

### 1% Use Case: Edit Other Files
```
1. User opens Configuration tab
2. Clicks [Show all files]
3. Finds file in list
4. Edits as needed
5. Creates PR
```

## File Organization

### Primary Files (Always Visible)
```
📊 values.yaml              ← 80% of edits
🔐 external-secrets.yaml    ← 15% of edits
📋 values.schema.json       ← 4% of edits
📋 external-secrets.schema.json
```

### Secondary Files (Show if Recently Edited)
```
📄 config/app.yaml
📄 config/database.yaml
📄 Chart.yaml
```

### Other Files (Collapsed)
```
[▶ Show all files] (12 files)
├─ templates/deployment.yaml
├─ templates/service.yaml
├─ templates/ingress.yaml
└─ ... (K8s resources, rarely edited)
```

## Smart Defaults

### On First Load
```typescript
async function loadConfigurationTab(app: ArgoCDApplication) {
  // Always show these
  const primaryFiles = [
    'values.yaml',
    'external-secrets.yaml',
    'values.schema.json',
    'external-secrets.schema.json'
  ]
  
  // Show if edited in last 7 days
  const recentFiles = await getRecentlyEditedFiles(app, 7)
  
  // Everything else collapsed
  const otherFiles = await getAllOtherFiles(app)
  
  return {
    primary: primaryFiles,
    recent: recentFiles,
    other: otherFiles
  }
}
```

## Benefits

### For Users
- ✅ No hunting for values.yaml
- ✅ Common files always visible
- ✅ Rare files don't clutter UI
- ✅ Fast access to what matters

### For UX
- ✅ Clean, focused interface
- ✅ Progressive disclosure
- ✅ Smart defaults
- ✅ Optimized for common case

### For Development
- ✅ Clear priorities
- ✅ Focus on important editors
- ✅ Simple file detection
- ✅ Easy to extend

## Implementation Priority

### Phase 1: Core Files
1. ✅ values.yaml editor (YAML with validation)
2. ✅ File list with smart ordering
3. ✅ Basic edit → PR flow

### Phase 2: Smart Features
4. ⏭️ Schema validation
5. ⏭️ Preview changes
6. ⏭️ Recently edited detection

### Phase 3: External Secrets
7. ⏭️ Detect external-secrets.yaml
8. ⏭️ Smart secret manager UI
9. ⏭️ Vault integration

## Summary

**Focus on the 80%:**
- values.yaml is king 👑
- external-secrets.yaml is important 🔐
- Schema files for validation 📋
- Everything else is secondary 📁

**UI Reflects Reality:**
- Primary files always visible
- Recent files promoted
- Other files collapsed
- Smart, not cluttered

This matches how users actually work! 🎯
