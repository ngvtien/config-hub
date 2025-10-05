// Git Provider abstraction interface
// This interface defines the contract that all Git provider implementations must follow

import type {
  GitFile,
  GitFileContent,
  GitBranch,
  FileChange,
  GitCommit,
  PullRequest,
  MergeResult,
  GitRepositoryInfo
} from './git'

/**
 * Abstract interface for Git provider implementations
 * All Git providers (Bitbucket Server, Bitbucket Cloud, GitHub, GitLab) must implement this interface
 */
export interface GitProvider {
  /**
   * Initialize the provider with repository information and credentials
   */
  initialize(repoInfo: GitRepositoryInfo, credentials: GitProviderCredentials): Promise<void>

  /**
   * List files in a directory at a specific branch
   * @param path - Directory path (empty string for root)
   * @param branch - Branch name
   * @param recursive - Whether to list files recursively
   */
  listFiles(path: string, branch: string, recursive?: boolean): Promise<GitFile[]>

  /**
   * Get the content of a specific file
   * @param filePath - Path to the file
   * @param branch - Branch name
   */
  getFileContent(filePath: string, branch: string): Promise<GitFileContent>

  /**
   * List all branches in the repository
   */
  getBranches(): Promise<GitBranch[]>

  /**
   * Create a new branch from a base branch
   * @param branchName - Name of the new branch
   * @param baseBranch - Base branch to create from
   */
  createBranch(branchName: string, baseBranch: string): Promise<GitBranch>

  /**
   * Commit changes to a branch
   * @param branch - Branch to commit to
   * @param changes - Array of file changes
   * @param message - Commit message
   * @param author - Optional author information
   */
  commitChanges(
    branch: string,
    changes: FileChange[],
    message: string,
    author?: { name: string; email: string }
  ): Promise<GitCommit>

  /**
   * Create a Pull Request
   * @param sourceBranch - Source branch name
   * @param targetBranch - Target branch name
   * @param title - PR title
   * @param description - PR description
   * @param reviewers - Optional list of reviewer usernames
   */
  createPullRequest(
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string,
    reviewers?: string[]
  ): Promise<PullRequest>

  /**
   * Get Pull Request details
   * @param prId - Pull Request ID
   */
  getPullRequest(prId: number): Promise<PullRequest>

  /**
   * List Pull Requests
   * @param state - Filter by state (optional)
   * @param sourceBranch - Filter by source branch (optional)
   */
  listPullRequests(state?: 'open' | 'merged' | 'declined', sourceBranch?: string): Promise<PullRequest[]>

  /**
   * Merge a Pull Request
   * @param prId - Pull Request ID
   * @param message - Optional merge commit message
   */
  mergePullRequest(prId: number, message?: string): Promise<MergeResult>

  /**
   * Test the connection and credentials
   */
  testConnection(): Promise<boolean>

  /**
   * Get the repository information
   */
  getRepositoryInfo(): GitRepositoryInfo
}

/**
 * Credentials for Git provider authentication
 */
export interface GitProviderCredentials {
  username: string
  token?: string
  password?: string
  authType: 'token' | 'userpass' | 'oauth'
}

/**
 * Factory function type for creating Git provider instances
 */
export type GitProviderFactory = (
  repoInfo: GitRepositoryInfo,
  credentials: GitProviderCredentials
) => Promise<GitProvider>

/**
 * Git provider configuration
 */
export interface GitProviderConfig {
  type: 'bitbucket-server' | 'bitbucket-cloud' | 'github' | 'gitlab'
  baseUrl: string
  apiVersion?: string
  timeout?: number
  retryAttempts?: number
}
