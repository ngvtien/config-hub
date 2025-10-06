import { app, safeStorage } from 'electron'
import * as forge from 'node-forge'
import path from 'node:path'
import fs from 'node:fs'

// Optional keytar import with fallback
let keytar: any = null
try {
  keytar = require('keytar')
} catch (error) {
  console.warn('Keytar not available, using fallback storage:', error.message)
}

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

// Secure credential storage manager
export class SecureCredentialManager {
  private readonly serviceName = 'electron-devops-app'
  private readonly metadataFile: string
  private readonly encryptionKey: string

  constructor() {
    this.metadataFile = path.join(app.getPath('userData'), 'credentials-metadata.json')
    this.encryptionKey = this.getOrCreateEncryptionKey()
  }

  // Get or create master encryption key
  // Note: Keytar v8+ only supports async methods, so we use file fallback for sync initialization
  private getOrCreateEncryptionKey(): string {
    const keyName = `${this.serviceName}-master-key`
    const keyFile = path.join(app.getPath('userData'), '.master-key')
    
    // Try file storage first (works synchronously)
    try {
      if (fs.existsSync(keyFile)) {
        const existingKey = fs.readFileSync(keyFile, 'utf8')
        // Optionally sync to keytar in background
        if (keytar) {
          keytar.setPassword(this.serviceName, keyName, existingKey)
            .catch(err => console.debug('Could not sync to keytar:', err))
        }
        return existingKey
      }
    } catch (error) {
      console.debug('Could not read key from file')
    }

    // Generate new master key
    const masterKey = forge.random.getBytesSync(32)
    const base64Key = forge.util.encode64(masterKey)
    
    // Store in file (synchronous)
    try {
      fs.writeFileSync(keyFile, base64Key, { mode: 0o600 })
    } catch (error) {
      console.error('Failed to store master key:', error)
      throw new Error('Failed to initialize secure credential storage')
    }

    // Try to store in keytar asynchronously (fire and forget)
    if (keytar) {
      keytar.setPassword(this.serviceName, keyName, base64Key)
        .catch(err => console.debug('Could not store in keytar:', err))
    }

    return base64Key
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

    // Fallback to node-forge encryption
    const key = forge.util.decode64(this.encryptionKey)
    const iv = forge.random.getBytesSync(16)
    const cipher = forge.cipher.createCipher('AES-CBC', key)
    cipher.start({ iv })
    cipher.update(forge.util.createBuffer(data))
    cipher.finish()
    
    const encrypted = cipher.output.getBytes()
    const combined = iv + encrypted
    return `forge:${forge.util.encode64(combined)}`
  }

  // Decrypt sensitive data
  private decryptData(encryptedData: string): string {
    if (encryptedData.startsWith('safe:')) {
      const base64Data = encryptedData.substring(5)
      const buffer = Buffer.from(base64Data, 'base64')
      return safeStorage.decryptString(buffer)
    }

    if (encryptedData.startsWith('forge:')) {
      const base64Data = encryptedData.substring(6)
      const combined = forge.util.decode64(base64Data)
      const iv = combined.substring(0, 16)
      const encrypted = combined.substring(16)
      
      const key = forge.util.decode64(this.encryptionKey)
      const decipher = forge.cipher.createDecipher('AES-CBC', key)
      decipher.start({ iv })
      decipher.update(forge.util.createBuffer(encrypted))
      decipher.finish()
      
      return decipher.output.toString()
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

      // Store sensitive data in keytar
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
        
        if (keytar) {
          try {
            await keytar.setPassword(this.serviceName, credential.id, encryptedSensitiveData)
          } catch (error) {
            console.warn('Failed to store in keytar, using file fallback:', error)
            this.storeSensitiveDataToFile(credential.id, encryptedSensitiveData)
          }
        } else {
          this.storeSensitiveDataToFile(credential.id, encryptedSensitiveData)
        }
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

      // Get sensitive data from keytar or file fallback
      let encryptedSensitiveData: string | null = null
      
      if (keytar) {
        try {
          encryptedSensitiveData = await keytar.getPassword(this.serviceName, id)
        } catch (error) {
          console.warn('Failed to get from keytar, trying file fallback:', error)
        }
      }
      
      if (!encryptedSensitiveData) {
        encryptedSensitiveData = this.getSensitiveDataFromFile(id)
      }
      
      let sensitiveData: Record<string, string> = {}
      
      if (encryptedSensitiveData) {
        try {
          const decryptedData = this.decryptData(encryptedSensitiveData)
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
      // Remove from keytar
      if (keytar) {
        try {
          await keytar.deletePassword(this.serviceName, id)
        } catch (error) {
          console.warn('Failed to delete from keytar:', error)
        }
      }
      
      // Remove from file fallback
      this.deleteSensitiveDataFromFile(id)

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
      
      // Normalize URLs for comparison
      const normalizeUrl = (url: string | undefined): string => {
        if (!url) return ''
        return url.trim().toLowerCase().replace(/\.git$/, '').replace(/\/$/, '')
      }
      
      const normalizedCriteriaRepoUrl = normalizeUrl(criteria.repoUrl)
      const normalizedCriteriaRegistryUrl = normalizeUrl(criteria.registryUrl)
      const normalizedCriteriaServerUrl = normalizeUrl(criteria.serverUrl)
      
      return allCredentials.filter(cred => {
        if (criteria.repoUrl && 'repoUrl' in cred) {
          const normalizedCredRepoUrl = normalizeUrl(cred.repoUrl as string | undefined)
          if (normalizedCredRepoUrl !== normalizedCriteriaRepoUrl) {
            return false
          }
        }
        if (criteria.registryUrl && 'registryUrl' in cred) {
          const normalizedCredRegistryUrl = normalizeUrl(cred.registryUrl as string | undefined)
          if (normalizedCredRegistryUrl !== normalizedCriteriaRegistryUrl) {
            return false
          }
        }
        if (criteria.serverUrl && 'serverUrl' in cred) {
          const normalizedCredServerUrl = normalizeUrl(cred.serverUrl as string | undefined)
          if (normalizedCredServerUrl !== normalizedCriteriaServerUrl) {
            return false
          }
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

  // File fallback methods
  private storeSensitiveDataToFile(id: string, encryptedData: string): void {
    const sensitiveDir = path.join(app.getPath('userData'), 'sensitive')
    if (!fs.existsSync(sensitiveDir)) {
      fs.mkdirSync(sensitiveDir, { mode: 0o700 })
    }
    
    const filePath = path.join(sensitiveDir, `${id}.enc`)
    fs.writeFileSync(filePath, encryptedData, { mode: 0o600 })
  }

  private getSensitiveDataFromFile(id: string): string | null {
    const filePath = path.join(app.getPath('userData'), 'sensitive', `${id}.enc`)
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8')
      }
    } catch (error) {
      console.error('Failed to read sensitive data from file:', error)
    }
    return null
  }

  private deleteSensitiveDataFromFile(id: string): void {
    const filePath = path.join(app.getPath('userData'), 'sensitive', `${id}.enc`)
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.error('Failed to delete sensitive data file:', error)
    }
  }

  // Test credential access (health check)
  async testCredentialAccess(): Promise<boolean> {
    try {
      const testKey = `${this.serviceName}-test`
      const testValue = 'test-value'
      
      if (keytar) {
        try {
          await keytar.setPassword(this.serviceName, testKey, testValue)
          const retrieved = await keytar.getPassword(this.serviceName, testKey)
          await keytar.deletePassword(this.serviceName, testKey)
          
          if (retrieved === testValue) {
            return true
          }
        } catch (error) {
          console.warn('Keytar test failed, testing file fallback:', error)
        }
      }
      
      // Test file fallback
      this.storeSensitiveDataToFile(testKey, testValue)
      const retrieved = this.getSensitiveDataFromFile(testKey)
      this.deleteSensitiveDataFromFile(testKey)
      
      return retrieved === testValue
    } catch (error) {
      console.error('Credential access test failed:', error)
      return false
    }
  }

  // Generate unique ID for credentials
  generateCredentialId(type: string, identifier: string): string {
    const timestamp = Date.now()
    const hash = forge.md.sha256.create()
    hash.update(`${type}-${identifier}-${timestamp}`)
    return hash.digest().toHex().substring(0, 16)
  }
}

// Singleton instance
export const secureCredentialManager = new SecureCredentialManager()