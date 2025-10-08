// ArgoCD API Types
export interface ArgoCDApplication {
  metadata: {
    name: string
    namespace: string
    uid: string
    resourceVersion: string
    generation: number
    creationTimestamp: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
    ownerReferences?: Array<{
      apiVersion: string
      kind: string
      name: string
      uid: string
      controller?: boolean
      blockOwnerDeletion?: boolean
    }>
  }
  spec: {
    project: string
    // Single source (legacy)
    source?: {
      repoURL: string
      path?: string
      targetRevision: string
      chart?: string
      helm?: {
        parameters?: Array<{
          name: string
          value: string
        }>
        valueFiles?: string[]
        values?: string
      }
      ref?: string
    }
    // Multi-source (new format)
    sources?: Array<{
      repoURL: string
      path?: string
      targetRevision?: string
      chart?: string
      helm?: {
        parameters?: Array<{
          name: string
          value: string
        }>
        valueFiles?: string[]
        values?: string
      }
      ref?: string
    }>
    destination: {
      server: string
      namespace: string
    }
    syncPolicy?: {
      automated?: {
        prune: boolean
        selfHeal: boolean
      }
      syncOptions?: string[]
    }
  }
  status: {
    sync: {
      status: 'Synced' | 'OutOfSync' | 'Unknown'
      comparedTo: {
        source: {
          repoURL: string
          path: string
          targetRevision: string
        }
        destination: {
          server: string
          namespace: string
        }
      }
      revision: string
    }
    health: {
      status: 'Healthy' | 'Progressing' | 'Degraded' | 'Suspended' | 'Missing' | 'Unknown'
      message?: string
    }
    resources?: Array<{
      version: string
      kind: string
      namespace: string
      name: string
      status: string
      health?: {
        status: string
        message?: string
      }
    }>
    conditions?: Array<{
      type: string
      message: string
      lastTransitionTime: string
    }>
    operationState?: {
      operation: {
        sync: {
          revision: string
        }
      }
      phase: 'Running' | 'Succeeded' | 'Failed' | 'Error' | 'Terminating'
      message?: string
      startedAt: string
      finishedAt?: string
    }
  }
}

export interface ArgoCDApplicationList {
  metadata: {
    resourceVersion: string
  }
  items: ArgoCDApplication[]
}

export interface ArgoCDApplicationLogs {
  content: string
  timeStamp: string
  last: boolean
  // Optional wrapper format from API
  result?: {
    content: string
    timeStamp?: string
    timeStampStr?: string
    last?: boolean
  }
}

export interface ArgoCDApplicationEvents {
  metadata: {
    name: string
    namespace: string
    creationTimestamp: string
  }
  involvedObject: {
    kind: string
    name: string
    namespace: string
  }
  reason: string
  message: string
  source: {
    component: string
  }
  firstTimestamp: string
  lastTimestamp: string
  count: number
  type: 'Normal' | 'Warning'
}

export interface ArgoCDRepository {
  repo: string
  username?: string
  password?: string
  sshPrivateKey?: string
  insecure?: boolean
  enableLfs?: boolean
  tlsClientCertData?: string
  tlsClientCertKey?: string
  type?: string
  name?: string
  inheritedCreds?: boolean
}

export interface HelmParameter {
  name: string
  value: string
  forceString?: boolean
}

export interface ApplicationFilter {
  productName?: string
  customerName?: string
  version?: string
  environment?: string
  syncStatus?: string
  healthStatus?: string
}

export interface ApplicationSearchResult {
  application: ArgoCDApplication
  productName?: string
  customerName?: string
  version?: string
  matchScore: number
}

// Helper function to get source info from either single or multi-source apps
export function getApplicationSource(app: ArgoCDApplication) {
  // Return single source if it exists
  if (app.spec.source) {
    return app.spec.source
  }
  // Return first source from multi-source array
  if (app.spec.sources && app.spec.sources.length > 0) {
    return app.spec.sources[0]
  }
  // Fallback to empty object
  return {
    repoURL: '',
    path: '',
    targetRevision: ''
  }
}

// Helper to get target revision safely
export function getTargetRevision(app: ArgoCDApplication): string {
  const source = getApplicationSource(app)
  return source.targetRevision || ''
}