# Architecture Diagrams

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Bitbucket Server                            │
│                  http://localhost:7990/TEST                     │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐     │
│  │ platform-infrastructure  │  │   customer-configs       │     │
│  │                          │  │                          │     │
│  │ • Helm Charts            │  │ • Customer Values        │     │
│  │ • ApplicationSets        │  │ • Secrets (encrypted)    │     │
│  │ • Base Manifests         │  │ • Terraform Configs      │     │
│  └──────────────────────────┘  └──────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    │                           │
                    ▼                           ▼
┌────────────────────────────────────────────────────────────────┐
│                         ArgoCD                                 │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           ApplicationSet Controller                    │    │
│  │                                                        │    │
│  │  Watches Git repos → Generates Applications            │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                    │
│                           ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Generated Applications                    │    │
│  │                                                        │    │
│  │  • customer-01-product-a                               │    │
│  │  • customer-01-product-b                               │    │
│  │  • customer-02-product-a                               │    │
│  │  • customer-03-product-a                               │    │
│  │  • ... (auto-generated for each customer-product)      │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ customer-01  │  │ customer-02  │  │ customer-03  │           │
│  │ namespace    │  │ namespace    │  │ namespace    │           │
│  │              │  │              │  │              │           │
│  │ • product-a  │  │ • product-a  │  │ • product-a  │           │
│  │ • product-b  │  │ • product-c  │  │ • product-b  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Repository Structure Detail

```
┌─────────────────────────────────────────────────────────────────┐
│                    customer-configs Repository                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  customers/                                                     │
│  ├── customer-01/                                               │
│  │   ├── metadata.yaml          ← Customer info                 │
│  │   ├── products.yaml          ← Enabled products              │
│  │   ├── product-a/                                             │
│  │   │   ├── values.yaml        ← Helm values                   │
│  │   │   ├── values.schema.json ← Validation                    │
│  │   │   ├── secrets.yaml       ← Encrypted secrets             │
│  │   │   └── environments/                                      │
│  │   │       ├── dev.yaml       ← Dev overrides                 │
│  │   │       ├── staging.yaml   ← Staging overrides             │
│  │   │       └── prod.yaml      ← Prod overrides                │
│  │   ├── product-b/                                             │
│  │   │   └── values.yaml                                        │
│  │   ├── terraform/             ← Customer infrastructure       │
│  │   │   ├── main.tf                                            │
│  │   │   └── variables.tf                                       │
│  │   └── configs/               ← Other configs                 │
│  │       └── feature-flags.yaml                                 │
│  ├── customer-02/                                               │
│  └── customer-03/                                               │
│                                                                 │
│  products/                      ← Product defaults              │
│  ├── product-a/                                                 │
│  │   ├── base-values.yaml       ← Default values                │
│  │   ├── values.schema.json     ← Schema                        │
│  │   └── environments/                                          │
│  │       ├── dev.yaml                                           │
│  │       ├── staging.yaml                                       │
│  │       └── prod.yaml                                          │
│  ├── product-b/                                                 │
│  └── product-c/                                                 │
│                                                                 │
│  shared/                        ← Shared resources              │
│  ├── terraform-modules/         ← Reusable TF modules           │
│  └── common-secrets/            ← Shared secrets                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                platform-infrastructure Repository               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  applicationsets/               ← ApplicationSet definitions    │
│  ├── 11-product-customer-matrix-set.yaml                        │
│  ├── 12-product-by-environment-set.yaml                         │
│  ├── 13-customer-product-list-set.yaml                          │
│  ├── 14-customer-with-secrets-set.yaml                          │
│  └── 15-terraform-infrastructure-set.yaml                       │
│                                                                 │
│  products/                      ← Helm charts                   │
│  ├── product-a/                                                 │
│  │   ├── Chart.yaml             ← Helm chart metadata           │
│  │   ├── values.yaml            ← Default values                │
│  │   └── templates/             ← K8s manifests                 │
│  │       ├── deployment.yaml                                    │
│  │       ├── service.yaml                                       │
│  │       └── ingress.yaml                                       │
│  ├── product-b/                                                 │
│  └── product-c/                                                 │
│                                                                 │
│  base-manifests/                ← Shared manifests              │
│  ├── databases/                                                 │
│  └── monitoring/                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Value Merge Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Value Merge Order                          │
└─────────────────────────────────────────────────────────────────┘

Step 1: Product Base Values
┌──────────────────────────────────────┐
│ products/product-a/base-values.yaml  │
│                                      │
│ replicaCount: 1                      │
│ cpu: 50m                             │
│ memory: 64Mi                         │
└──────────────────────────────────────┘
              │
              ▼
Step 2: Product Environment Defaults
┌──────────────────────────────────────┐
│ products/product-a/environments/     │
│   prod.yaml                          │
│                                      │
│ replicaCount: 3                      │  ← Overrides base
│ cpu: 200m                            │  ← Overrides base
└──────────────────────────────────────┘
              │
              ▼
Step 3: Customer Product Values
┌──────────────────────────────────────┐
│ customers/customer-01/product-a/     │
│   values.yaml                        │
│                                      │
│ replicaCount: 5                      │  ← Overrides env
│ memory: 512Mi                        │  ← Overrides base
└──────────────────────────────────────┘
              │
              ▼
Step 4: Customer Environment Overrides
┌──────────────────────────────────────┐
│ customers/customer-01/product-a/     │
│   environments/prod.yaml             │
│                                      │
│ cpu: 500m                            │  ← Final override
└──────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│         Final Merged Values          │
│                                      │
│ replicaCount: 5                      │  ← From customer
│ cpu: 500m                            │  ← From customer env
│ memory: 512Mi                        │  ← From customer
└──────────────────────────────────────┘
```

## ApplicationSet Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  ApplicationSet Controller                      │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Git Generator                                │
│                                                                 │
│  Watches: customers/*/*/values.yaml                             │
│                                                                 │
│  Finds:                                                         │
│  • customers/customer-01/product-a/values.yaml                  │
│  • customers/customer-01/product-b/values.yaml                  │
│  • customers/customer-02/product-a/values.yaml                  │
│  • customers/customer-03/product-a/values.yaml                  │
│  • customers/customer-03/product-c/values.yaml                  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Template Processing                            │
│                                                                 │
│  For each file found:                                           │
│  • Extract customer name (path[1])                              │
│  • Extract product name (path[2])                               │
│  • Generate Application manifest                                │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                  Generated Applications                        │
│                                                                │
│  ┌────────────────────────────────────────────────┐            │
│  │ Application: customer-01-product-a             │            │
│  │ Namespace: customer-01-product-a               │            │
│  │ Sources:                                       │            │
│  │   - platform-infrastructure/products/product-a │            │
│  │   - customer-configs (values)                  │            │
│  └────────────────────────────────────────────────┘            │
│                                                                │
│  ┌────────────────────────────────────────────────┐            │
│  │ Application: customer-01-product-b             │            │
│  │ Namespace: customer-01-product-b               │            │
│  │ Sources:                                       │            │
│  │   - platform-infrastructure/products/product-b │            │
│  │   - customer-configs (values)                  │            │
│  └────────────────────────────────────────────────┘            │
│                                                                │
│  ... (one per customer-product combination)                    │
└────────────────────────────────────────────────────────────────┘
```

## Multi-Environment Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Git Branches Strategy                        │
└─────────────────────────────────────────────────────────────────┘

platform-infrastructure repo:
┌──────────┐      ┌──────────┐      ┌──────────┐
│ develop  │ ──▶ │ staging  │ ───▶ │   main  │
│ (dev)    │      │          │      │  (prod)  │
└──────────┘      └──────────┘      └──────────┘
     │                 │                  │
     ▼                 ▼                  ▼
┌──────────┐      ┌──────────┐      ┌──────────┐
│   Dev    │      │ Staging  │      │   Prod   │
│ Cluster  │      │ Cluster  │      │ Cluster  │
└──────────┘      └──────────┘      └──────────┘

ApplicationSet uses branch name in targetRevision:
• dev → develop branch
• staging → staging branch
• prod → main branch

Auto-sync:
• dev: enabled
• staging: enabled
• prod: disabled (manual approval)
```

## Customer Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    New Customer Onboarding                      │
└─────────────────────────────────────────────────────────────────┘

Step 1: Create Customer Directory
┌──────────────────────────────────────┐
│ mkdir customers/customer-04          │
└──────────────────────────────────────┘
              │
              ▼
Step 2: Add Metadata
┌──────────────────────────────────────┐
│ Create metadata.yaml                 │
│ Create products.yaml                 │
└──────────────────────────────────────┘
              │
              ▼
Step 3: Configure Products
┌──────────────────────────────────────┐
│ mkdir customers/customer-04/product-a│
│ Create values.yaml                   │
│ Create secrets.yaml (encrypted)      │
└──────────────────────────────────────┘
              │
              ▼
Step 4: Add Infrastructure (Optional)
┌──────────────────────────────────────┐
│ mkdir customers/customer-04/terraform│
│ Create main.tf                       │
└──────────────────────────────────────┘
              │
              ▼
Step 5: Commit and Push
┌──────────────────────────────────────┐
│ git add customers/customer-04        │
│ git commit -m "Add customer-04"      │
│ git push                             │
└──────────────────────────────────────┘
              │
              ▼
Step 6: Automatic Deployment
┌──────────────────────────────────────┐
│ ApplicationSet detects new files     │
│ Generates Application manifests      │
│ ArgoCD syncs to cluster              │
│ Customer-04 is live!                 │
└──────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                            │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Git Repository Access
┌──────────────────────────────────────┐
│ Bitbucket RBAC                       │
│ • Read-only for ArgoCD               │
│ • Write access for DevOps team       │
│ • Branch protection rules            │
└──────────────────────────────────────┘
              │
              ▼
Layer 2: Secret Encryption
┌──────────────────────────────────────┐
│ SOPS / Sealed Secrets / Vault        │
│ • Secrets encrypted at rest          │
│ • Decryption keys in K8s only        │
│ • No plain-text secrets in Git       │
└──────────────────────────────────────┘
              │
              ▼
Layer 3: Kubernetes RBAC
┌──────────────────────────────────────┐
│ Namespace Isolation                  │
│ • One namespace per customer         │
│ • Network policies                   │
│ • Resource quotas                    │
└──────────────────────────────────────┘
              │
              ▼
Layer 4: ArgoCD RBAC
┌──────────────────────────────────────┐
│ Application-level Access             │
│ • Customer teams see only their apps │
│ • Read-only for most users           │
│ • Sync permissions controlled        │
└──────────────────────────────────────┘
```

## Scaling Considerations

```
Current: 20 Customers
┌────────────────────────────────┐
│ Single customer-configs repo   │
│ • Fast git operations          │
│ • Easy to manage               │
│ • Simple structure             │
└────────────────────────────────┘

Future: 100+ Customers
┌────────────────────────────────┐
│ Option 1: Monorepo with tools  │
│ • Use Git LFS for large files  │
│ • Implement sparse checkout    │
│ • Add caching layer            │
└────────────────────────────────┘

┌────────────────────────────────┐
│ Option 2: Split by region/tier │
│ • customer-configs-us-east     │
│ • customer-configs-eu-west     │
│ • customer-configs-premium     │
└────────────────────────────────┘

┌────────────────────────────────┐
│ Option 3: Database-backed      │
│ • Store configs in database    │
│ • Generate Git commits via API │
│ • Use ArgoCD ApplicationSet    │
│   with API generator           │
└────────────────────────────────┘
```

## Multi-Source Applications

ArgoCD supports multiple sources in a single Application, allowing you to combine resources from different Git repositories.

### Number of Sources

**No hard limit** - You can use as many sources as needed, though 2-3 is optimal for most use cases.

### Common Patterns

#### 2 Sources (Most Common)
```
Source 1: Helm Chart Repository
Source 2: Values Repository (referenced as $values)

Example:
┌─────────────────────────────────────────────────────────────────┐
│                    Application Manifest                         │
├─────────────────────────────────────────────────────────────────┤
│ sources:                                                        │
│   - repoURL: platform-infrastructure.git                        │
│     path: products/product-a                                    │
│     helm:                                                       │
│       valueFiles:                                               │
│         - $values/products/product-a/base-values.yaml           │
│         - $values/customers/customer-01/product-a/values.yaml   │
│                                                                 │
│   - repoURL: customer-configs.git                               │
│     ref: values                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3 Sources
```
Source 1: Helm Chart
Source 2: Base Configuration
Source 3: Customer Configuration

Example Use Case:
- Shared base values for all customers
- Customer-specific overrides
- Helm chart from separate repo
```

#### 4+ Sources (Advanced)
```
Source 1: Helm Chart
Source 2: Base Config
Source 3: Environment Config (dev/staging/prod)
Source 4: Customer Config
Source 5: Secrets (optional)

Example Use Case:
- Complex multi-tenant with environment promotion
- Separate secrets management
- Layered configuration strategy
```

### Value Merge Order with Multi-Source

```
┌─────────────────────────────────────────────────────────────────┐
│                    Helm Value Precedence                        │
└─────────────────────────────────────────────────────────────────┘

1. Chart's values.yaml (lowest priority)
   ↓
2. valueFiles from $base reference
   ↓
3. valueFiles from $env reference
   ↓
4. valueFiles from $customer reference
   ↓
5. Inline values in Application spec (highest priority)
```

### Performance Considerations

| Sources | Git Fetches | Complexity | Recommended For |
|---------|-------------|------------|-----------------|
| 1       | 1           | Simple     | Single repo setups |
| 2       | 2           | Optimal    | Chart + values separation |
| 3       | 3           | Moderate   | Base + env + customer |
| 4+      | 4+          | Complex    | Advanced scenarios only |

### Best Practices

1. **Keep it simple**: 2-3 sources covers most use cases
2. **Name refs clearly**: Use descriptive names like `$base`, `$customer`, `$secrets`
3. **Document the order**: Make value precedence clear in your docs
4. **Consider performance**: Each source adds a Git fetch operation
5. **Test thoroughly**: Multi-source can be harder to debug

### Example: Our Setup

```
┌─────────────────────────────────────────────────────────────────┐
│              2-Source Pattern (Recommended)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Source 1: platform-infrastructure                              │
│  ├── products/product-a/                                        │
│  │   ├── Chart.yaml                                             │
│  │   ├── values.yaml (defaults)                                 │
│  │   └── templates/                                             │
│  │       ├── deployment.yaml                                    │
│  │       └── service.yaml                                       │
│                                                                 │
│  Source 2: customer-configs ($values)                           │
│  ├── products/product-a/                                        │
│  │   └── base-values.yaml                                       │
│  └── customers/customer-01/product-a/                           │
│      └── values.yaml                                            │
│                                                                 │
│  Result: Helm renders with layered values                       │
│  1. Chart defaults                                              │
│  2. Product base values                                         │
│  3. Customer overrides                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

These diagrams provide a visual understanding of the architecture, flows, and relationships between components.
