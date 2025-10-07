/**
 * File Priority Service
 * 
 * Determines the importance/priority of configuration files
 * to help organize and display them appropriately in the UI.
 */

export type FilePriority = 'primary' | 'secondary' | 'other'

export interface FileImportance {
  priority: FilePriority
  reason: string
  icon: string
  order: number // For sorting within priority groups
}

/**
 * Primary files are the most commonly edited configuration files
 * that should always be visible and easily accessible.
 */
const PRIMARY_FILE_PATTERNS = [
  { pattern: /^values\.ya?ml$/i, reason: 'Helm values file', icon: '⚙️', order: 1 },
  { pattern: /^values-.*\.ya?ml$/i, reason: 'Environment-specific values', icon: '⚙️', order: 2 },
  { pattern: /^external-secrets?\.ya?ml$/i, reason: 'External secrets configuration', icon: '🔐', order: 3 },
  { pattern: /^.*\.schema\.json$/i, reason: 'JSON schema for validation', icon: '📋', order: 4 },
]

/**
 * Secondary files are important but less frequently edited
 */
const SECONDARY_FILE_PATTERNS = [
  { pattern: /^Chart\.ya?ml$/i, reason: 'Helm chart metadata', icon: '📦', order: 10 },
  { pattern: /^requirements\.ya?ml$/i, reason: 'Chart dependencies', icon: '🔗', order: 11 },
  { pattern: /^\.argocd-source\.ya?ml$/i, reason: 'ArgoCD source config', icon: '🔄', order: 12 },
  { pattern: /^kustomization\.ya?ml$/i, reason: 'Kustomize configuration', icon: '🔧', order: 13 },
]

/**
 * Get the priority and metadata for a given file
 */
export function getFilePriority(filename: string): FileImportance {
  // Check primary patterns first
  for (const { pattern, reason, icon, order } of PRIMARY_FILE_PATTERNS) {
    if (pattern.test(filename)) {
      return {
        priority: 'primary',
        reason,
        icon,
        order
      }
    }
  }

  // Check secondary patterns
  for (const { pattern, reason, icon, order } of SECONDARY_FILE_PATTERNS) {
    if (pattern.test(filename)) {
      return {
        priority: 'secondary',
        reason,
        icon,
        order
      }
    }
  }

  // Everything else is "other"
  return {
    priority: 'other',
    reason: 'Configuration file',
    icon: '📄',
    order: 100
  }
}

/**
 * Check if a file is a primary file (should always be visible)
 */
export function isPrimaryFile(filename: string): boolean {
  return getFilePriority(filename).priority === 'primary'
}

/**
 * Check if a file is a secondary file
 */
export function isSecondaryFile(filename: string): boolean {
  return getFilePriority(filename).priority === 'secondary'
}

/**
 * Sort files by priority and then by order within priority
 */
export function sortFilesByPriority<T extends { name: string }>(files: T[]): T[] {
  return [...files].sort((a, b) => {
    const aPriority = getFilePriority(a.name)
    const bPriority = getFilePriority(b.name)

    // Sort by priority first (primary < secondary < other)
    const priorityOrder = { primary: 0, secondary: 1, other: 2 }
    const priorityDiff = priorityOrder[aPriority.priority] - priorityOrder[bPriority.priority]
    if (priorityDiff !== 0) return priorityDiff

    // Then by order within priority
    const orderDiff = aPriority.order - bPriority.order
    if (orderDiff !== 0) return orderDiff

    // Finally alphabetically
    return a.name.localeCompare(b.name)
  })
}

/**
 * Group files by priority
 */
export function groupFilesByPriority<T extends { name: string }>(files: T[]): {
  primary: T[]
  secondary: T[]
  other: T[]
} {
  const groups = {
    primary: [] as T[],
    secondary: [] as T[],
    other: [] as T[]
  }

  for (const file of files) {
    const priority = getFilePriority(file.name).priority
    groups[priority].push(file)
  }

  // Sort within each group
  groups.primary = sortFilesByPriority(groups.primary)
  groups.secondary = sortFilesByPriority(groups.secondary)
  groups.other = sortFilesByPriority(groups.other)

  return groups
}
