import { app, safeStorage } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

// Types for different credential types
export interface BaseCredential {
  id: string
  name: string
  type: 'git' | 'helm' | 'argocd' | 'vault'
  environment?: string
  createdAt: string
  updatedAt: string
  tags?: string[]
}

export interface GitCredential extends BaseCredential {
  type: 'git'
  repoUrl: string
  authType: 'token' | 'ssh' | 'userpass'
  username?: string
  token?: string
  privateKey?: string
  publicKey?: string
  passphrase?: string
  password?: string
}

export interface HelmCredential extends BaseCredential {
  type: 'helm'
  registryUrl: string
  authType: 'userpass' | 'token' | 'cert'
  username?: string
  password?: string
  token?: string
  certFile?: string
  keyFile?: string
  caFile?: string
  insecureSkipTlsVerify?: boolean
}

export interface ArgoCDCredential extends BaseCredential {
  type: 'argocd'
  serverUrl: string
  token: string
  username?: string
  namespace?: string
}

export interface VaultCredential extends BaseCredential {
  type: 'vault'
  serverUrl: string
  authMethod: 'token' | 'userpass' | 'ldap' | 'kubernetes' | 'aws' | 'azure'
  token?: string
  username?: string
  password?: string
  namespace?: string
  mountPath: string
  roleId?: string
  secretId?: string
  kubernetesRole?: string
  awsRole?: string
  azureRole?: string
}

export type Credential = GitCredential | HelmCredential | ArgoCDCredential | VaultCredential

// Simple credential storage manager using Electron's safeStorage
export class SimpleCredentialManager {
  private readonly metadataFile: string
  private readonly sensitiveDir: string

  constructor() {
    this.metadataFile = path.join(app.getPath('userData'), 'credentials-metadata.json')
    this.sensitiveDir = path.join(app.getPath('userData'), 'sensitive')
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    try {
      if (!fs.existsSync(this.sensitiveDir)) {
        fs.mkdirSync(this.sensitiveDir, { mode: 0o700, recursive: true })
      }
    } catch (error) {
      console.error('Failed to create directories:', error)
    }
  }

  // Encrypt sensitive data using Electron's safeStorage or fallback
  private encryptData(data: string): string {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(data)
        return `safe:${encrypted.toString('base64')}`
      }
    } catch (error) {
      console.debug('safeStorage not available, using fallback encryption')
    }

    // Fallback to Node.js crypto
    const key = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return `crypto:${key.toString('hex')}:${iv.toString('hex')}:${encrypted}`
  }

  // Decrypt sensitive data
  private decryptData(encryptedData: string): string {
    if (encryptedData.startsWith('safe:')) {
      const base64Data = encryptedData.substring(5)
      const buffer = Buffer.from(base64Data, 'base64')
      return safeStorage.decryptString(buffer)
    }

    if (encryptedData.startsWith('crypto:')) {
      const parts = encryptedData.substring(7).split(':')
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
      }
      
      const key = Buffer.from(parts[0], 'hex')
      const iv = Buffer.from(parts[1], 'hex')
      const encrypted = parts[2]
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    }

    throw new Error('Invalid encrypted data format')
  }

  // Get credential metadata (non-sensitive info)
  private getCredentialMetadata(): Record<string, Omit<Credential, 'token' | 'password' | 'privateKey' | 'secretId'>> {
    try {
      if (!fs.existsSync(this.metadataFile)) {
        return {}
      }
      const data = fs.readFileSync(this.metadataFile, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to read credential metadata:', error)
      return {}
    }
  }

  // Save credential metadata
  private saveCredentialMetadata(metadata: Record<string, any>): void {
    try {
      fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2), {
        mode: 0o600
      })
    } catch (error) {
      console.error('Failed to save credential metadata:', error)
      throw new Error('Failed to save credential metadata')
    }
  }

  // Store credential securely
  async storeCredential(credential: Credential): Promise<void> {
    try {
      // Separate sensitive and non-sensitive data
      const { 
        token, password, privateKey, secretId, passphrase, 
        certFile, keyFile, caFile, ...metadata 
      } = credential as any

      // Store sensitive data in encrypted file
      const sensitiveData: Record<string, string> = {}
      if (token) sensitiveData.token = token
      if (password) sensitiveData.password = password
      if (privateKey) sensitiveData.privateKey = privateKey
      if (secretId) sensitiveData.secretId = secretId
      if (passphrase) sensitiveData.passphrase = passphrase
      if (certFile) sensitiveData.certFile = certFile
      if (keyFile) sensitiveData.keyFile = keyFile
      if (caFile) sensitiveData.caFile = caFile

      if (Object.keys(sensitiveData).length > 0) {
        const encryptedSensitiveData = this.encryptData(JSON.stringify(sensitiveData))
        const sensitiveFilePath = path.join(this.sensitiveDir, `${credential.id}.enc`)
        fs.writeFileSync(sensitiveFilePath, encryptedSensitiveData, { mode: 0o600 })
      }

      // Store metadata in file
      const allMetadata = this.getCredentialMetadata()
      allMetadata[credential.id] = {
        ...metadata,
        updatedAt: new Date().toISOString()
      }
      this.saveCredentialMetadata(allMetadata)

    } catch (error) {
      console.error('Failed to store credential:', error)
      throw new Error('Failed to store credential securely')
    }
  }

  // Retrieve credential
  async getCredential(id: string): Promise<Credential | null> {
    try {
      const metadata = this.getCredentialMetadata()
      const credentialMetadata = metadata[id]
      
      if (!credentialMetadata) {
        return null
      }

      // Get sensitive data from encrypted file
      const sensitiveFilePath = path.join(this.sensitiveDir, `${id}.enc`)
      let sensitiveData: Record<string, string> = {}
      
      if (fs.existsSync(sensitiveFilePath)) {
        try {
          const encryptedData = fs.readFileSync(sensitiveFilePath, 'utf8')
          const decryptedData = this.decryptData(encryptedData)
          sensitiveData = JSON.parse(decryptedData)
        } catch (error) {
          console.error('Failed to decrypt sensitive data for credential:', id, error)
        }
      }

      // Combine metadata and sensitive data
      return {
        ...credentialMetadata,
        ...sensitiveData
      } as Credential

    } catch (error) {
      console.error('Failed to retrieve credential:', error)
      return null
    }
  }

  // List all credentials (metadata only)
  async listCredentials(type?: Credential['type'], environment?: string): Promise<Omit<Credential, 'token' | 'password' | 'privateKey' | 'secretId'>[]> {
    try {
      const metadata = this.getCredentialMetadata()
      let credentials = Object.values(metadata)

      if (type) {
        credentials = credentials.filter(cred => cred.type === type)
      }

      if (environment) {
        credentials = credentials.filter(cred => cred.environment === environment)
      }

      return credentials.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch (error) {
      console.error('Failed to list credentials:', error)
      return []
    }
  }

  // Delete credential
  async deleteCredential(id: string): Promise<boolean> {
    try {
      // Remove sensitive data file
      const sensitiveFilePath = path.join(this.sensitiveDir, `${id}.enc`)
      if (fs.existsSync(sensitiveFilePath)) {
        fs.unlinkSync(sensitiveFilePath)
      }

      // Remove from metadata
      const metadata = this.getCredentialMetadata()
      delete metadata[id]
      this.saveCredentialMetadata(metadata)

      return true
    } catch (error) {
      console.error('Failed to delete credential:', error)
      return false
    }
  }

  // Update credential
  async updateCredential(credential: Credential): Promise<void> {
    credential.updatedAt = new Date().toISOString()
    await this.storeCredential(credential)
  }

  // Find credentials by criteria
  async findCredentials(criteria: {
    type?: Credential['type']
    environment?: string
    repoUrl?: string
    registryUrl?: string
    serverUrl?: string
    tags?: string[]
  }): Promise<Credential[]> {
    try {
      const allCredentials = await this.listCredentials(criteria.type, criteria.environment)
      
      return allCredentials.filter(cred => {
        if (criteria.repoUrl && 'repoUrl' in cred && cred.repoUrl !== criteria.repoUrl) {
          return false
        }
        if (criteria.registryUrl && 'registryUrl' in cred && cred.registryUrl !== criteria.registryUrl) {
          return false
        }
        if (criteria.serverUrl && 'serverUrl' in cred && cred.serverUrl !== criteria.serverUrl) {
          return false
        }
        if (criteria.tags && criteria.tags.length > 0) {
          const credTags = cred.tags || []
          if (!criteria.tags.some(tag => credTags.includes(tag))) {
            return false
          }
        }
        return true
      }) as Credential[]
    } catch (error) {
      console.error('Failed to find credentials:', error)
      return []
    }
  }

  // Generate unique ID for credentials
  generateCredentialId(type: string, identifier: string): string {
    const timestamp = Date.now()
    const hash = crypto.createHash('sha256')
    hash.update(`${type}-${identifier}-${timestamp}`)
    return hash.digest('hex').substring(0, 16)
  }

  // Test credential access (health check)
  async testCredentialAccess(): Promise<boolean> {
    try {
      const testId = 'test-credential'
      const testCredential: GitCredential = {
        id: testId,
        name: 'Test Credential',
        type: 'git',
        repoUrl: 'https://github.com/test/test.git',
        authType: 'token',
        token: 'test-token',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await this.storeCredential(testCredential)
      const retrieved = await this.getCredential(testId)
      await this.deleteCredential(testId)

      return retrieved?.token === 'test-token'
    } catch (error) {
      console.error('Credential access test failed:', error)
      return false
    }
  }
}

// Singleton instance
export const simpleCredentialManager = new SimpleCredentialManager()