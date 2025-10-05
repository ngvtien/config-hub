# Multi-Source Repository Support Issue

## Problem Statement

The current implementation of both `PRStatusSection` and `ConfigFilesSection` only handles the **first Git source** in ArgoCD applications with multiple sources. This causes significant functionality gaps for multi-source applications.

## Current Behavior

Both components use this pattern:

```typescript
const getRepoUrl = (): string | null => {
  if (application.spec.source) {
    return application.spec.source.repoURL
  }
  if (application.spec.sources && application.spec.sources.length > 0) {
    return application.spec.sources[0].repoURL  // ⚠️ Only first source!
  }
  return null
}
```

**Impact:**
- PRs from secondary sources are not displayed
- Configuration files from secondary sources cannot be browsed or edited
- Users cannot manage configurations stored in additional repositories

## Real-World Example

### ApplicationSet Configuration

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: product-customer-deployments
  namespace: argocd
spec:
  generators:
  - git:
      repoURL: http://172.27.161.37:7990/scm/test/customer-configs.git
      revision: main
      files:
      - path: customers/*/*/values.yaml
  template:
    metadata:
      name: '{{path[1]}}-{{path[2]}}'
    spec:
      project: default
      sources:
      - repoURL: http://helm-repo/charts/product-chart  # Source 1: Helm chart
        chart: product-chart
        targetRevision: 1.0.0
      - repoURL: http://172.27.161.37:7990/scm/test/customer-configs.git  # Source 2: Values
        targetRevision: main
        path: customers/{{path[1]}}/{{path[2]}}
        ref: values
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{path[1]}}-{{path[2]}}'
```

### Generated Application Structure

The ApplicationSet generates apps like `customer-01-product-a` with:

1. **Source 1** (Primary): Helm chart repository
   - Type: Helm chart (OCI or HTTP)
   - Contains: Base application templates
   - Not editable in Config Hub (chart source)

2. **Source 2** (Additional): Customer configs repository
   - Type: Git repository
   - Contains: Customer-specific `values.yaml` files
   - Path: `customers/customer-01/product-a/`
   - **This is what users need to edit!**

### Current Problem

- **PR Status Section**: Only shows PRs from Source 1 (Helm chart repo)
  - Misses PRs for customer config changes in Source 2
  - Users can't see configuration change requests

- **Config Files Section**: Only browses Source 1 (Helm chart repo)
  - Can't access `values.yaml` files in Source 2
  - Users can't edit customer configurations

## Expected Behavior

### 1. Source Detection and Filtering

The system should:
- Detect all sources in the application
- Filter to only **Git sources** (exclude OCI, Helm charts without Git)
- Identify which sources contain editable configuration files

### 2. Multi-Source UI

When multiple Git sources exist:

```
┌─────────────────────────────────────────────────────────────┐
│ 📁 Git Sources                                    [Refresh] │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Source Selector:  [Source 1: Helm Chart ▼]              ││
│ │                   [Source 2: Customer Configs ✓]        ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Currently viewing: customer-configs.git                      │
│ Path: customers/customer-01/product-a                        │
│                                                              │
│ 📄 values.yaml                              [Edit]          │
│ 📄 secrets.yaml                             [Edit]          │
└─────────────────────────────────────────────────────────────┘
```

### 3. PR Status with Source Indicators

```
┌─────────────────────────────────────────────────────────────┐
│ 🔀 Pull Requests                                  [Refresh] │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ #123: Update customer-01 values                          ││
│ │ [customer-configs] john.doe → main                       ││
│ │ ✓ 2 approvals                                            ││
│ ├──────────────────────────────────────────────────────────┤│
│ │ #124: Upgrade product-a chart                            ││
│ │ [helm-charts] jane.smith → main                          ││
│ │ ⏱ Pending review                                         ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Implementation Requirements

### Task 15.6: Add Multi-Source Repository Support

#### 1. Update Source Detection Logic

Create a helper function to extract all Git sources:

```typescript
interface GitSourceInfo {
  index: number
  repoURL: string
  path: string | null
  targetRevision: string
  ref?: string
  displayName: string
}

function getGitSources(application: ArgoCDApplication): GitSourceInfo[] {
  const sources: GitSourceInfo[] = []
  
  // Handle single source
  if (application.spec.source) {
    const source = application.spec.source
    if (isGitSource(source)) {
      sources.push({
        index: 0,
        repoURL: source.repoURL,
        path: source.path || null,
        targetRevision: source.targetRevision || 'HEAD',
        ref: source.ref,
        displayName: getRepoDisplayName(source.repoURL)
      })
    }
  }
  
  // Handle multiple sources
  if (application.spec.sources) {
    application.spec.sources.forEach((source, index) => {
      if (isGitSource(source)) {
        sources.push({
          index,
          repoURL: source.repoURL,
          path: source.path || null,
          targetRevision: source.targetRevision || 'HEAD',
          ref: source.ref,
          displayName: source.ref || getRepoDisplayName(source.repoURL)
        })
      }
    })
  }
  
  return sources
}

function isGitSource(source: any): boolean {
  // Exclude OCI registries and pure Helm charts
  if (!source.repoURL) return false
  if (source.repoURL.startsWith('oci://')) return false
  if (source.chart && !source.path) return false  // Helm chart without Git path
  return true
}

function getRepoDisplayName(repoURL: string): string {
  // Extract repo name from URL
  // e.g., "http://server/scm/test/customer-configs.git" → "customer-configs"
  const match = repoURL.match(/\/([^\/]+?)(?:\.git)?$/)
  return match ? match[1] : repoURL
}
```

#### 2. Update PRStatusSection Component

```typescript
export function PRStatusSection({ application }: PRStatusSectionProps) {
  const gitSources = getGitSources(application)
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0)
  const [pullRequestsBySource, setPullRequestsBySource] = useState<Map<number, PullRequest[]>>(new Map())
  
  // Fetch PRs for all Git sources
  useEffect(() => {
    gitSources.forEach(async (source) => {
      const credentials = await findCredentials(source.repoURL)
      if (credentials) {
        const prs = await fetchPullRequests(credentials.id, source.path)
        setPullRequestsBySource(prev => new Map(prev).set(source.index, prs))
      }
    })
  }, [gitSources])
  
  // Show source selector if multiple Git sources
  if (gitSources.length > 1) {
    return (
      <>
        <SourceSelector 
          sources={gitSources}
          selected={selectedSourceIndex}
          onChange={setSelectedSourceIndex}
        />
        <PRList 
          pullRequests={pullRequestsBySource.get(selectedSourceIndex) || []}
          sourceName={gitSources[selectedSourceIndex].displayName}
        />
      </>
    )
  }
  
  // Single source - existing behavior
  // ...
}
```

#### 3. Update ConfigFilesSection Component

Similar pattern:
- Detect all Git sources
- Show source selector if multiple
- Browse files from selected source
- Indicate current source in file paths

#### 4. Add Source Indicator Badges

For PRs and files, show which source they belong to:

```typescript
<Badge variant="outline" className="text-xs">
  {source.displayName}
</Badge>
```

## Benefits

1. **Full Functionality**: Users can manage configurations in all Git sources
2. **Clear Context**: Source indicators prevent confusion about which repo is being modified
3. **Flexibility**: Supports complex multi-source patterns (Helm + values, multiple config repos)
4. **Requirement Compliance**: Addresses Requirement 7.1 (multi-repository support)

## Testing Scenarios

1. **Single Git Source**: Existing behavior unchanged
2. **Multiple Git Sources**: Source selector appears, all sources accessible
3. **Mixed Sources** (Git + OCI): Only Git sources shown
4. **Helm Chart + Values**: Values repo is editable, chart repo is not
5. **No Git Sources**: Appropriate message displayed

## Related Requirements

- **Requirement 7.1**: Handle different repositories independently
- **Requirement 7.3**: Create PRs in correct repository
- **Requirement 8.3**: Only show files within application's path (per source)

## Priority

**HIGH** - This is a critical gap that prevents the feature from working correctly with common ArgoCD patterns (Helm chart + values repository).
