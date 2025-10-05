import type { ArgoCDApplication } from '@/types/argocd'

/**
 * Information about a Git source in an ArgoCD application
 */
export interface GitSourceInfo {
  index: number
  repoURL: string
  path: string | null
  targetRevision: string
  ref?: string
  displayName: string
  isGitSource: boolean
}

/**
 * Source type from ArgoCD application spec
 */
type ApplicationSource = {
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
}

/**
 * Check if a source is a Git repository (not OCI, not pure Helm chart)
 */
export function isGitSource(source: ApplicationSource): boolean {
  if (!source.repoURL) return false
  
  // Exclude OCI registries
  if (source.repoURL.startsWith('oci://')) return false
  
  // Exclude pure Helm charts (chart without path means it's from a Helm repo, not Git)
  if (source.chart && !source.path) return false
  
  return true
}

/**
 * Extract display name from repository URL
 * e.g., "http://server/scm/test/customer-configs.git" → "customer-configs"
 */
export function getRepoDisplayName(repoURL: string): string {
  // Try to extract repo name from URL
  const match = repoURL.match(/\/([^\/]+?)(?:\.git)?$/)
  if (match) {
    return match[1]
  }
  
  // Fallback to last part of URL
  const parts = repoURL.split('/')
  return parts[parts.length - 1] || repoURL
}

/**
 * Get all Git sources from an ArgoCD application
 * Filters out non-Git sources (OCI, Helm charts)
 */
export function getGitSources(application: ArgoCDApplication): GitSourceInfo[] {
  const sources: GitSourceInfo[] = []
  
  // Handle single source (legacy format)
  if (application.spec.source) {
    const source = application.spec.source
    sources.push({
      index: 0,
      repoURL: source.repoURL,
      path: source.path || null,
      targetRevision: source.targetRevision || 'HEAD',
      ref: source.ref,
      displayName: source.ref || getRepoDisplayName(source.repoURL),
      isGitSource: isGitSource(source)
    })
  }
  
  // Handle multiple sources (new format)
  if (application.spec.sources) {
    application.spec.sources.forEach((source, index) => {
      sources.push({
        index,
        repoURL: source.repoURL,
        path: source.path || null,
        targetRevision: source.targetRevision || 'HEAD',
        ref: source.ref,
        displayName: source.ref || getRepoDisplayName(source.repoURL),
        isGitSource: isGitSource(source)
      })
    })
  }
  
  // Filter to only Git sources
  return sources.filter(s => s.isGitSource)
}

/**
 * Get the primary Git source (first Git source found)
 * Used as default when no source is selected
 */
export function getPrimaryGitSource(application: ArgoCDApplication): GitSourceInfo | null {
  const gitSources = getGitSources(application)
  return gitSources.length > 0 ? gitSources[0] : null
}

/**
 * Check if application has multiple Git sources
 */
export function hasMultipleGitSources(application: ArgoCDApplication): boolean {
  return getGitSources(application).length > 1
}
