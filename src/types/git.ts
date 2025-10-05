// Git file operation types for Config Hub
// These types are used for viewing and editing configuration files from Git repositories

/**
 * Represents a file in a Git repository
 */
export interface GitFile {
  path: string
  name: string
  type: 'file' | 'directory'
  size: number
  lastModified: string
  lastCommit?: {
    sha: string
    message: string
    author: string
    date: string
  }
}

/**
 * Represents the content of a file from Git
 */
export interface GitFileContent {
  path: string
  content: string
  encoding: 'utf-8' | 'base64'
  sha: string
  size: number
  branch: string
}

/**
 * Represents a Git branch
 */
export interface GitBranch {
  name: string
  sha: string
  isDefault: boolean
  isProtected?: boolean
}

/**
 * Represents a file change for committing
 */
export interface FileChange {
  path: string
  content: string
  action: 'add' | 'modify' | 'delete'
}

/**
 * Represents a Git commit
 */
export interface GitCommit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
  committer: {
    name: string
    email: string
    date: string
  }
  parents: string[]
}

/**
 * Represents a Pull Request
 */
export interface PullRequest {
  id: number
  title: string
  description: string
  state: 'open' | 'merged' | 'declined' | 'superseded'
  author: {
    name: string
    email?: string
    displayName: string
  }
  sourceBranch: string
  targetBranch: string
  createdAt: string
  updatedAt: string
  reviewers?: PullRequestReviewer[]
  approvals?: number
  url: string
  mergeCommit?: string
}

/**
 * Represents a Pull Request reviewer
 */
export interface PullRequestReviewer {
  name: string
  email?: string
  displayName: string
  approved: boolean
  status: 'unapproved' | 'needs_work' | 'approved'
}

/**
 * Represents the result of a merge operation
 */
export interface MergeResult {
  success: boolean
  sha?: string
  message?: string
  conflicts?: string[]
}

/**
 * Webhook notification payload
 */
export interface WebhookPayload {
  type: 'pull_request_created' | 'pull_request_merged' | 'pull_request_declined'
  pullRequest: {
    id: number
    title: string
    url: string
    author: string
    sourceBranch: string
    targetBranch: string
  }
  repository: {
    name: string
    url: string
  }
  affectedApplications?: string[]
  timestamp: string
}

/**
 * JSON Schema type for form generation
 */
export interface JSONSchema {
  $schema?: string
  type: string
  title?: string
  description?: string
  properties?: Record<string, JSONSchema>
  required?: string[]
  items?: JSONSchema
  enum?: any[]
  default?: any
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
  additionalProperties?: boolean | JSONSchema
}

/**
 * Git provider type detection
 */
export type GitProviderType = 'bitbucket-server' | 'bitbucket-cloud' | 'github' | 'gitlab' | 'unknown'

/**
 * Git repository information extracted from URL
 */
export interface GitRepositoryInfo {
  providerType: GitProviderType
  baseUrl: string
  projectKey?: string
  repositorySlug?: string
  workspace?: string
  owner?: string
  repo?: string
}
