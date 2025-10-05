// Bitbucket Server Client
// Implements GitProvider interface for Bitbucket Server (self-hosted)
// Uses ONLY Bitbucket REST API - NO local Git commands

import axios, { AxiosInstance } from 'axios'
import https from 'https'
import { GitProvider } from './git-provider.interface'
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
import {
  BitbucketPagedResponse,
  BitbucketBrowseResponse,
  BitbucketFile,
  BitbucketCommit,
  BitbucketBranch,
  BitbucketPullRequest,
  BitbucketCreateBranchRequest,
  BitbucketCreatePullRequestRequest,
  BitbucketMergePullRequestRequest,
  BitbucketErrorResponse
} from '../../src/types/bitbucket'
import { GitCredential } from '../secure-credential-manager'

/**
 * Bitbucket Server Client
 * Implements Git operations using Bitbucket Server REST API
 */
export class BitbucketServerClient implements GitProvider {
  private axiosInstance: AxiosInstance
  public readonly repositoryInfo: GitRepositoryInfo
  private projectKey: string
  private repositorySlug: string

  constructor(repoUrl: string, credential: GitCredential) {
    // Parse repository URL to extract base URL, project key, and repository slug
    this.repositoryInfo = this.parseRepositoryUrl(repoUrl)
    
    if (!this.repositoryInfo.projectKey || !this.repositoryInfo.repositorySlug) {
      throw new Error('Invalid Bitbucket Server URL: Could not extract project key and repository slug')
    }

    this.projectKey = this.repositoryInfo.projectKey
    this.repositorySlug = this.repositoryInfo.repositorySlug

    // Set up axios instance with authentication
    this.axiosInstance = this.createAxiosInstance(credential)
  }

  /**
   * Parse Bitbucket Server repository URL
   * Supports formats:
   * - https://bitbucket.example.com/scm/PROJECT/repo.git
   * - https://bitbucket.example.com/projects/PROJECT/repos/repo
   * - http://localhost:7990/scm/PROJECT/repo.git
   */
  private parseRepositoryUrl(repoUrl: string): GitRepositoryInfo {
    try {
      const url = new URL(repoUrl)
      const baseUrl = `${url.protocol}//${url.host}`
      
      // Remove .git suffix if present
      let pathname = url.pathname.replace(/\.git$/, '')
      
      let projectKey: string | undefined
      let repositorySlug: string | undefined

      // Pattern 1: /scm/PROJECT/repo
      const scmMatch = pathname.match(/\/scm\/([^\/]+)\/([^\/]+)/)
      if (scmMatch) {
        projectKey = scmMatch[1]
        repositorySlug = scmMatch[2]
      }

      // Pattern 2: /projects/PROJECT/repos/repo
      const projectsMatch = pathname.match(/\/projects\/([^\/]+)\/repos\/([^\/]+)/)
      if (projectsMatch) {
        projectKey = projectsMatch[1]
        repositorySlug = projectsMatch[2]
      }

      return {
        providerType: 'bitbucket-server',
        baseUrl,
        projectKey,
        repositorySlug
      }
    } catch (error) {
      throw new Error(`Failed to parse Bitbucket Server URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create axios instance with authentication headers
   */
  private createAxiosInstance(credential: GitCredential): AxiosInstance {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }

    // Set up authentication based on credential type
    if (credential.authType === 'token' && credential.token) {
      headers['Authorization'] = `Bearer ${credential.token}`
    } else if (credential.authType === 'userpass' && credential.username && credential.password) {
      const auth = Buffer.from(`${credential.username}:${credential.password}`).toString('base64')
      headers['Authorization'] = `Basic ${auth}`
    } else {
      throw new Error('Invalid credential type for Bitbucket Server. Use token or userpass.')
    }

    return axios.create({
      baseURL: this.repositoryInfo.baseUrl,
      headers,
      // Allow self-signed certificates for local development
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      }),
      timeout: 30000 // 30 second timeout
    })
  }

  /**
   * Handle Bitbucket API errors
   */
  private handleApiError(error: any, operation: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const data = error.response?.data as BitbucketErrorResponse | undefined

      if (status === 401) {
        throw new Error(`Authentication failed for ${operation}. Please check your credentials.`)
      } else if (status === 403) {
        throw new Error(`Access forbidden for ${operation}. Please check your permissions.`)
      } else if (status === 404) {
        throw new Error(`Resource not found for ${operation}. Please check the repository URL and path.`)
      } else if (data?.errors && data.errors.length > 0) {
        const errorMessages = data.errors.map(e => e.message).join(', ')
        throw new Error(`${operation} failed: ${errorMessages}`)
      } else {
        throw new Error(`${operation} failed: ${error.message}`)
      }
    }
    throw new Error(`${operation} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  /**
   * List files in a directory
   * Uses Bitbucket Server REST API /browse endpoint
   */
  async listFiles(path: string, branch: string, recursive?: boolean): Promise<GitFile[]> {
    try {
      const files: GitFile[] = []
      
      // Normalize path (remove leading/trailing slashes)
      const normalizedPath = path.replace(/^\/+|\/+$/g, '')
      
      // Bitbucket Server API endpoint for browsing files
      // If path is empty, don't include it in the URL
      const pathSegment = normalizedPath ? `/${normalizedPath}` : ''
      const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/browse${pathSegment}`
      
      console.log('Bitbucket listFiles endpoint:', endpoint, 'branch:', branch)
      
      let start = 0
      let isLastPage = false

      // Handle pagination
      while (!isLastPage) {
        const response = await this.axiosInstance.get<BitbucketBrowseResponse>(endpoint, {
          params: {
            at: branch,
            start,
            limit: 100 // Fetch 100 items per page
          }
        })

        const data = response.data

        // Bitbucket Server returns files in data.children.values
        const children = data.children
        
        if (!children || !children.values || !Array.isArray(children.values)) {
          console.error('Invalid response structure. Expected data.children.values. Got:', data)
          throw new Error(`Invalid response from Bitbucket Server: children.values not found`)
        }

        // Convert Bitbucket files to GitFile format
        for (const file of children.values) {
          const gitFile: GitFile = {
            path: file.path.toString,
            name: file.path.name,
            type: file.type === 'FILE' ? 'file' : 'directory',
            size: file.size || 0,
            lastModified: '', // Will be populated by getFileCommits if needed
            lastCommit: undefined
          }

          files.push(gitFile)

          // If recursive and this is a directory, fetch its contents
          if (recursive && file.type === 'DIRECTORY') {
            const subFiles = await this.listFiles(file.path.toString, branch, true)
            files.push(...subFiles)
          }
        }

        isLastPage = children.isLastPage
        start = children.nextPageStart || 0
      }

      // Optionally fetch last commit info for each file (can be expensive)
      // For now, we'll skip this to improve performance
      // Users can call getFileCommits separately if needed

      return files
    } catch (error) {
      this.handleApiError(error, 'listFiles')
    }
  }

  /**
   * Get file content
   * Uses Bitbucket Server REST API /raw endpoint
   */
  async getFileContent(filePath: string, branch: string): Promise<GitFileContent> {
    try {
      // Normalize path (remove leading slash)
      const normalizedPath = filePath.replace(/^\/+/, '')
      
      // Bitbucket Server API endpoint for raw file content
      const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/raw/${normalizedPath}`
      
      const response = await this.axiosInstance.get<string>(endpoint, {
        params: {
          at: branch
        },
        responseType: 'text'
      })

      // Get file metadata (size, last commit)
      const metadataEndpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/browse/${normalizedPath}`
      const metadataResponse = await this.axiosInstance.get<BitbucketFile>(metadataEndpoint, {
        params: {
          at: branch
        }
      })

      // Get last commit for the file
      const commits = await this.getFileCommits(normalizedPath, branch, 1)
      const lastCommit = commits[0]

      return {
        path: normalizedPath,
        content: response.data,
        encoding: 'utf-8',
        sha: lastCommit?.sha || '',
        size: metadataResponse.data.size || response.data.length,
        branch
      }
    } catch (error) {
      this.handleApiError(error, 'getFileContent')
    }
  }

  /**
   * Get list of branches
   * Uses Bitbucket Server REST API /branches endpoint
   */
  async getBranches(): Promise<GitBranch[]> {
    try {
      const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/branches`
      
      let start = 0
      let isLastPage = false
      const branches: GitBranch[] = []

      // Handle pagination
      while (!isLastPage) {
        const response = await this.axiosInstance.get<BitbucketPagedResponse<BitbucketBranch>>(endpoint, {
          params: {
            start,
            limit: 100
          }
        })

        const data = response.data

        // Convert Bitbucket branches to GitBranch format
        for (const branch of data.values) {
          branches.push({
            name: branch.displayId,
            sha: branch.latestCommit,
            isDefault: branch.isDefault,
            isProtected: false // Bitbucket Server doesn't provide this in branch list
          })
        }

        isLastPage = data.isLastPage
        start = data.nextPageStart || 0
      }

      return branches
    } catch (error) {
      this.handleApiError(error, 'getBranches')
    }
  }

  /**
   * Create a new branch
   * Uses Bitbucket Server REST API /branches endpoint
   */
  async createBranch(branchName: string, fromBranch: string): Promise<GitBranch> {
    try {
      const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/branches`
      
      // First, get the commit SHA of the source branch
      const branches = await this.getBranches()
      const sourceBranch = branches.find(b => b.name === fromBranch)
      
      if (!sourceBranch) {
        throw new Error(`Source branch '${fromBranch}' not found`)
      }

      // Create branch request
      const createRequest: BitbucketCreateBranchRequest = {
        name: branchName,
        startPoint: sourceBranch.sha,
        message: `Create branch ${branchName} from ${fromBranch}`
      }

      try {
        const response = await this.axiosInstance.post<BitbucketBranch>(endpoint, createRequest)

        return {
          name: response.data.displayId,
          sha: response.data.latestCommit,
          isDefault: false,
          isProtected: false
        }
      } catch (error: any) {
        // Handle branch already exists error
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          throw new Error(`Branch '${branchName}' already exists. Please use a different name.`)
        }
        throw error
      }
    } catch (error) {
      this.handleApiError(error, 'createBranch')
    }
  }

  /**
   * Create a commit with file changes
   * Uses Bitbucket Server REST API
   * Note: Bitbucket Server doesn't have a direct "create commit" API endpoint
   * We need to use the file edit API for each file change
   */
  async createCommit(
    branch: string,
    changes: FileChange[],
    message: string,
    author: { name: string; email: string }
  ): Promise<GitCommit> {
    try {
      // Bitbucket Server requires editing files one at a time
      // We'll process all changes and then get the resulting commit
      
      for (const change of changes) {
        const normalizedPath = change.path.replace(/^\/+/, '')
        
        if (change.action === 'add' || change.action === 'modify') {
          // Use the file edit endpoint
          const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/browse/${normalizedPath}`
          
          // For Bitbucket Server, we need to use a different approach
          // The /browse endpoint with PUT method allows file updates
          await this.axiosInstance.put(endpoint, change.content, {
            params: {
              branch,
              message,
              sourceCommitId: 'HEAD' // Use HEAD as the source
            },
            headers: {
              'Content-Type': 'text/plain'
            }
          })
        } else if (change.action === 'delete') {
          // Delete file
          const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/browse/${normalizedPath}`
          
          await this.axiosInstance.delete(endpoint, {
            params: {
              branch,
              message
            }
          })
        }
      }

      // After all changes are committed, get the latest commit on the branch
      const commits = await this.getFileCommits('', branch, 1)
      
      if (commits.length === 0) {
        throw new Error('Failed to retrieve commit after changes')
      }

      return commits[0]
    } catch (error) {
      this.handleApiError(error, 'createCommit')
    }
  }

  /**
   * Create a Pull Request
   * Uses Bitbucket Server REST API /pull-requests endpoint
   */
  async createPullRequest(
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string,
    reviewers?: string[]
  ): Promise<PullRequest> {
    try {
      const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/pull-requests`
      
      // Build PR request
      const prRequest: BitbucketCreatePullRequestRequest = {
        title,
        description,
        state: 'OPEN',
        open: true,
        closed: false,
        fromRef: {
          id: `refs/heads/${sourceBranch}`,
          repository: {
            slug: this.repositorySlug,
            project: {
              key: this.projectKey
            }
          }
        },
        toRef: {
          id: `refs/heads/${targetBranch}`,
          repository: {
            slug: this.repositorySlug,
            project: {
              key: this.projectKey
            }
          }
        },
        locked: false
      }

      // Add reviewers if provided
      if (reviewers && reviewers.length > 0) {
        prRequest.reviewers = reviewers.map(username => ({
          user: { name: username }
        }))
      }

      try {
        const response = await this.axiosInstance.post<BitbucketPullRequest>(endpoint, prRequest)
        return this.convertBitbucketPullRequest(response.data)
      } catch (error: any) {
        // Handle specific PR creation errors
        if (axios.isAxiosError(error)) {
          const data = error.response?.data as BitbucketErrorResponse | undefined
          if (data?.errors && data.errors.length > 0) {
            const errorMsg = data.errors[0].message
            if (errorMsg.includes('already exists')) {
              throw new Error('A pull request already exists for these branches.')
            } else if (errorMsg.includes('no changes')) {
              throw new Error('Cannot create pull request: no changes between branches.')
            }
          }
        }
        throw error
      }
    } catch (error) {
      this.handleApiError(error, 'createPullRequest')
    }
  }

  /**
   * List Pull Requests
   * Uses Bitbucket Server REST API /pull-requests endpoint
   */
  async listPullRequests(state: 'open' | 'merged' | 'declined' | 'all' = 'open', limit: number = 25): Promise<PullRequest[]> {
    try {
      const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/pull-requests`
      
      // Map state to Bitbucket Server API state parameter
      const params: any = {
        limit,
        start: 0
      }
      
      if (state !== 'all') {
        params.state = state.toUpperCase()
      }
      
      const response = await this.axiosInstance.get<{
        values: BitbucketPullRequest[]
        size: number
        isLastPage: boolean
      }>(endpoint, { params })
      
      return response.data.values.map(pr => this.convertBitbucketPullRequest(pr))
    } catch (error) {
      this.handleApiError(error, 'listPullRequests')
    }
  }

  /**
   * Get Pull Request by ID
   * Uses Bitbucket Server REST API /pull-requests/{id} endpoint
   */
  async getPullRequest(prId: number): Promise<PullRequest> {
    try {
      const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/pull-requests/${prId}`
      
      const response = await this.axiosInstance.get<BitbucketPullRequest>(endpoint)
      return this.convertBitbucketPullRequest(response.data)
    } catch (error) {
      this.handleApiError(error, 'getPullRequest')
    }
  }

  /**
   * Merge a Pull Request
   * Uses Bitbucket Server REST API /pull-requests/{id}/merge endpoint
   */
  async mergePullRequest(prId: number, message?: string): Promise<MergeResult> {
    try {
      // First, get the PR to get its version (required for merge)
      const pr = await this.getPullRequest(prId)
      
      // Check if PR is in a mergeable state
      if (pr.state !== 'open') {
        return {
          success: false,
          message: `Pull request is ${pr.state} and cannot be merged`
        }
      }

      const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/pull-requests/${prId}/merge`
      
      // Get the PR version from the original Bitbucket PR
      const prResponse = await this.axiosInstance.get<BitbucketPullRequest>(
        `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/pull-requests/${prId}`
      )
      
      const mergeRequest: BitbucketMergePullRequestRequest = {
        version: prResponse.data.version,
        message: message || `Merge pull request #${prId}`,
        autoSubject: !message
      }

      try {
        const response = await this.axiosInstance.post<BitbucketPullRequest>(endpoint, mergeRequest)
        
        return {
          success: true,
          sha: response.data.toRef.latestCommit,
          message: 'Pull request merged successfully'
        }
      } catch (error: any) {
        // Handle merge conflicts
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          const data = error.response?.data as BitbucketErrorResponse | undefined
          
          if (status === 409) {
            // Merge conflict
            return {
              success: false,
              message: 'Merge conflict detected',
              conflicts: data?.errors?.map(e => e.message) || ['Unknown conflict']
            }
          } else if (data?.errors && data.errors.length > 0) {
            return {
              success: false,
              message: data.errors[0].message
            }
          }
        }
        throw error
      }
    } catch (error) {
      this.handleApiError(error, 'mergePullRequest')
    }
  }

  /**
   * Convert Bitbucket Pull Request to PullRequest format
   */
  private convertBitbucketPullRequest(pr: BitbucketPullRequest): PullRequest {
    // Map Bitbucket state to our state
    let state: PullRequest['state']
    switch (pr.state) {
      case 'OPEN':
        state = 'open'
        break
      case 'MERGED':
        state = 'merged'
        break
      case 'DECLINED':
        state = 'declined'
        break
      case 'SUPERSEDED':
        state = 'superseded'
        break
      default:
        state = 'open'
    }

    // Count approvals
    const approvals = pr.reviewers.filter(r => r.approved).length

    // Build PR URL
    const prUrl = `${this.repositoryInfo.baseUrl}/projects/${this.projectKey}/repos/${this.repositorySlug}/pull-requests/${pr.id}`

    return {
      id: pr.id,
      title: pr.title,
      description: pr.description || '',
      state,
      author: {
        name: pr.author.user.name,
        email: pr.author.user.emailAddress,
        displayName: pr.author.user.displayName
      },
      sourceBranch: pr.fromRef.displayId,
      targetBranch: pr.toRef.displayId,
      createdAt: new Date(pr.createdDate).toISOString(),
      updatedAt: new Date(pr.updatedDate).toISOString(),
      reviewers: pr.reviewers.map(r => ({
        name: r.user.name,
        email: r.user.emailAddress,
        displayName: r.user.displayName,
        approved: r.approved,
        status: r.status.toLowerCase() as 'unapproved' | 'needs_work' | 'approved'
      })),
      approvals,
      url: prUrl,
      mergeCommit: pr.state === 'MERGED' ? pr.toRef.latestCommit : undefined
    }
  }

  /**
   * Get commits for a file
   * Uses Bitbucket Server REST API /commits endpoint
   */
  async getFileCommits(filePath: string, branch: string, limit: number = 10): Promise<GitCommit[]> {
    try {
      // Normalize path (remove leading slash)
      const normalizedPath = filePath.replace(/^\/+/, '')
      
      // Bitbucket Server API endpoint for commits
      const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/commits`
      
      const response = await this.axiosInstance.get<BitbucketPagedResponse<BitbucketCommit>>(endpoint, {
        params: {
          until: branch,
          path: normalizedPath,
          limit
        }
      })

      // Convert Bitbucket commits to GitCommit format
      return response.data.values.map(commit => this.convertBitbucketCommit(commit))
    } catch (error) {
      this.handleApiError(error, 'getFileCommits')
    }
  }

  /**
   * Convert Bitbucket commit to GitCommit format
   */
  private convertBitbucketCommit(commit: BitbucketCommit): GitCommit {
    return {
      sha: commit.id,
      message: commit.message,
      author: {
        name: commit.author.name,
        email: commit.author.emailAddress,
        date: new Date(commit.authorTimestamp).toISOString()
      },
      committer: {
        name: commit.committer?.name || commit.author.name,
        email: commit.committer?.emailAddress || commit.author.emailAddress,
        date: new Date(commit.committerTimestamp || commit.authorTimestamp).toISOString()
      },
      parents: commit.parents.map(p => p.id)
    }
  }
}
