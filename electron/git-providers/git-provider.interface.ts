// Git Provider Interface
// Defines the contract for all Git provider implementations (Bitbucket Server, Bitbucket Cloud, etc.)

import {
  GitFile,
  GitFileContent,
  GitBranch,
  GitCommit,
  FileChange,
  PullRequest,
  MergeResult,
  GitRepositoryInfo
} from '../../src/types/git'

/**
 * Git Provider Interface
 * All Git provider implementations must implement this interface
 */
export interface GitProvider {
  /**
   * Repository information extracted from URL
   */
  readonly repositoryInfo: GitRepositoryInfo

  /**
   * List files in a directory
   * @param path - Directory path relative to repository root
   * @param branch - Branch name
   * @param recursive - Whether to list files recursively
   * @returns Array of files and directories
   */
  listFiles(path: string, branch: string, recursive?: boolean): Promise<GitFile[]>

  /**
   * Get file content
   * @param filePath - File path relative to repository root
   * @param branch - Branch name
   * @returns File content with metadata
   */
  getFileContent(filePath: string, branch: string): Promise<GitFileContent>

  /**
   * Get list of branches
   * @returns Array of branches
   */
  getBranches(): Promise<GitBranch[]>

  /**
   * Create a new branch
   * @param branchName - Name for the new branch
   * @param fromBranch - Source branch to create from
   * @returns Created branch information
   */
  createBranch(branchName: string, fromBranch: string): Promise<GitBranch>

  /**
   * Create a commit with file changes
   * @param branch - Branch to commit to
   * @param changes - Array of file changes
   * @param message - Commit message
   * @param author - Author information (name and email)
   * @returns Created commit information
   */
  createCommit(
    branch: string,
    changes: FileChange[],
    message: string,
    author: { name: string; email: string }
  ): Promise<GitCommit>

  /**
   * Create a Pull Request
   * @param sourceBranch - Source branch name
   * @param targetBranch - Target branch name
   * @param title - PR title
   * @param description - PR description
   * @param reviewers - Optional array of reviewer usernames
   * @returns Created Pull Request
   */
  createPullRequest(
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string,
    reviewers?: string[]
  ): Promise<PullRequest>

  /**
   * Get Pull Request by ID
   * @param prId - Pull Request ID
   * @returns Pull Request information
   */
  getPullRequest(prId: number): Promise<PullRequest>

  /**
   * Merge a Pull Request
   * @param prId - Pull Request ID
   * @param message - Optional merge commit message
   * @returns Merge result
   */
  mergePullRequest(prId: number, message?: string): Promise<MergeResult>

  /**
   * Get commits for a file
   * @param filePath - File path relative to repository root
   * @param branch - Branch name
   * @param limit - Maximum number of commits to return
   * @returns Array of commits
   */
  getFileCommits(filePath: string, branch: string, limit?: number): Promise<GitCommit[]>
}
