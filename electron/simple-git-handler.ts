import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { simpleCredentialManager, GitCredential } from './simple-credential-manager'

const execAsync = promisify(exec)

// Git configuration and operations
export interface GitConfig {
  id?: string
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

class SimpleGitCredentialManager {
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

  // Generate simple SSH key pair using ssh-keygen
  async generateSSHKeyPair(keyName: string, passphrase?: string): Promise<{ privateKey: string; publicKey: string }> {
    try {
      const keyPath = path.join(this.sshDir, `git_${keyName}`)

      // Check if key already exists
      if (fs.existsSync(keyPath)) {
        throw new Error(`SSH key '${keyName}' already exists. Please use a different name or delete the existing key.`)
      }

      // Generate SSH key using ssh-keygen
      const isWindows = process.platform === 'win32'
      
      // Build command with proper escaping
      const comment = `${keyName}@electron-app`
      let command: string
      
      if (passphrase) {
        // With passphrase
        command = `ssh-keygen -t rsa -b 4096 -f "${keyPath}" -C "${comment}" -N "${passphrase}"`
      } else {
        // Without passphrase - use empty string
        // On Windows, we need to be careful with the empty string syntax
        if (isWindows) {
          // Windows CMD syntax - empty string needs to be properly quoted
          command = `ssh-keygen -t rsa -b 4096 -f "${keyPath}" -C "${comment}" -N ""`
        } else {
          // Unix/Mac syntax
          command = `ssh-keygen -t rsa -b 4096 -f "${keyPath}" -C "${comment}" -N ""`
        }
      }

      console.log('Generating SSH key with command:', command)
      console.log('Platform:', process.platform)
      console.log('Key path:', keyPath)

      // Execute with timeout to prevent hanging
      // Use CMD on Windows to avoid PowerShell profile issues
      await execAsync(command, {
        timeout: 30000, // 30 second timeout
        windowsHide: true,
        shell: isWindows ? 'cmd.exe' : undefined,
        env: process.env
      })

      // Verify files were created
      if (!fs.existsSync(keyPath)) {
        throw new Error('Private key file was not created')
      }
      if (!fs.existsSync(`${keyPath}.pub`)) {
        throw new Error('Public key file was not created')
      }

      // Read the generated keys
      const privateKey = fs.readFileSync(keyPath, 'utf8')
      const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8')

      console.log('SSH key pair generated successfully')

      return { privateKey, publicKey }
    } catch (error) {
      console.error('Failed to generate SSH key pair:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to generate SSH key: ${error.message}`)
      }
      throw new Error('Failed to generate SSH key pair')
    }
  }

  // Store Git credential
  async storeGitCredential(config: GitConfig): Promise<string> {
    try {
      const credentialId = config.id || simpleCredentialManager.generateCredentialId('git', config.repoUrl)

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

      await simpleCredentialManager.storeCredential(credential)

      // If SSH key, also store in SSH directory for Git to use
      if (config.authType === 'ssh' && config.privateKey) {
        await this.setupSSHKey(credentialId, config.privateKey, config.publicKey, config.repoUrl)
      }

      return credentialId
    } catch (error) {
      console.error('Failed to store Git credential:', error)
      throw error
    }
  }

  // Setup SSH key for Git usage
  private async setupSSHKey(credentialId: string, privateKey: string, publicKey?: string, repoUrl?: string): Promise<void> {
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
      await this.updateSSHConfig(credentialId, keyFileName, repoUrl)
    } catch (error) {
      console.error('Failed to setup SSH key:', error)
      throw error
    }
  }

  // Update SSH config for Git repositories
  private async updateSSHConfig(credentialId: string, keyFileName: string, repoUrl?: string): Promise<void> {
    try {
      const sshConfigPath = path.join(this.sshDir, 'config')
      const hostAlias = `git-${credentialId}`

      // Extract hostname from repository URL
      let hostname = 'github.com' // default
      let port = 22 // default SSH port
      
      if (repoUrl) {
        try {
          const url = new URL(repoUrl)
          hostname = url.hostname
          // If port is specified in URL, use it
          if (url.port) {
            port = parseInt(url.port)
          }
          // For Bitbucket Server on localhost with HTTP port, use SSH port 7999
          if (hostname === 'localhost' && url.port === '7990') {
            port = 7999 // Bitbucket Server default SSH port
          }
        } catch (error) {
          console.warn('Failed to parse repository URL, using default hostname:', error)
        }
      }

      const configEntry = `
# Git credential ${credentialId}
Host ${hostAlias}
    HostName ${hostname}
    ${port !== 22 ? `Port ${port}` : ''}
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
      const credential = await simpleCredentialManager.getCredential(credentialId) as GitCredential
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

      // Detect Git provider type
      const providerType = this.detectProviderType(credential.repoUrl)

      switch (providerType) {
        case 'bitbucket-server':
          return await this.testBitbucketServerTokenAuth(credential)
        case 'bitbucket-cloud':
          return await this.testBitbucketCloudTokenAuth(credential)
        case 'git-repo':
          return await this.testGitRepoTokenAuth(credential)
        default:
          return await this.testGitRepoTokenAuth(credential)
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Token test failed' }
    }
  }

  private async testBitbucketServerTokenAuth(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      const https = await import('https')
      const http = await import('http')

      // Determine protocol
      const isHttps = credential.repoUrl.startsWith('https://')
      const httpModule = isHttps ? https : http

      // Parse URL
      const url = new URL(credential.repoUrl)

      // Test connection to Bitbucket REST API
      const apiPath = '/rest/api/1.0/application-properties'

      return new Promise((resolve) => {
        const options = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: apiPath,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credential.token}`,
            'Accept': 'application/json'
          },
          rejectUnauthorized: false // Allow self-signed certificates for local dev
        }

        const req = httpModule.request(options, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve({ success: true })
            } else if (res.statusCode === 401) {
              resolve({ success: false, error: 'Authentication failed. Please check your access token.' })
            } else {
              resolve({ success: false, error: `Server returned status ${res.statusCode}` })
            }
          })
        })

        req.on('error', (error) => {
          resolve({ success: false, error: `Connection failed: ${error.message}` })
        })

        req.setTimeout(10000, () => {
          req.destroy()
          resolve({ success: false, error: 'Connection timeout' })
        })

        req.end()
      })
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Bitbucket Server token test failed' }
    }
  }

  private async testGitRepoTokenAuth(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      // Test token by attempting a simple git operation
      const tempDir = path.join(os.tmpdir(), `git-test-${Date.now()}`)
      fs.mkdirSync(tempDir, { recursive: true })

      try {
        // Test by attempting to list remote refs
        const repoUrlWithToken = credential.repoUrl.replace('https://', `https://${credential.token}@`)
        const { stdout } = await execAsync(`git ls-remote "${repoUrlWithToken}" HEAD`, { cwd: tempDir })

        // Clean up
        fs.rmSync(tempDir, { recursive: true, force: true })

        return { success: stdout.includes('HEAD') }
      } catch (error) {
        // Clean up on error
        fs.rmSync(tempDir, { recursive: true, force: true })
        throw error
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Git repository token test failed' }
    }
  }

  private async testSSHAuth(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      const hostAlias = `git-${credential.id}`

      // Test SSH connection
      // Note: ssh -T returns non-zero exit code even on success, so we catch the error
      let output = ''
      try {
        const { stdout, stderr } = await execAsync(`ssh -T ${hostAlias}`, {
          timeout: 10000,
          windowsHide: true
        })
        output = stdout + stderr
      } catch (error: any) {
        // SSH -T returns exit code 1 even on successful authentication
        // So we need to check the output, not the exit code
        if (error.stdout || error.stderr) {
          output = (error.stdout || '') + (error.stderr || '')
        } else {
          throw error
        }
      }

      // SSH test is successful if we get authentication success message
      // Different Git providers have different success messages
      const successIndicators = [
        'successfully authenticated',
        'You\'ve successfully authenticated',
        'Hi ',
        'Welcome to',
        'logged in as',
        'authenticated via',
        'shell request failed' // Bitbucket Server - shell access denied but auth succeeded
      ]

      const isSuccess = successIndicators.some(indicator => 
        output.toLowerCase().includes(indicator.toLowerCase())
      )

      if (isSuccess) {
        return { success: true }
      } else {
        // Check for common error messages
        if (output.includes('Permission denied')) {
          return { success: false, error: 'Permission denied. Please check your SSH key is added to the Git provider.' }
        } else if (output.includes('Connection refused')) {
          return { success: false, error: 'Connection refused. Please check the server URL and network connectivity.' }
        } else if (output.includes('Host key verification failed')) {
          return { success: false, error: 'Host key verification failed. Please accept the host key first.' }
        } else if (output.includes('Could not resolve hostname')) {
          return { success: false, error: 'Could not resolve hostname. Please check the repository URL.' }
        } else {
          return { success: false, error: `SSH test failed. Output: ${output.substring(0, 200)}` }
        }
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

      // Detect Git provider type
      const providerType = this.detectProviderType(credential.repoUrl)

      switch (providerType) {
        case 'bitbucket-server':
          return await this.testBitbucketServerAuth(credential)
        case 'bitbucket-cloud':
          return await this.testBitbucketCloudAuth(credential)
        case 'git-repo':
          return await this.testGitRepoAuth(credential)
        default:
          return await this.testGitRepoAuth(credential)
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Username/password test failed' }
    }
  }

  // Detect the type of Git provider from URL
  private detectProviderType(repoUrl: string): 'bitbucket-server' | 'bitbucket-cloud' | 'git-repo' {
    // Bitbucket Cloud
    if (repoUrl.includes('bitbucket.org')) {
      return 'bitbucket-cloud'
    }

    // Bitbucket Server (self-hosted)
    // Indicators: localhost, custom port, or base URL without .git
    if (repoUrl.includes('localhost') ||
      repoUrl.match(/:\d+\/$/) ||
      (!repoUrl.endsWith('.git') && !repoUrl.includes('bitbucket.org'))) {
      return 'bitbucket-server'
    }

    // Regular Git repository
    return 'git-repo'
  }

  // Bitbucket Cloud authentication (username/password or app password)
  private async testBitbucketCloudAuth(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      const https = await import('https')

      // Create base64 encoded credentials
      const auth = Buffer.from(`${credential.username}:${credential.password}`).toString('base64')

      // Test connection to Bitbucket Cloud REST API 2.0
      // Get current user to verify authentication
      const apiPath = '/2.0/user'

      return new Promise((resolve) => {
        const options = {
          hostname: 'api.bitbucket.org',
          port: 443,
          path: apiPath,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }

        const req = https.request(options, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve({ success: true })
            } else if (res.statusCode === 401) {
              resolve({ success: false, error: 'Authentication failed. Please check your username and app password.' })
            } else if (res.statusCode === 403) {
              resolve({ success: false, error: 'Access forbidden. Please check your permissions.' })
            } else {
              resolve({ success: false, error: `Bitbucket Cloud returned status ${res.statusCode}` })
            }
          })
        })

        req.on('error', (error) => {
          resolve({ success: false, error: `Connection failed: ${error.message}` })
        })

        req.setTimeout(10000, () => {
          req.destroy()
          resolve({ success: false, error: 'Connection timeout' })
        })

        req.end()
      })
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Bitbucket Cloud test failed' }
    }
  }

  // Bitbucket Cloud token authentication (OAuth or App Password)
  private async testBitbucketCloudTokenAuth(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      const https = await import('https')

      // For Bitbucket Cloud, tokens can be:
      // 1. App Passwords (used with username in Basic Auth)
      // 2. OAuth tokens (used as Bearer token)

      // Try Bearer token first (OAuth)
      const apiPath = '/2.0/user'

      return new Promise((resolve) => {
        const options = {
          hostname: 'api.bitbucket.org',
          port: 443,
          path: apiPath,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${credential.token}`,
            'Accept': 'application/json'
          }
        }

        const req = https.request(options, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve({ success: true })
            } else if (res.statusCode === 401) {
              // If Bearer fails and we have username, try as App Password
              if (credential.username) {
                resolve(this.testBitbucketCloudAppPassword(credential))
              } else {
                resolve({ success: false, error: 'Authentication failed. Please check your access token.' })
              }
            } else if (res.statusCode === 403) {
              resolve({ success: false, error: 'Access forbidden. Please check your token permissions.' })
            } else {
              resolve({ success: false, error: `Bitbucket Cloud returned status ${res.statusCode}` })
            }
          })
        })

        req.on('error', (error) => {
          resolve({ success: false, error: `Connection failed: ${error.message}` })
        })

        req.setTimeout(10000, () => {
          req.destroy()
          resolve({ success: false, error: 'Connection timeout' })
        })

        req.end()
      })
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Bitbucket Cloud token test failed' }
    }
  }

  // Bitbucket Cloud App Password authentication (username + app password as token)
  private async testBitbucketCloudAppPassword(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      const https = await import('https')

      // App Password uses Basic Auth with username and app password
      const auth = Buffer.from(`${credential.username}:${credential.token}`).toString('base64')

      const apiPath = '/2.0/user'

      return new Promise((resolve) => {
        const options = {
          hostname: 'api.bitbucket.org',
          port: 443,
          path: apiPath,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        }

        const req = https.request(options, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve({ success: true })
            } else if (res.statusCode === 401) {
              resolve({ success: false, error: 'Authentication failed. Please check your username and app password.' })
            } else {
              resolve({ success: false, error: `Bitbucket Cloud returned status ${res.statusCode}` })
            }
          })
        })

        req.on('error', (error) => {
          resolve({ success: false, error: `Connection failed: ${error.message}` })
        })

        req.setTimeout(10000, () => {
          req.destroy()
          resolve({ success: false, error: 'Connection timeout' })
        })

        req.end()
      })
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Bitbucket Cloud app password test failed' }
    }
  }

  // Bitbucket Server authentication (self-hosted)
  private async testBitbucketServerAuth(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      const https = await import('https')
      const http = await import('http')

      // Determine protocol
      const isHttps = credential.repoUrl.startsWith('https://')
      const httpModule = isHttps ? https : http

      // Create base64 encoded credentials
      const auth = Buffer.from(`${credential.username}:${credential.password}`).toString('base64')

      // Parse URL
      const url = new URL(credential.repoUrl)

      // Test connection to Bitbucket REST API
      const apiPath = '/rest/api/1.0/application-properties'

      return new Promise((resolve) => {
        const options = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: apiPath,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          rejectUnauthorized: false // Allow self-signed certificates for local dev
        }

        const req = httpModule.request(options, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve({ success: true })
            } else if (res.statusCode === 401) {
              resolve({ success: false, error: 'Authentication failed. Please check your username and password.' })
            } else {
              resolve({ success: false, error: `Server returned status ${res.statusCode}` })
            }
          })
        })

        req.on('error', (error) => {
          resolve({ success: false, error: `Connection failed: ${error.message}` })
        })

        req.setTimeout(10000, () => {
          req.destroy()
          resolve({ success: false, error: 'Connection timeout' })
        })

        req.end()
      })
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Bitbucket Server test failed' }
    }
  }

  private async testGitRepoAuth(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      // Create a temporary directory for testing
      const tempDir = path.join(os.tmpdir(), `git-test-${Date.now()}`)
      fs.mkdirSync(tempDir, { recursive: true })

      try {
        // Test by attempting to list remote refs
        const repoUrlWithAuth = credential.repoUrl.replace('https://', `https://${credential.username}:${credential.password}@`)
        const { stdout } = await execAsync(`git ls-remote "${repoUrlWithAuth}" HEAD`, { cwd: tempDir })

        // Clean up
        fs.rmSync(tempDir, { recursive: true, force: true })

        return { success: stdout.includes('HEAD') }
      } catch (error) {
        // Clean up on error
        fs.rmSync(tempDir, { recursive: true, force: true })
        throw error
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Git repository test failed' }
    }
  }

  // Clone repository using stored credentials
  async cloneRepository(credentialId: string, localPath: string, branch?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId) as GitCredential
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
}

// Initialize Git credential manager
const simpleGitCredentialManager = new SimpleGitCredentialManager()

// IPC Handlers for Git operations
export function setupSimpleGitHandlers(): void {
  // Store Git credentials
  ipcMain.handle('git:store-credential', async (_, config: GitConfig) => {
    try {
      const credentialId = await simpleGitCredentialManager.storeGitCredential(config)
      return { success: true, credentialId }
    } catch (error) {
      console.error('Failed to store Git credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Test Git credential
  ipcMain.handle('git:test-credential', async (_, credentialId: string) => {
    try {
      return await simpleGitCredentialManager.testGitCredential(credentialId)
    } catch (error) {
      console.error('Failed to test Git credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // List Git credentials
  ipcMain.handle('git:list-credentials', async (_, environment?: string) => {
    try {
      const credentials = await simpleCredentialManager.listCredentials('git', environment)
      return { success: true, data: credentials }
    } catch (error) {
      console.error('Failed to list Git credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get Git credential
  ipcMain.handle('git:get-credential', async (_, credentialId: string) => {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId)
      return { success: true, data: credential }
    } catch (error) {
      console.error('Failed to get Git credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Delete Git credential
  ipcMain.handle('git:delete-credential', async (_, credentialId: string) => {
    try {
      await simpleGitCredentialManager.cleanupSSHKey(credentialId)
      const success = await simpleCredentialManager.deleteCredential(credentialId)
      return { success }
    } catch (error) {
      console.error('Failed to delete Git credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Generate SSH key pair
  ipcMain.handle('git:generate-ssh-key', async (_, keyName: string, passphrase?: string) => {
    try {
      const keyPair = await simpleGitCredentialManager.generateSSHKeyPair(keyName, passphrase)
      return { success: true, data: keyPair }
    } catch (error) {
      console.error('Failed to generate SSH key:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Clone repository
  ipcMain.handle('git:clone-repository', async (_, credentialId: string, localPath: string, branch?: string) => {
    try {
      return await simpleGitCredentialManager.cloneRepository(credentialId, localPath, branch)
    } catch (error) {
      console.error('Failed to clone repository:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Find Git credentials by repository URL
  ipcMain.handle('git:find-credentials-by-repo', async (_, repoUrl: string) => {
    try {
      const credentials = await simpleCredentialManager.findCredentials({ type: 'git', repoUrl })
      return { success: true, data: credentials }
    } catch (error) {
      console.error('Failed to find Git credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}