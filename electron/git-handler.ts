import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as forge from 'node-forge'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { secureCredentialManager, GitCredential } from './secure-credential-manager'

const execAsync = promisify(exec)

// Git configuration and operations
export interface GitConfig {
  id: string
  name: string
  repoUrl: string
  authType: 'token' | 'ssh' | 'userpass'
  username?: string
  token?: string
  privateKey?: string
  publicKey?: string
  passphrase?: string
  password?: string
  environment?: string
  tags?: string[]
}

export interface GitRepository {
  id: string
  name: string
  url: string
  branch?: string
  localPath?: string
  credentialId: string
  lastSync?: string
  status?: 'active' | 'inactive' | 'error'
}

class GitCredentialManager {
  private sshDir: string
  private gitConfigDir: string

  constructor() {
    this.sshDir = path.join(os.homedir(), '.ssh')
    this.gitConfigDir = path.join(os.homedir(), '.gitconfig.d')
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    try {
      if (!fs.existsSync(this.sshDir)) {
        fs.mkdirSync(this.sshDir, { mode: 0o700 })
      }
      if (!fs.existsSync(this.gitConfigDir)) {
        fs.mkdirSync(this.gitConfigDir, { mode: 0o755 })
      }
    } catch (error) {
      console.error('Failed to create Git directories:', error)
    }
  }

  // Generate SSH key pair
  async generateSSHKeyPair(keyName: string, passphrase?: string): Promise<{ privateKey: string; publicKey: string }> {
    try {
      const keyPair = forge.pki.rsa.generateKeyPair({ bits: 4096 })
      
      // Convert to OpenSSH format
      const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey)
      const publicKeyPem = forge.pki.publicKeyToPem(keyPair.publicKey)
      
      // Convert public key to OpenSSH format
      const publicKeyDer = forge.asn1.toDer(forge.pki.publicKeyToAsn1(keyPair.publicKey)).getBytes()
      const publicKeyBase64 = forge.util.encode64(publicKeyDer)
      const publicKeyOpenSSH = `ssh-rsa ${publicKeyBase64} ${keyName}@electron-app`

      let privateKeyFormatted = privateKeyPem
      if (passphrase) {
        // Encrypt private key with passphrase (simplified - in production use proper OpenSSH format)
        const cipher = forge.cipher.createCipher('AES-CBC', passphrase)
        cipher.start({ iv: forge.random.getBytesSync(16) })
        cipher.update(forge.util.createBuffer(privateKeyPem))
        cipher.finish()
        privateKeyFormatted = forge.util.encode64(cipher.output.getBytes())
      }

      return {
        privateKey: privateKeyFormatted,
        publicKey: publicKeyOpenSSH
      }
    } catch (error) {
      console.error('Failed to generate SSH key pair:', error)
      throw new Error('Failed to generate SSH key pair')
    }
  }

  // Store Git credential
  async storeGitCredential(config: GitConfig): Promise<string> {
    try {
      const credentialId = config.id || secureCredentialManager.generateCredentialId('git', config.repoUrl)
      
      const credential: GitCredential = {
        id: credentialId,
        name: config.name,
        type: 'git',
        repoUrl: config.repoUrl,
        authType: config.authType,
        username: config.username,
        token: config.token,
        privateKey: config.privateKey,
        publicKey: config.publicKey,
        passphrase: config.passphrase,
        password: config.password,
        environment: config.environment,
        tags: config.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await secureCredentialManager.storeCredential(credential)

      // If SSH key, also store in SSH directory for Git to use
      if (config.authType === 'ssh' && config.privateKey) {
        await this.setupSSHKey(credentialId, config.privateKey, config.publicKey)
      }

      return credentialId
    } catch (error) {
      console.error('Failed to store Git credential:', error)
      throw error
    }
  }

  // Setup SSH key for Git usage
  private async setupSSHKey(credentialId: string, privateKey: string, publicKey?: string): Promise<void> {
    try {
      const keyFileName = `git_${credentialId}`
      const privateKeyPath = path.join(this.sshDir, keyFileName)
      const publicKeyPath = path.join(this.sshDir, `${keyFileName}.pub`)

      // Write private key
      fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 })

      // Write public key if provided
      if (publicKey) {
        fs.writeFileSync(publicKeyPath, publicKey, { mode: 0o644 })
      }

      // Update SSH config
      await this.updateSSHConfig(credentialId, keyFileName)
    } catch (error) {
      console.error('Failed to setup SSH key:', error)
      throw error
    }
  }

  // Update SSH config for Git repositories
  private async updateSSHConfig(credentialId: string, keyFileName: string): Promise<void> {
    try {
      const sshConfigPath = path.join(this.sshDir, 'config')
      const hostAlias = `git-${credentialId}`
      
      const configEntry = `
# Git credential ${credentialId}
Host ${hostAlias}
    HostName github.com
    User git
    IdentityFile ~/.ssh/${keyFileName}
    IdentitiesOnly yes
    StrictHostKeyChecking no

`

      // Read existing config
      let existingConfig = ''
      if (fs.existsSync(sshConfigPath)) {
        existingConfig = fs.readFileSync(sshConfigPath, 'utf8')
      }

      // Remove existing entry for this credential
      const lines = existingConfig.split('\n')
      const filteredLines: string[] = []
      let skipSection = false

      for (const line of lines) {
        if (line.includes(`# Git credential ${credentialId}`)) {
          skipSection = true
          continue
        }
        if (skipSection && line.startsWith('Host ')) {
          skipSection = false
        }
        if (!skipSection) {
          filteredLines.push(line)
        }
      }

      // Add new config entry
      const newConfig = filteredLines.join('\n') + configEntry
      fs.writeFileSync(sshConfigPath, newConfig, { mode: 0o600 })
    } catch (error) {
      console.error('Failed to update SSH config:', error)
    }
  }

  // Test Git credential
  async testGitCredential(credentialId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      switch (credential.authType) {
        case 'token':
          return await this.testTokenAuth(credential)
        case 'ssh':
          return await this.testSSHAuth(credential)
        case 'userpass':
          return await this.testUserPassAuth(credential)
        default:
          return { success: false, error: 'Unsupported auth type' }
      }
    } catch (error) {
      console.error('Failed to test Git credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async testTokenAuth(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      if (!credential.token) {
        return { success: false, error: 'Token not found' }
      }

      // Detect provider type
      const providerType = this.detectProviderType(credential.repoUrl)

      // Test token by making API call to Git provider
      const repoUrl = new URL(credential.repoUrl)
      let apiUrl = ''
      let headers: Record<string, string> = {}

      if (repoUrl.hostname === 'github.com') {
        const pathParts = repoUrl.pathname.split('/')
        const owner = pathParts[1]
        const repo = pathParts[2]?.replace('.git', '')
        apiUrl = `https://api.github.com/repos/${owner}/${repo}`
        headers = { 'Authorization': `token ${credential.token}` }
      } else if (repoUrl.hostname === 'gitlab.com') {
        const pathParts = repoUrl.pathname.split('/')
        const owner = pathParts[1]
        const repo = pathParts[2]?.replace('.git', '')
        apiUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${owner}/${repo}`)}`
        headers = { 'Authorization': `Bearer ${credential.token}` }
      } else if (providerType === 'bitbucket-server') {
        // Bitbucket Server: Test with user API endpoint
        // Format: http://server:port/rest/api/1.0/users/{username}
        const baseUrl = `${repoUrl.protocol}//${repoUrl.host}`
        apiUrl = `${baseUrl}/rest/api/1.0/application-properties`
        
        // Bitbucket Server uses Basic Auth with username:token
        if (credential.username) {
          const auth = Buffer.from(`${credential.username}:${credential.token}`).toString('base64')
          headers = { 'Authorization': `Basic ${auth}` }
        } else {
          return { success: false, error: 'Username required for Bitbucket Server authentication' }
        }
      } else if (providerType === 'bitbucket-cloud') {
        // Bitbucket Cloud: Test with user API endpoint
        apiUrl = 'https://api.bitbucket.org/2.0/user'
        
        // Bitbucket Cloud uses Basic Auth with username:app_password
        if (credential.username) {
          const auth = Buffer.from(`${credential.username}:${credential.token}`).toString('base64')
          headers = { 'Authorization': `Basic ${auth}` }
        } else {
          return { success: false, error: 'Username required for Bitbucket Cloud authentication' }
        }
      } else {
        return { success: false, error: 'Unsupported Git provider for token testing' }
      }

      const { stdout } = await execAsync(`curl -s -H "Authorization: ${headers.Authorization}" "${apiUrl}"`)
      const response = JSON.parse(stdout)
      
      // Check for successful response
      if (response.id || response.name || response.version || response.username || response.display_name) {
        return { success: true }
      } else if (response.errors || response.error) {
        return { success: false, error: response.errors?.[0]?.message || response.error?.message || 'Authentication failed' }
      } else {
        return { success: false, error: 'Invalid token or repository not accessible' }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Token test failed' }
    }
  }

  private async testSSHAuth(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      const hostAlias = `git-${credential.id}`
      const testCommand = `ssh -T ${hostAlias} 2>&1`
      
      const { stdout, stderr } = await execAsync(testCommand)
      const output = stdout + stderr
      
      // SSH test is successful if we get authentication success message
      if (output.includes('successfully authenticated') || output.includes('Hi ')) {
        return { success: true }
      } else {
        return { success: false, error: `SSH test failed: ${output}` }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'SSH test failed' }
    }
  }

  private async testUserPassAuth(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      if (!credential.username || !credential.password) {
        return { success: false, error: 'Username or password not found' }
      }

      // Detect provider type
      const providerType = this.detectProviderType(credential.repoUrl)

      // For Bitbucket Server/Cloud, test using API (same as token auth but with password)
      if (providerType === 'bitbucket-server' || providerType === 'bitbucket-cloud') {
        const repoUrl = new URL(credential.repoUrl)
        let apiUrl = ''
        
        if (providerType === 'bitbucket-server') {
          const baseUrl = `${repoUrl.protocol}//${repoUrl.host}`
          apiUrl = `${baseUrl}/rest/api/1.0/application-properties`
        } else {
          apiUrl = 'https://api.bitbucket.org/2.0/user'
        }
        
        // Use Basic Auth with username:password
        const auth = Buffer.from(`${credential.username}:${credential.password}`).toString('base64')
        const headers = { 'Authorization': `Basic ${auth}` }

        const { stdout } = await execAsync(`curl -s -H "Authorization: ${headers.Authorization}" "${apiUrl}"`)
        const response = JSON.parse(stdout)
        
        // Check for successful response
        if (response.id || response.name || response.version || response.username || response.display_name) {
          return { success: true }
        } else if (response.errors || response.error) {
          return { success: false, error: response.errors?.[0]?.message || response.error?.message || 'Authentication failed' }
        } else {
          return { success: false, error: 'Invalid credentials or server not accessible' }
        }
      }

      // For other providers (GitHub, GitLab, etc.), try to clone if it's a valid repo URL
      // Only attempt clone if the URL looks like a repository (ends with .git or has path segments)
      const pathSegments = credential.repoUrl.split('/').filter(s => s)
      if (!credential.repoUrl.endsWith('.git') && pathSegments.length <= 3) {
        return { success: false, error: 'Please provide a full repository URL (e.g., https://github.com/user/repo.git)' }
      }

      // Create a temporary directory for testing
      const tempDir = path.join(os.tmpdir(), `git-test-${Date.now()}`)
      fs.mkdirSync(tempDir, { recursive: true })

      try {
        // Test by attempting to clone (shallow) with credentials
        const repoUrlWithAuth = credential.repoUrl.replace('https://', `https://${credential.username}:${credential.password}@`)
        const { stdout, stderr } = await execAsync(`git clone --depth 1 "${repoUrlWithAuth}" "${tempDir}/test-repo"`)
        
        // Clean up
        fs.rmSync(tempDir, { recursive: true, force: true })
        
        return { success: true }
      } catch (error) {
        // Clean up on error
        fs.rmSync(tempDir, { recursive: true, force: true })
        throw error
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Username/password test failed' }
    }
  }

  // Clone repository using stored credentials
  async cloneRepository(credentialId: string, localPath: string, branch?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      let cloneCommand = ''
      const branchFlag = branch ? `-b ${branch}` : ''

      switch (credential.authType) {
        case 'token':
          if (!credential.token) {
            return { success: false, error: 'Token not found' }
          }
          const repoUrlWithToken = credential.repoUrl.replace('https://', `https://${credential.token}@`)
          cloneCommand = `git clone ${branchFlag} "${repoUrlWithToken}" "${localPath}"`
          break

        case 'ssh':
          const hostAlias = `git-${credential.id}`
          const sshRepoUrl = credential.repoUrl.replace('https://github.com/', `${hostAlias}:`)
          cloneCommand = `git clone ${branchFlag} "${sshRepoUrl}" "${localPath}"`
          break

        case 'userpass':
          if (!credential.username || !credential.password) {
            return { success: false, error: 'Username or password not found' }
          }
          const repoUrlWithAuth = credential.repoUrl.replace('https://', `https://${credential.username}:${credential.password}@`)
          cloneCommand = `git clone ${branchFlag} "${repoUrlWithAuth}" "${localPath}"`
          break

        default:
          return { success: false, error: 'Unsupported auth type' }
      }

      await execAsync(cloneCommand)
      return { success: true }
    } catch (error) {
      console.error('Failed to clone repository:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Clone failed' }
    }
  }

  // Get Git repositories using a credential
  async getRepositoriesForCredential(credentialId: string): Promise<GitRepository[]> {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return []
      }

      // This would typically come from a database or config file
      // For now, return the single repository associated with the credential
      return [{
        id: `repo-${credentialId}`,
        name: credential.name,
        url: credential.repoUrl,
        credentialId: credentialId,
        status: 'active'
      }]
    } catch (error) {
      console.error('Failed to get repositories for credential:', error)
      return []
    }
  }

  // Remove SSH key and config when credential is deleted
  async cleanupSSHKey(credentialId: string): Promise<void> {
    try {
      const keyFileName = `git_${credentialId}`
      const privateKeyPath = path.join(this.sshDir, keyFileName)
      const publicKeyPath = path.join(this.sshDir, `${keyFileName}.pub`)

      // Remove key files
      if (fs.existsSync(privateKeyPath)) {
        fs.unlinkSync(privateKeyPath)
      }
      if (fs.existsSync(publicKeyPath)) {
        fs.unlinkSync(publicKeyPath)
      }

      // Remove from SSH config
      const sshConfigPath = path.join(this.sshDir, 'config')
      if (fs.existsSync(sshConfigPath)) {
        const existingConfig = fs.readFileSync(sshConfigPath, 'utf8')
        const lines = existingConfig.split('\n')
        const filteredLines: string[] = []
        let skipSection = false

        for (const line of lines) {
          if (line.includes(`# Git credential ${credentialId}`)) {
            skipSection = true
            continue
          }
          if (skipSection && line.startsWith('Host ')) {
            skipSection = false
          }
          if (!skipSection) {
            filteredLines.push(line)
          }
        }

        fs.writeFileSync(sshConfigPath, filteredLines.join('\n'), { mode: 0o600 })
      }
    } catch (error) {
      console.error('Failed to cleanup SSH key:', error)
    }
  }

  // Detect the type of Git provider from URL
  detectProviderType(repoUrl: string): 'bitbucket-server' | 'bitbucket-cloud' | 'git-repo' {
    // Bitbucket Cloud
    if (repoUrl.includes('bitbucket.org')) {
      return 'bitbucket-cloud'
    }

    // Bitbucket Server (self-hosted)
    // Indicators: localhost, custom port, /scm/ path pattern, or base URL without .git
    if (repoUrl.includes('localhost') ||
      repoUrl.includes('/scm/') ||
      repoUrl.match(/:\d+\//) ||
      (!repoUrl.endsWith('.git') && !repoUrl.includes('bitbucket.org'))) {
      return 'bitbucket-server'
    }

    // Regular Git repository
    return 'git-repo'
  }

  // Create appropriate Git provider client based on provider type
  async createProviderClient(providerType: string, credential: GitCredential): Promise<any> {
    switch (providerType) {
      case 'bitbucket-server': {
        const { BitbucketServerClient } = await import('./git-providers/bitbucket-server-client')
        return new BitbucketServerClient(credential.repoUrl, credential)
      }
      case 'bitbucket-cloud': {
        // TODO: Implement BitbucketCloudClient in Phase 11
        throw new Error('Bitbucket Cloud support not yet implemented')
      }
      default:
        throw new Error(`Unsupported provider type: ${providerType}`)
    }
  }

  // Send webhook notification
  async sendWebhookNotification(webhookUrl: string, payload: any): Promise<void> {
    try {
      const https = await import('https')
      const http = await import('http')
      const url = new URL(webhookUrl)

      const isHttps = url.protocol === 'https:'
      const httpModule = isHttps ? https : http

      // Detect webhook type and format payload accordingly
      const formattedPayload = this.formatWebhookPayload(webhookUrl, payload)
      const body = JSON.stringify(formattedPayload)

      return new Promise((resolve, reject) => {
        const options = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          },
          rejectUnauthorized: false // Allow self-signed certificates
        }

        const req = httpModule.request(options, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve()
            } else {
              reject(new Error(`Webhook returned status ${res.statusCode}: ${data}`))
            }
          })
        })

        req.on('error', (error) => {
          reject(error)
        })

        req.setTimeout(10000, () => {
          req.destroy()
          reject(new Error('Webhook request timeout'))
        })

        req.write(body)
        req.end()
      })
    } catch (error) {
      console.error('Failed to send webhook notification:', error)
      throw error
    }
  }

  // Format webhook payload based on webhook type (MS Teams or Slack)
  private formatWebhookPayload(webhookUrl: string, payload: any): any {
    // MS Teams webhook
    if (webhookUrl.includes('office.com') || webhookUrl.includes('webhook.office')) {
      return {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        summary: payload.title || 'Pull Request Notification',
        themeColor: '0078D7',
        title: payload.title || 'Pull Request Created',
        sections: [
          {
            activityTitle: payload.author || 'Unknown Author',
            activitySubtitle: payload.timestamp || new Date().toISOString(),
            facts: [
              {
                name: 'Repository:',
                value: payload.repository || 'N/A'
              },
              {
                name: 'Branch:',
                value: `${payload.sourceBranch} → ${payload.targetBranch}` || 'N/A'
              },
              {
                name: 'Affected Applications:',
                value: payload.affectedApplications?.join(', ') || 'N/A'
              }
            ],
            text: payload.description || ''
          }
        ],
        potentialAction: payload.prUrl ? [
          {
            '@type': 'OpenUri',
            name: 'View Pull Request',
            targets: [
              {
                os: 'default',
                uri: payload.prUrl
              }
            ]
          }
        ] : []
      }
    }

    // Slack webhook
    if (webhookUrl.includes('slack.com')) {
      return {
        text: payload.title || 'Pull Request Notification',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: payload.title || 'Pull Request Created'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Author:*\n${payload.author || 'Unknown'}`
              },
              {
                type: 'mrkdwn',
                text: `*Repository:*\n${payload.repository || 'N/A'}`
              },
              {
                type: 'mrkdwn',
                text: `*Branch:*\n${payload.sourceBranch} → ${payload.targetBranch}`
              },
              {
                type: 'mrkdwn',
                text: `*Affected Apps:*\n${payload.affectedApplications?.join(', ') || 'N/A'}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: payload.description || ''
            }
          }
        ],
        attachments: payload.prUrl ? [
          {
            color: '#0078D7',
            actions: [
              {
                type: 'button',
                text: 'View Pull Request',
                url: payload.prUrl
              }
            ]
          }
        ] : []
      }
    }

    // Generic webhook - return payload as-is
    return payload
  }
}

// Initialize Git credential manager
const gitCredentialManager = new GitCredentialManager()

// IPC Handlers for Git operations
export function setupGitHandlers(): void {
  // Store Git credentials
  ipcMain.handle('git:store-credential', async (_, config: GitConfig) => {
    try {
      const credentialId = await gitCredentialManager.storeGitCredential(config)
      return { success: true, credentialId }
    } catch (error) {
      console.error('Failed to store Git credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Test Git credential
  ipcMain.handle('git:test-credential', async (_, credentialId: string) => {
    try {
      return await gitCredentialManager.testGitCredential(credentialId)
    } catch (error) {
      console.error('Failed to test Git credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // List Git credentials
  ipcMain.handle('git:list-credentials', async (_, environment?: string) => {
    try {
      const credentials = await secureCredentialManager.listCredentials('git', environment)
      return { success: true, data: credentials }
    } catch (error) {
      console.error('Failed to list Git credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get Git credential
  ipcMain.handle('git:get-credential', async (_, credentialId: string) => {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId)
      return { success: true, data: credential }
    } catch (error) {
      console.error('Failed to get Git credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Delete Git credential
  ipcMain.handle('git:delete-credential', async (_, credentialId: string) => {
    try {
      await gitCredentialManager.cleanupSSHKey(credentialId)
      const success = await secureCredentialManager.deleteCredential(credentialId)
      return { success }
    } catch (error) {
      console.error('Failed to delete Git credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Generate SSH key pair
  ipcMain.handle('git:generate-ssh-key', async (_, keyName: string, passphrase?: string) => {
    try {
      const keyPair = await gitCredentialManager.generateSSHKeyPair(keyName, passphrase)
      return { success: true, data: keyPair }
    } catch (error) {
      console.error('Failed to generate SSH key:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Clone repository
  ipcMain.handle('git:clone-repository', async (_, credentialId: string, localPath: string, branch?: string) => {
    try {
      return await gitCredentialManager.cloneRepository(credentialId, localPath, branch)
    } catch (error) {
      console.error('Failed to clone repository:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Find Git credentials by repository URL
  ipcMain.handle('git:find-credentials-by-repo', async (_, repoUrl: string) => {
    try {
      const credentials = await secureCredentialManager.findCredentials({ type: 'git', repoUrl })
      return { success: true, data: credentials }
    } catch (error) {
      console.error('Failed to find Git credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // List files in repository
  ipcMain.handle('git:listFiles', async (_, credentialId: string, path: string, branch: string) => {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      const providerType = gitCredentialManager.detectProviderType(credential.repoUrl)
      const client = await gitCredentialManager.createProviderClient(providerType, credential)
      
      const files = await client.listFiles(path, branch)
      return { success: true, data: files }
    } catch (error) {
      console.error('Failed to list files:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get file content from repository
  ipcMain.handle('git:getFileContent', async (_, credentialId: string, filePath: string, branch: string) => {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      const providerType = gitCredentialManager.detectProviderType(credential.repoUrl)
      const client = await gitCredentialManager.createProviderClient(providerType, credential)
      
      const content = await client.getFileContent(filePath, branch)
      return { success: true, data: content }
    } catch (error) {
      console.error('Failed to get file content:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Create a new branch
  ipcMain.handle('git:createBranch', async (_, credentialId: string, baseBranch: string, newBranchName: string) => {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      const providerType = gitCredentialManager.detectProviderType(credential.repoUrl)
      const client = await gitCredentialManager.createProviderClient(providerType, credential)
      
      const branch = await client.createBranch(baseBranch, newBranchName)
      return { success: true, data: branch }
    } catch (error) {
      console.error('Failed to create branch:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Delete a branch
  ipcMain.handle('git:deleteBranch', async (_, credentialId: string, branchName: string) => {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      const providerType = gitCredentialManager.detectProviderType(credential.repoUrl)
      const client = await gitCredentialManager.createProviderClient(providerType, credential)
      
      await client.deleteBranch(branchName)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete branch:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Commit changes to a branch
  ipcMain.handle('git:commitChanges', async (_, credentialId: string, branch: string, changes: any[], commitMessage: string) => {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      const providerType = gitCredentialManager.detectProviderType(credential.repoUrl)
      const client = await gitCredentialManager.createProviderClient(providerType, credential)
      
      // Use credential username and a default email for author
      const author = {
        name: credential.username,
        email: `${credential.username}@config-hub.local`
      }
      
      const commit = await client.createCommit(branch, changes, commitMessage, author)
      return { success: true, data: commit }
    } catch (error) {
      console.error('Failed to commit changes:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Create a Pull Request
  ipcMain.handle('git:createPullRequest', async (_, credentialId: string, sourceBranch: string, targetBranch: string, title: string, description: string, reviewers?: string[]) => {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      const providerType = gitCredentialManager.detectProviderType(credential.repoUrl)
      const client = await gitCredentialManager.createProviderClient(providerType, credential)
      
      const pullRequest = await client.createPullRequest(sourceBranch, targetBranch, title, description, reviewers)
      return { success: true, data: pullRequest }
    } catch (error) {
      console.error('Failed to create pull request:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // List Pull Requests
  ipcMain.handle('git:listPullRequests', async (_, credentialId: string, state?: 'open' | 'merged' | 'declined' | 'all', limit?: number) => {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      const providerType = gitCredentialManager.detectProviderType(credential.repoUrl)
      const client = await gitCredentialManager.createProviderClient(providerType, credential)
      
      const pullRequests = await client.listPullRequests(state, limit)
      return { success: true, data: pullRequests }
    } catch (error) {
      console.error('Failed to list pull requests:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get Pull Request details
  ipcMain.handle('git:getPullRequest', async (_, credentialId: string, prId: number) => {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      const providerType = gitCredentialManager.detectProviderType(credential.repoUrl)
      const client = await gitCredentialManager.createProviderClient(providerType, credential)
      
      const pullRequest = await client.getPullRequest(prId)
      return { success: true, data: pullRequest }
    } catch (error) {
      console.error('Failed to get pull request:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Approve a Pull Request
  ipcMain.handle('git:approvePullRequest', async (_, credentialId: string, prId: number) => {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      const providerType = gitCredentialManager.detectProviderType(credential.repoUrl)
      const client = await gitCredentialManager.createProviderClient(providerType, credential)
      
      const result = await client.approvePullRequest(prId)
      return { success: true, data: result }
    } catch (error) {
      console.error('Failed to approve pull request:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Merge a Pull Request
  ipcMain.handle('git:mergePullRequest', async (_, credentialId: string, prId: number, mergeStrategy?: string) => {
    try {
      const credential = await secureCredentialManager.getCredential(credentialId) as GitCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      const providerType = gitCredentialManager.detectProviderType(credential.repoUrl)
      const client = await gitCredentialManager.createProviderClient(providerType, credential)
      
      const result = await client.mergePullRequest(prId, mergeStrategy)
      return { success: true, data: result }
    } catch (error) {
      console.error('Failed to merge pull request:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Send webhook notification
  ipcMain.handle('git:sendWebhookNotification', async (_, webhookUrl: string, payload: any) => {
    try {
      await gitCredentialManager.sendWebhookNotification(webhookUrl, payload)
      return { success: true }
    } catch (error) {
      console.error('Failed to send webhook notification:', error)
      // Don't fail the entire operation if webhook fails - just log and return success: false
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}