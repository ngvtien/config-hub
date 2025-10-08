/**
 * Bitbucket Cloud API Client
 * Implements GitProvider interface for Bitbucket Cloud (bitbucket.org)
 * Uses Bitbucket Cloud REST API 2.0
 */

import axios, { AxiosInstance } from 'axios'
import type { GitProvider } from './git-provider.interface'
import type {
  GitFile,
  GitFileContent,
  GitBranch,
  GitCommit,
  FileChange,
  PullRequest,
  MergeResult,
  GitRepositoryInfo
} from '../../src/types/git'

// Import GitCredential from electron side
interface GitCredential {
  repoUrl: string
  username?: string
  token?: string
  password?: string
}

export class BitbucketCloudClient implements GitProvider {
  private axiosInstance: AxiosInstance
  public readonly repositoryInfo: GitRepositoryInfo
  private workspace: string
  private repoSlug: string
  private token: string

  constructor(repoUrl: string, credential: GitCredential) {
    // Parse Bitbucket Cloud URL: https://bitbucket.org/workspace/repo-slug.git
    const urlMatch = repoUrl.match(/bitbucket\.org[\/:]([^\/]+)\/([^\/\.]+)/)
    if (!urlMatch) {
      throw new Error('Invalid Bitbucket Cloud URL format')
    }

    this.workspace = urlMatch[1]
    this.repoSlug = urlMatch[2]
    this.token = credential.token || credential.password || ''

    this.repositoryInfo = {
      providerType: 'bitbucket-cloud',
      workspace: this.workspace,
      repositorySlug: this.repoSlug,
      baseUrl: 'https://api.bitbucket.org/2.0'
    }

    // Create axios instance with Bitbucket Cloud API base URL
    this.axiosInstance = axios.create({
      baseURL: 'https://api.bitbucket.org/2.0',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })

    console.log('BitbucketCloudClient initialized:', {
      workspace: this.workspace,
      repoSlug: this.repoSlug,
      baseUrl: this.repositoryInfo.baseUrl
    })
  }

  /**
   * List files in a directory
   * Uses Bitbucket Cloud API /repositories/{workspace}/{repo_slug}/src/{commit}/{path}
   */
  async listFiles(path: string, branch: string, recursive?: boolean): Promise<GitFile[]> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/src/${branch}/${path || ''}`
      console.log('Bitbucket Cloud listFiles endpoint:', endpoint)

      const response = await this.axiosInstance.get(endpoint)

      console.log('Bitbucket Cloud listFiles response:', {
        status: response.status,
        hasData: !!response.data,
        dataType: typeof response.data,
        hasValues: !!response.data?.values
      })

      // Bitbucket Cloud returns { values: [...] }
      const items = response.data?.values || []

      const files: GitFile[] = items.map((item: any) => ({
        path: item.path,
        name: item.path.split('/').pop() || item.path,
        type: item.type === 'commit_directory' ? 'directory' : 'file',
        size: item.size,
        extension: item.path.includes('.') ? '.' + item.path.split('.').pop() : undefined
      }))

      return files
    } catch (error: any) {
      console.error('Bitbucket Cloud listFiles error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your access token.')
      } else if (error.response?.status === 404) {
        throw new Error('Repository not found. Please check the workspace and repository name.')
      }
      
      throw new Error(`Failed to list files: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Get file content
   * Uses Bitbucket Cloud API /repositories/{workspace}/{repo_slug}/src/{commit}/{path}
   */
  async getFileContent(filePath: string, branch: string): Promise<GitFileContent> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/src/${branch}/${filePath}`
      console.log('Bitbucket Cloud getFileContent endpoint:', endpoint)

      const response = await this.axiosInstance.get(endpoint, {
        // Get raw content
        headers: {
          'Accept': 'text/plain'
        }
      })

      return {
        content: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        path: filePath,
        sha: branch,
        size: response.data?.length || 0,
        encoding: 'utf-8',
        branch: branch
      }
    } catch (error) {
      console.error('Bitbucket Cloud getFileContent error:', error)
      throw new Error(`Failed to get file content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get list of branches
   */
  async getBranches(): Promise<GitBranch[]> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/refs/branches`
      const response = await this.axiosInstance.get(endpoint)

      const branches = response.data?.values || []
      return branches.map((branch: any) => ({
        name: branch.name,
        sha: branch.target?.hash || '',
        protected: false // Bitbucket Cloud doesn't expose this easily
      }))
    } catch (error) {
      throw new Error(`Failed to get branches: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a new branch
   * Note: Bitbucket Cloud doesn't have a direct "create branch" API
   * Branches are created implicitly when you commit to them
   */
  async createBranch(branchName: string, fromBranch: string): Promise<GitBranch> {
    try {
      // Get the commit hash of the source branch
      const branchesEndpoint = `/repositories/${this.workspace}/${this.repoSlug}/refs/branches/${fromBranch}`
      const response = await this.axiosInstance.get(branchesEndpoint)
      
      const commitHash = response.data?.target?.hash
      if (!commitHash) {
        throw new Error(`Could not find commit hash for branch ${fromBranch}`)
      }

      return {
        name: branchName,
        sha: commitHash,
        isProtected: false,
        isDefault: false
      }
    } catch (error) {
      throw new Error(`Failed to create branch: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a commit with file changes
   * Uses Bitbucket Cloud API 2.0 /src endpoint with form data
   */
  async createCommit(
    branch: string,
    changes: FileChange[],
    message: string,
    author: { name: string; email: string }
  ): Promise<GitCommit> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/src`
      
      // Bitbucket Cloud uses form data for commits
      const FormData = (await import('form-data')).default
      const formData = new FormData()
      
      // Add commit message
      formData.append('message', message)
      formData.append('branch', branch)
      formData.append('author', `${author.name} <${author.email}>`)
      
      // Add file changes
      for (const change of changes) {
        if (change.action === 'add' || change.action === 'modify') {
          formData.append(change.path, change.content)
        } else if (change.action === 'delete') {
          formData.append('files', change.path)
        }
      }

      const response = await this.axiosInstance.post(endpoint, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.token}`
        }
      })

      // Return commit info
      return {
        sha: response.data?.hash || '',
        message: message,
        author: {
          name: author.name,
          email: author.email,
          date: new Date().toISOString()
        },
        committer: {
          name: author.name,
          email: author.email,
          date: new Date().toISOString()
        },
        parents: []
      }
    } catch (error: any) {
      console.error('Bitbucket Cloud createCommit error:', error.response?.data || error.message)
      throw new Error(`Failed to create commit: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Create a Pull Request
   * Uses Bitbucket Cloud API 2.0 /pullrequests endpoint
   */
  async createPullRequest(
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string,
    reviewers?: string[]
  ): Promise<PullRequest> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/pullrequests`
      
      const prData: any = {
        title,
        description,
        source: {
          branch: {
            name: sourceBranch
          }
        },
        destination: {
          branch: {
            name: targetBranch
          }
        },
        close_source_branch: false
      }

      // Add reviewers if provided
      if (reviewers && reviewers.length > 0) {
        prData.reviewers = reviewers.map(username => ({ username }))
      }

      const response = await this.axiosInstance.post(endpoint, prData)
      
      return this.convertBitbucketCloudPR(response.data)
    } catch (error: any) {
      console.error('Bitbucket Cloud createPullRequest error:', error.response?.data || error.message)
      throw new Error(`Failed to create pull request: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * List Pull Requests
   * Uses Bitbucket Cloud API 2.0 /pullrequests endpoint
   */
  async listPullRequests(state?: 'open' | 'merged' | 'declined' | 'all', limit?: number): Promise<PullRequest[]> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/pullrequests`
      
      const params: any = {
        pagelen: limit || 50
      }

      // Map state to Bitbucket Cloud format
      if (state && state !== 'all') {
        params.state = state.toUpperCase()
      }

      const response = await this.axiosInstance.get(endpoint, { params })
      
      const prs = response.data?.values || []
      return prs.map((pr: any) => this.convertBitbucketCloudPR(pr))
    } catch (error) {
      throw new Error(`Failed to list pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get Pull Request by ID
   * Uses Bitbucket Cloud API 2.0 /pullrequests/{id} endpoint
   */
  async getPullRequest(prId: number): Promise<PullRequest> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/pullrequests/${prId}`
      const response = await this.axiosInstance.get(endpoint)
      
      return this.convertBitbucketCloudPR(response.data)
    } catch (error) {
      throw new Error(`Failed to get pull request: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Convert Bitbucket Cloud PR format to our PullRequest type
   */
  private convertBitbucketCloudPR(pr: any): PullRequest {
    return {
      id: pr.id,
      title: pr.title,
      description: pr.description || '',
      state: pr.state?.toLowerCase() || 'open',
      author: {
        username: pr.author?.username || '',
        displayName: pr.author?.display_name || pr.author?.username || '',
        email: pr.author?.email
      },
      sourceBranch: pr.source?.branch?.name || '',
      targetBranch: pr.destination?.branch?.name || '',
      url: pr.links?.html?.href || '',
      createdAt: pr.created_on || new Date().toISOString(),
      updatedAt: pr.updated_on || new Date().toISOString(),
      reviewers: pr.participants?.filter((p: any) => p.role === 'REVIEWER').map((r: any) => ({
        name: r.user?.username || '',
        displayName: r.user?.display_name || r.user?.username || '',
        email: r.user?.email,
        approved: r.approved || false,
        status: r.approved ? 'approved' : 'pending'
      })) || [],
      approvals: pr.participants?.filter((p: any) => p.approved).length || 0
    }
  }

  /**
   * Get Pull Request Diff/Changes
   * Uses Bitbucket Cloud API 2.0 /pullrequests/{id}/diff endpoint
   */
  async getPullRequestDiff(prId: number): Promise<{ path: string; diff: string }[]> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/pullrequests/${prId}/diff`
      
      const response = await this.axiosInstance.get(endpoint, {
        headers: {
          'Accept': 'text/plain'
        }
      })

      // Bitbucket Cloud returns unified diff format
      const diffText = typeof response.data === 'string' ? response.data : response.data.toString()
      
      // Parse unified diff into file-based diffs
      return this.parseDiff(diffText)
    } catch (error) {
      console.error('Bitbucket Cloud getPullRequestDiff error:', error)
      throw new Error(`Failed to get pull request diff: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse unified diff format into file-based diffs
   */
  private parseDiff(diffText: string): { path: string; diff: string }[] {
    if (!diffText || diffText.trim().length === 0) {
      return []
    }

    const files: { path: string; diff: string }[] = []
    const lines = diffText.split('\n')
    
    let currentFile: { path: string; diff: string } | null = null
    let currentDiff: string[] = []
    
    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        // Save previous file
        if (currentFile && currentDiff.length > 0) {
          currentFile.diff = currentDiff.join('\n')
          files.push(currentFile)
        }
        
        // Extract file path
        const match = line.match(/diff --git a\/(.*) b\/(.*)/)
        if (match) {
          currentFile = { path: match[2], diff: '' }
          currentDiff = [line]
        }
      } else if (currentFile) {
        currentDiff.push(line)
      }
    }
    
    // Save last file
    if (currentFile && currentDiff.length > 0) {
      currentFile.diff = currentDiff.join('\n')
      files.push(currentFile)
    }
    
    return files
  }

  /**
   * Approve a Pull Request
   * Uses Bitbucket Cloud API 2.0 /pullrequests/{id}/approve endpoint
   */
  async approvePullRequest(prId: number): Promise<PullRequest> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/pullrequests/${prId}/approve`
      
      await this.axiosInstance.post(endpoint)
      
      // Fetch and return updated PR
      return await this.getPullRequest(prId)
    } catch (error: any) {
      console.error('Bitbucket Cloud approvePullRequest error:', error.response?.data || error.message)
      
      // Check for specific error messages
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message)
      }
      
      throw new Error(`Failed to approve pull request: ${error.message || 'Unknown error'}`)
    }
  }

  /**
   * Merge a Pull Request
   * Uses Bitbucket Cloud API 2.0 /pullrequests/{id}/merge endpoint
   */
  async mergePullRequest(prId: number, message?: string): Promise<MergeResult> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/pullrequests/${prId}/merge`
      
      const mergeData: any = {
        close_source_branch: false
      }

      if (message) {
        mergeData.message = message
      }

      const response = await this.axiosInstance.post(endpoint, mergeData)
      
      return {
        success: true,
        sha: response.data?.hash || '',
        message: 'Pull request merged successfully'
      }
    } catch (error: any) {
      console.error('Bitbucket Cloud mergePullRequest error:', error.response?.data || error.message)
      
      const errorData = error.response?.data?.error
      if (errorData) {
        return {
          success: false,
          message: errorData.message || 'Failed to merge pull request',
          conflicts: errorData.fields ? Object.keys(errorData.fields) : undefined
        }
      }
      
      return {
        success: false,
        message: error.message || 'Failed to merge pull request'
      }
    }
  }

  /**
   * Decline a Pull Request
   * Uses Bitbucket Cloud API 2.0 /pullrequests/{id}/decline endpoint
   */
  async declinePullRequest(prId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Use the decline endpoint with POST (as per Bitbucket Cloud API)
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/pullrequests/${prId}/decline`
      console.log('Bitbucket Cloud decline PR endpoint:', endpoint)
      
      // POST with empty body to decline
      const response = await this.axiosInstance.post(endpoint, {})
      console.log('Bitbucket Cloud decline PR response:', response.status, response.data?.state)
      
      return {
        success: true,
        message: 'Pull request declined successfully'
      }
    } catch (error: any) {
      console.error('Bitbucket Cloud declinePullRequest error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message
        || error.message 
        || 'Failed to decline pull request'
      
      return {
        success: false,
        message: `${errorMessage} (Status: ${error.response?.status || 'unknown'})`
      }
    }
  }

  /**
   * Delete a branch
   * Uses Bitbucket Cloud API 2.0 /refs/branches/{name} endpoint
   */
  async deleteBranch(branchName: string): Promise<void> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/refs/branches/${branchName}`
      await this.axiosInstance.delete(endpoint)
    } catch (error) {
      throw new Error(`Failed to delete branch: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get commits for a file
   * Uses Bitbucket Cloud API 2.0 /commits endpoint with path filter
   */
  async getFileCommits(filePath: string, branch: string, limit?: number): Promise<GitCommit[]> {
    try {
      const endpoint = `/repositories/${this.workspace}/${this.repoSlug}/commits/${branch}`
      
      const params: any = {
        path: filePath,
        pagelen: limit || 10
      }

      const response = await this.axiosInstance.get(endpoint, { params })
      
      const commits = response.data?.values || []
      return commits.map((commit: any) => ({
        sha: commit.hash,
        message: commit.message || '',
        author: {
          name: commit.author?.user?.display_name || commit.author?.raw || '',
          email: commit.author?.user?.email || '',
          date: commit.date
        },
        committer: {
          name: commit.author?.user?.display_name || commit.author?.raw || '',
          email: commit.author?.user?.email || '',
          date: commit.date
        },
        parents: commit.parents?.map((p: any) => p.hash) || []
      }))
    } catch (error) {
      throw new Error(`Failed to get file commits: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
