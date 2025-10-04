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
      
      // Generate SSH key using ssh-keygen
      let command = `ssh-keygen -t rsa -b 4096 -f "${keyPath}" -C "${keyName}@electron-app"`
      if (passphrase) {
        command += ` -N "${passphrase}"`
      } else {
        command += ' -N ""'
      }

      await execAsync(command)

      // Read the generated keys
      const privateKey = fs.readFileSync(keyPath, 'utf8')
      const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8')

      return { privateKey, publicKey }
    } catch (error) {
      console.error('Failed to generate SSH key pair:', error)
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
      const filteredLines = []
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
      return { success: false, error: error instanceof Error ? error.message : 'Token test failed' }
    }
  }

  private async testSSHAuth(credential: GitCredential): Promise<{ success: boolean; error?: string }> {
    try {
      const hostAlias = `git-${credential.id}`
      
      // Test SSH connection
      const testCommand = `ssh -T ${hostAlias} 2>&1 || true`
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
      return { success: false, error: error instanceof Error ? error.message : 'Username/password test failed' }
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
        const filteredLines = []
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