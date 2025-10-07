// Bitbucket Server Client
// Implements GitProvider interface for Bitbucket Server (self-hosted)
// Uses ONLY Bitbucket REST API - NO local Git commands

import axios, { AxiosInstance } from 'axios'
import https from 'https'
import simpleGit, { SimpleGit } from 'simple-git'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
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
  private baseUrl: string
  private username: string
  private token: string

  constructor(repoUrl: string, credential: GitCredential) {
    // Parse repository URL to extract base URL, project key, and repository slug
    this.repositoryInfo = this.parseRepositoryUrl(repoUrl)

    if (!this.repositoryInfo.projectKey || !this.repositoryInfo.repositorySlug) {
      throw new Error('Invalid Bitbucket Server URL: Could not extract project key and repository slug')
    }

    // Validate credentials
    if (!credential.username || !credential.token) {
      throw new Error('Bitbucket Server requires username and token for authentication')
    }

    this.projectKey = this.repositoryInfo.projectKey!
    this.repositorySlug = this.repositoryInfo.repositorySlug!
    this.baseUrl = this.repositoryInfo.baseUrl!
    this.username = credential.username
    this.token = credential.token

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

      console.log('Bitbucket Server listFiles:', {
        inputPath: path,
        normalizedPath,
        pathSegment,
        endpoint,
        branch
      })
      
      console.log('About to browse:', endpoint)

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
          // For directories, use the full path (toString) as the path
          // and just the name for display
          const fullPath = file.path.toString
          const displayName = file.path.name
          
          const gitFile: GitFile = {
            path: fullPath,
            name: displayName,
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
   * Delete a branch
   * Uses Bitbucket Server REST API /branches endpoint
   */
  async deleteBranch(branchName: string): Promise<void> {
    try {
      // Get the branch to find its latest commit (required for deletion)
      const branches = await this.getBranches()
      const branch = branches.find(b => b.name === branchName)

      if (!branch) {
        throw new Error(`Branch '${branchName}' not found`)
      }

      // Bitbucket Server requires the branch name to be URL encoded
      const encodedBranchName = encodeURIComponent(`refs/heads/${branchName}`)
      const endpoint = `/rest/branch-utils/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/branches`

      await this.axiosInstance.delete(endpoint, {
        data: {
          name: `refs/heads/${branchName}`,
          dryRun: false
        }
      })
    } catch (error) {
      this.handleApiError(error, 'deleteBranch')
    }
  }

  /**
   * Create a commit with file changes
   * Uses simple-git to perform actual Git operations since Bitbucket Server
   * doesn't have a REST API for committing files
   */
  async createCommit(
    branch: string,
    changes: FileChange[],
    message: string,
    author: { name: string; email: string }
  ): Promise<GitCommit> {
    const tempDir = path.join(os.tmpdir(), `git-${Date.now()}`)

    // Set environment variables to prevent credential prompts
    const originalEnv = { ...process.env }
    process.env.GIT_TERMINAL_PROMPT = '0'
    process.env.GIT_ASKPASS = 'echo'
    process.env.GIT_SSH_COMMAND = 'ssh -o StrictHostKeyChecking=no'

    try {
      // Create temporary directory
      fs.mkdirSync(tempDir, { recursive: true })

      // Initialize simple-git with custom environment to disable credential helpers
      const git: SimpleGit = simpleGit(tempDir, {
        config: [
          'credential.helper=', // Disable credential helper
          'core.askPass=', // Disable askPass
        ]
      })

      // Build Git URL with credentials embedded
      const gitUrl = this.baseUrl.replace('http://', `http://${encodeURIComponent(this.username)}:${encodeURIComponent(this.token)}@`)
        .replace('https://', `https://${encodeURIComponent(this.username)}:${encodeURIComponent(this.token)}@`)
      const repoUrl = `${gitUrl}/scm/${this.projectKey}/${this.repositorySlug}.git`

      // Check if the branch exists on the remote
      const branches = await this.getBranches()
      const branchExists = branches.some(b => b.name === branch)

      console.log(`Branch '${branch}' exists: ${branchExists}`)
      console.log(`Available branches: ${branches.map(b => `${b.name} (${b.sha})`).join(', ')}`)

      // Clone the repository into a subdirectory
      const cloneDir = path.join(tempDir, 'repo')
      
      // Try to clone the repository
      let isEmptyRepo = false
      
      try {
        if (branchExists) {
          // Branch exists, clone it directly
          console.log(`Cloning existing branch: ${branch}`)
          await git.clone(repoUrl, cloneDir, ['--branch', branch])
        } else {
          // Branch doesn't exist, clone the repository without specifying a branch
          // This will clone the default branch automatically
          console.log(`Cloning repository (will use default branch) and will create '${branch}' locally`)
          await git.clone(repoUrl, cloneDir)
        }
      } catch (cloneError: any) {
        console.error('Clone failed:', cloneError)
        const errorMsg = cloneError.message || cloneError.toString()
        
        // If clone fails with "not our ref", the repository is corrupted or empty
        if (errorMsg.includes('not our ref') || errorMsg.includes('0000000000000000000000000000000000000000')) {
          const mainBranch = branches.find(b => b.name === 'main' || b.isDefault)
          
          throw new Error(
            `Cannot clone repository. The repository appears to be corrupted or inaccessible.\n\n` +
            `Details:\n` +
            `- Repository: ${this.baseUrl}/projects/${this.projectKey}/repos/${this.repositorySlug}\n` +
            `- Branch: ${mainBranch?.name || 'unknown'}\n` +
            `- SHA from API: ${mainBranch?.sha || 'none'}\n` +
            `- Error: ${errorMsg}\n\n` +
            `Possible solutions:\n` +
            `1. Check if the repository has any commits in the Bitbucket web UI\n` +
            `2. Try pushing an initial commit to the repository manually\n` +
            `3. Contact your Bitbucket administrator to check repository integrity\n` +
            `4. Try running 'git fsck' on the server repository`
          )
        } else {
          throw new Error(`Failed to clone repository: ${errorMsg}`)
        }
      }

      // Re-initialize git in the cloned directory with credential config
      const repoGit: SimpleGit = simpleGit(cloneDir, {
        config: [
          'credential.helper=',
          'core.askPass=',
        ]
      })

      // Configure git user and disable credential helpers
      await repoGit.addConfig('user.name', author.name)
      await repoGit.addConfig('user.email', author.email)
      await repoGit.addConfig('credential.helper', '')
      await repoGit.addConfig('core.askPass', '')

      // If branch doesn't exist locally, create it
      if (!branchExists) {
        console.log(`Creating new local branch: ${branch}`)
        await repoGit.checkoutLocalBranch(branch)
        console.log(`Successfully created and checked out branch: ${branch}`)
      }

      // Apply file changes
      for (const change of changes) {
        const filePath = path.join(cloneDir, change.path)

        if (change.action === 'add' || change.action === 'modify') {
          // Ensure directory exists
          const dir = path.dirname(filePath)
          fs.mkdirSync(dir, { recursive: true })

          // Write file content
          fs.writeFileSync(filePath, change.content, 'utf-8')

          // Stage the file
          await repoGit.add(change.path)
        } else if (change.action === 'delete') {
          // Delete and stage
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            await repoGit.rm(change.path)
          }
        }
      }

      // Commit changes
      console.log(`Committing changes with message: ${message}`)
      await repoGit.commit(message)
      console.log('Commit successful')

      // Update the remote URL to include credentials for push
      await repoGit.remote(['set-url', 'origin', repoUrl])

      // Push to remote
      // For new branches, use --set-upstream. For existing branches, use --force-with-lease
      try {
        if (branchExists) {
          console.log(`Pushing existing branch '${branch}' with --force-with-lease`)
          await repoGit.push('origin', branch, ['--force-with-lease'])
        } else {
          console.log(`Pushing new branch '${branch}' with --set-upstream`)
          await repoGit.push('origin', branch, ['--set-upstream'])
        }
        console.log('Push successful')
      
      } catch (pushError: any) {
        console.error('Push failed:', pushError)
        // Provide more detailed error message
        const errorMsg = pushError.message || pushError.toString()
        if (errorMsg.includes('authentication') || errorMsg.includes('401')) {
          throw new Error('Push failed: Authentication error. Please check your credentials.')
        } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
          throw new Error('Push failed: Access forbidden. You may not have permission to push to this branch.')
        } else if (errorMsg.includes('protected')) {
          throw new Error('Push failed: Branch is protected. Please check branch protection rules.')
        } else if (errorMsg.includes('missing necessary objects')) {
          throw new Error('Push failed: Repository history is incomplete. This may be due to a previous failed operation. Try deleting the branch on the server and creating a new one.')
        } else {
          throw new Error(`Push failed: ${errorMsg}`)
        }
      }

      // Get the commit info
      const log = await repoGit.log(['-1'])
      const latestCommit = log.latest

      if (!latestCommit) {
        throw new Error('Failed to retrieve commit information')
      }

      // Convert to GitCommit format
      const gitCommit: GitCommit = {
        sha: latestCommit.hash,
        message: latestCommit.message,
        author: {
          name: latestCommit.author_name,
          email: latestCommit.author_email,
          date: latestCommit.date
        },
        committer: {
          name: latestCommit.author_name,
          email: latestCommit.author_email,
          date: latestCommit.date
        },
        parents: [] // simple-git doesn't provide parent info in log
      }

      return gitCommit
    } catch (error) {
      console.error('Git operation failed:', error)
      throw new Error(`Failed to create commit: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      // Restore environment variables
      process.env = originalEnv

      // Cleanup: remove temporary directory
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true })
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup temp directory:', cleanupError)
      }
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
   * Get Pull Request Diff/Changes
   * Uses Bitbucket Server REST API
   * First tries /diff endpoint, falls back to /changes if that fails
   */
  async getPullRequestDiff(prId: number): Promise<{ path: string; diff: string }[]> {
    try {
      // Try the /diff endpoint first (returns unified diff)
      const diffEndpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/pull-requests/${prId}/diff`
      console.log('Bitbucket getPullRequestDiff - trying /diff endpoint:', diffEndpoint)

      try {
        const diffResponse = await this.axiosInstance.get(diffEndpoint, {
          params: {
            contextLines: 3,
            whitespace: 'show'
          }
        })

        console.log('Bitbucket /diff response:', {
          status: diffResponse.status,
          dataType: typeof diffResponse.data,
          dataLength: diffResponse.data?.length || 0,
          firstChars: typeof diffResponse.data === 'string' ? diffResponse.data.substring(0, 100) : 'not string'
        })

        // Parse the unified diff
        const diffText = typeof diffResponse.data === 'string' 
          ? diffResponse.data 
          : JSON.stringify(diffResponse.data)
        
        const fileDiffs = this.parseDiff(diffText)
        
        if (fileDiffs.length > 0) {
          console.log('Successfully parsed', fileDiffs.length, 'files from /diff')
          return fileDiffs
        }
        
        console.log('/diff returned no files, trying /changes endpoint')
      } catch (diffError) {
        console.log('/diff endpoint failed, trying /changes:', diffError)
      }

      // Fallback to /changes endpoint to get list of files
      const changesEndpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/pull-requests/${prId}/changes`
      console.log('Bitbucket getPullRequestDiff - using /changes endpoint:', changesEndpoint)

      const changesResponse = await this.axiosInstance.get(changesEndpoint, {
        params: {
          limit: 1000,
          withComments: false
        }
      })

      console.log('Bitbucket /changes response:', {
        status: changesResponse.status,
        valuesCount: changesResponse.data?.values?.length || 0,
        sampleChange: changesResponse.data?.values?.[0] // Log first change to see structure
      })

      const changes = changesResponse.data?.values || []
      
      // For each file, get its diff using the /diff endpoint with path parameter
      const fileDiffs = await Promise.all(
        changes.map(async (change: any) => {
          const filePath = change.path?.toString || change.path?.name || 'unknown'
          
          try {
            // Get diff for specific file using path parameter
            const fileDiffResponse = await this.axiosInstance.get(diffEndpoint, {
              params: {
                contextLines: 3,
                whitespace: 'show',
                path: filePath // Filter diff to specific file
              }
            })
            
            // Bitbucket Server returns JSON with hunks structure
            const diffData = fileDiffResponse.data
            
            // Convert Bitbucket's JSON format to unified diff format
            let diffText = `diff --git a/${filePath} b/${filePath}\n`
            diffText += `--- a/${filePath}\n`
            diffText += `+++ b/${filePath}\n`
            
            // Process diffs array
            if (diffData.diffs && Array.isArray(diffData.diffs)) {
              for (const diff of diffData.diffs) {
                // Process hunks
                if (diff.hunks && Array.isArray(diff.hunks)) {
                  for (const hunk of diff.hunks) {
                    // Add hunk header
                    diffText += `@@ -${hunk.sourceLine},${hunk.sourceSpan} +${hunk.destinationLine},${hunk.destinationSpan} @@`
                    if (hunk.context) {
                      diffText += ` ${hunk.context}`
                    }
                    diffText += `\n`
                    
                    // Process segments
                    if (hunk.segments && Array.isArray(hunk.segments)) {
                      for (const segment of hunk.segments) {
                        if (segment.lines && Array.isArray(segment.lines)) {
                          for (const line of segment.lines) {
                            // Add line with appropriate prefix
                            let prefix = ' '
                            if (segment.type === 'ADDED') prefix = '+'
                            else if (segment.type === 'REMOVED') prefix = '-'
                            
                            diffText += `${prefix}${line.line}\n`
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            
            return {
              path: filePath,
              diff: diffText
            }
          } catch (err) {
            console.error(`Failed to get diff for ${filePath}:`, err)
            // Fallback: show basic file info
            return {
              path: filePath,
              diff: `diff --git a/${filePath} b/${filePath}\n--- a/${filePath}\n+++ b/${filePath}\n\nFile ${change.type}: ${filePath}\n(Unable to fetch detailed diff)\n`
            }
          }
        })
      )
      
      console.log('Fetched and converted diffs for', fileDiffs.length, 'files')
      return fileDiffs

    } catch (error) {
      console.error('Bitbucket getPullRequestDiff error:', error)
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status)
        console.error('Response data:', error.response?.data)
        const data = error.response?.data as BitbucketErrorResponse | undefined
        const errorMessage = data?.errors?.[0]?.message || error.message
        throw new Error(`Failed to get pull request diff: ${errorMessage}`)
      }
      throw error
    }
  }

  /**
   * Parse unified diff format into file-based diffs
   */
  private parseDiff(diffText: string): { path: string; diff: string }[] {
    if (!diffText || diffText.trim().length === 0) {
      console.log('parseDiff: Empty diff text')
      return []
    }

    const files: { path: string; diff: string }[] = []
    const lines = diffText.split('\n')
    
    let currentFile: { path: string; diff: string } | null = null
    let currentDiff: string[] = []
    
    console.log('parseDiff: Processing', lines.length, 'lines')
    
    for (const line of lines) {
      // New file starts with "diff --git"
      if (line.startsWith('diff --git')) {
        // Save previous file if exists
        if (currentFile && currentDiff.length > 0) {
          currentFile.diff = currentDiff.join('\n')
          files.push(currentFile)
          console.log('parseDiff: Added file', currentFile.path, 'with', currentDiff.length, 'lines')
        }
        
        // Extract file path (format: diff --git a/path b/path)
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
      console.log('parseDiff: Added last file', currentFile.path, 'with', currentDiff.length, 'lines')
    }
    
    console.log('parseDiff: Total files parsed:', files.length)
    return files
  }

  /**
   * Approve a Pull Request
   * Uses Bitbucket Server REST API /pull-requests/{id}/approve endpoint
   */
  async approvePullRequest(prId: number): Promise<PullRequest> {
    try {
      const endpoint = `/rest/api/1.0/projects/${this.projectKey}/repos/${this.repositorySlug}/pull-requests/${prId}/approve`

      // POST to approve endpoint
      await this.axiosInstance.post(endpoint)

      // Fetch and return the updated PR
      return await this.getPullRequest(prId)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as BitbucketErrorResponse | undefined
        const errorMessage = data?.errors?.[0]?.message || error.message
        throw new Error(`Failed to approve pull request: ${errorMessage}`)
      }
      throw error
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
