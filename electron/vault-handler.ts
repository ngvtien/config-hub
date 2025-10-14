import { ipcMain } from 'electron'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import https from 'node:https'
import fs from 'node:fs'
import { simpleCredentialManager, VaultCredential } from './simple-credential-manager'

// Updated Vault configuration interface
interface VaultConfig {
  id?: string
  name: string
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
  environment?: string
  tags?: string[]
}

interface VaultRequest {
  credentialId: string
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'LIST'
  data?: any
  params?: Record<string, any>
}

class SecureVaultClient {
  private clients: Map<string, AxiosInstance> = new Map()
  private tokens: Map<string, { token: string; expiry: number }> = new Map()
  private kvVersionCache: Map<string, boolean> = new Map() // credentialId -> isKvV2

  // Create or get client for credential
  private async getClient(credentialId: string): Promise<AxiosInstance> {
    if (!this.clients.has(credentialId)) {
      const credential = await simpleCredentialManager.getCredential(credentialId) as VaultCredential
      if (!credential) {
        throw new Error('Vault credential not found')
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Add namespace header if specified
      if (credential.namespace) {
        headers['X-Vault-Namespace'] = credential.namespace
      }

      const client = axios.create({
        baseURL: credential.serverUrl,
        headers,
        timeout: 30000,
        // Security: Validate SSL certificates (disable for self-signed certs in dev)
        httpsAgent: new https.Agent({
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        })
      })

      // Add request interceptor for error handling
      client.interceptors.request.use(
        (config) => config,
        (error) => Promise.reject(error)
      )

      // Add response interceptor for error handling
      client.interceptors.response.use(
        (response) => response,
        (error) => {
          const errorMessage = error.response?.data?.errors?.join(', ') || error.message
          throw new Error(`Vault API Error: ${errorMessage}`)
        }
      )

      this.clients.set(credentialId, client)
    }
    
    return this.clients.get(credentialId)!
  }

  // Authenticate with Vault and get token
  private async authenticate(credentialId: string): Promise<string> {
    const credential = await simpleCredentialManager.getCredential(credentialId) as VaultCredential
    if (!credential) {
      throw new Error('Vault credential not found')
    }

    const client = await this.getClient(credentialId)
    
    try {
      let authResponse: any

      switch (credential.authMethod) {
        case 'token':
          if (!credential.token) {
            throw new Error('Token is required for token authentication')
          }
          return credential.token

        case 'userpass':
          if (!credential.username || !credential.password) {
            throw new Error('Username and password are required for userpass authentication')
          }
          authResponse = await client.post(`/v1/auth/userpass/login/${credential.username}`, {
            password: credential.password
          })
          break

        case 'ldap':
          if (!credential.username || !credential.password) {
            throw new Error('Username and password are required for LDAP authentication')
          }
          authResponse = await client.post(`/v1/auth/ldap/login/${credential.username}`, {
            password: credential.password
          })
          break

        case 'kubernetes':
          if (!credential.kubernetesRole) {
            throw new Error('Kubernetes role is required for Kubernetes authentication')
          }
          // In a real implementation, you'd read the service account token
          const jwt = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8')
          authResponse = await client.post('/v1/auth/kubernetes/login', {
            role: credential.kubernetesRole,
            jwt: jwt
          })
          break

        case 'aws':
          if (!credential.awsRole) {
            throw new Error('AWS role is required for AWS authentication')
          }
          // AWS authentication would require AWS SDK integration
          throw new Error('AWS authentication not yet implemented')

        case 'azure':
          if (!credential.azureRole) {
            throw new Error('Azure role is required for Azure authentication')
          }
          // Azure authentication would require Azure SDK integration
          throw new Error('Azure authentication not yet implemented')

        default:
          throw new Error(`Unsupported authentication method: ${credential.authMethod}`)
      }

      const token = authResponse.data.auth.client_token
      const expiry = Date.now() + (authResponse.data.auth.lease_duration * 1000)
      
      // Cache the token
      this.tokens.set(credentialId, { token, expiry })
      
      return token
    } catch (error) {
      throw error
    }
  }

  // Get valid token (authenticate if needed)
  private async getValidToken(credentialId: string): Promise<string> {
    const cached = this.tokens.get(credentialId)
    
    // Return cached token if still valid (with 5 minute buffer)
    if (cached && cached.expiry > Date.now() + 300000) {
      return cached.token
    }
    
    // Authenticate to get new token
    return await this.authenticate(credentialId)
  }

  // Detect if mount is KV v2
  async isKvV2(credentialId: string): Promise<boolean> {
    // Check cache first
    if (this.kvVersionCache.has(credentialId)) {
      return this.kvVersionCache.get(credentialId)!
    }

    try {
      const credential = await simpleCredentialManager.getCredential(credentialId) as VaultCredential
      if (!credential) {
        return true // Default to v2
      }

      const mountsResponse = await this.makeRequest({
        credentialId,
        endpoint: '/v1/sys/mounts',
        method: 'GET'
      })

      const mounts = mountsResponse.data || {}
      const mountKey = `${credential.mountPath}/`
      const mountInfo = mounts[mountKey]
      
      if (!mountInfo) {
        return true // Default to v2
      }
      
      const isV2 = mountInfo?.options?.version === '2'
      this.kvVersionCache.set(credentialId, isV2)
      
      return isV2
    } catch (error) {
      return true // Default to v2
    }
  }

  // Validate request parameters
  private validateRequest(request: VaultRequest): void {
    if (!request.credentialId || !request.endpoint) {
      throw new Error('Invalid request: missing required parameters')
    }

    // Validate endpoint format (prevent path traversal)
    if (request.endpoint.includes('..') || !request.endpoint.startsWith('/v1/')) {
      throw new Error('Invalid endpoint format')
    }
  }

  // Make secure API request
  async makeRequest(request: VaultRequest): Promise<any> {
    this.validateRequest(request)

    const client = await this.getClient(request.credentialId)
    const method = request.method || 'GET'

    try {
      // Get valid token
      const token = await this.getValidToken(request.credentialId)
      
      const axiosConfig: AxiosRequestConfig = {
        method,
        url: request.endpoint,
        params: request.params,
        data: request.data,
        headers: {
          'X-Vault-Token': token
        }
      }

      const response = await client.request(axiosConfig)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Test connection and authentication
  async testConnection(credentialId: string): Promise<boolean> {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId) as VaultCredential
      if (!credential) {
        throw new Error('Vault credential not found')
      }

      // Test basic connectivity
      const client = await this.getClient(credentialId)
      await client.get('/v1/sys/health')

      // Test authentication
      await this.getValidToken(credentialId)
      
      // Verify mount path exists
      const mountsResponse = await this.makeRequest({
        credentialId,
        endpoint: '/v1/sys/mounts',
        method: 'GET'
      })
      
      const mounts = mountsResponse.data || {}
      const mountKey = `${credential.mountPath}/`
      
      if (!mounts[mountKey]) {
        throw new Error(
          `The secret mount path "${credential.mountPath}" does not exist in Vault. ` +
          `Available mounts: ${Object.keys(mounts).filter(k => k.endsWith('/')).map(k => k.slice(0, -1)).join(', ')}. ` +
          `You can enable it with: vault secrets enable -path=${credential.mountPath} kv-v2`
        )
      }
      
      // Verify read permissions
      const mountInfo = mounts[mountKey]
      const isKvV2 = mountInfo.options?.version === '2'
      const listPath = isKvV2 
        ? `/v1/${credential.mountPath}/metadata`
        : `/v1/${credential.mountPath}`
      
      try {
        await this.makeRequest({
          credentialId,
          endpoint: listPath,
          method: 'LIST'
        })
      } catch (listError: any) {
        // LIST might fail if path is empty, but mount exists
      }
      
      return true
    } catch (error) {
      throw error
    }
  }

  // Store credentials securely
  async storeCredentials(config: VaultConfig): Promise<string> {
    const credentialId = config.id || simpleCredentialManager.generateCredentialId('vault', config.serverUrl)
    
    // Clean and trim token to remove any whitespace, newlines, or invalid characters
    const cleanToken = config.token ? config.token.trim().replace(/[\r\n\t]/g, '') : undefined
    
    const credential: VaultCredential = {
      id: credentialId,
      name: config.name,
      type: 'vault',
      serverUrl: config.serverUrl,
      authMethod: config.authMethod,
      token: cleanToken,
      username: config.username,
      password: config.password,
      namespace: config.namespace,
      mountPath: config.mountPath,
      roleId: config.roleId,
      secretId: config.secretId,
      kubernetesRole: config.kubernetesRole,
      awsRole: config.awsRole,
      azureRole: config.azureRole,
      environment: config.environment,
      tags: config.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await simpleCredentialManager.storeCredential(credential)
    return credentialId
  }

  // Clear cached clients and tokens
  clearCache(): void {
    this.clients.clear()
    this.tokens.clear()
    this.kvVersionCache.clear()
  }
}

// Initialize secure Vault client
const secureVaultClient = new SecureVaultClient()

// IPC Handlers for Vault operations
export function setupVaultHandlers(): void {
  // Store Vault credentials
  ipcMain.handle('vault:store-credentials', async (_, config: VaultConfig) => {
    try {
      const credentialId = await secureVaultClient.storeCredentials(config)
      return { success: true, data: { credentialId } }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Test Vault connection
  ipcMain.handle('vault:test-connection', async (_, credentialId: string) => {
    try {
      const connected = await secureVaultClient.testConnection(credentialId)
      return { success: connected, connected }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get secret
  ipcMain.handle('vault:get-secret', async (_, credentialId: string, secretPath: string) => {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId) as VaultCredential
      if (!credential) {
        throw new Error('No credentials found for credential ID')
      }

      const isV2 = await secureVaultClient.isKvV2(credentialId)
      const endpoint = isV2
        ? `/v1/${credential.mountPath}/data/${secretPath}`
        : `/v1/${credential.mountPath}/${secretPath}`

      const data = await secureVaultClient.makeRequest({
        credentialId,
        endpoint,
        method: 'GET'
      })

      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // List secrets
  ipcMain.handle('vault:list-secrets', async (_, credentialId: string, secretPath?: string) => {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId) as VaultCredential
      if (!credential) {
        throw new Error('No credentials found for credential ID')
      }

      const isV2 = await secureVaultClient.isKvV2(credentialId)
      const basePath = secretPath ? `${credential.mountPath}/${secretPath}` : credential.mountPath
      const path = isV2 ? `${basePath}/metadata` : basePath
      
      const data = await secureVaultClient.makeRequest({
        credentialId,
        endpoint: `/v1/${path}`,
        method: 'LIST'
      })

      const keys = data.data?.keys || []
      return { success: true, data: keys }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Put secret
  ipcMain.handle('vault:put-secret', async (_, credentialId: string, secretPath: string, secretData: Record<string, any>) => {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId) as VaultCredential
      if (!credential) {
        throw new Error('No credentials found for credential ID')
      }

      const isV2 = await secureVaultClient.isKvV2(credentialId)
      const endpoint = isV2
        ? `/v1/${credential.mountPath}/data/${secretPath}`
        : `/v1/${credential.mountPath}/${secretPath}`
      
      // KV v2 wraps data in { data: {...} }, v1 sends directly
      const payload = isV2 ? { data: secretData } : secretData

      const data = await secureVaultClient.makeRequest({
        credentialId,
        endpoint,
        method: isV2 ? 'POST' : 'PUT',
        data: payload
      })

      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Delete secret
  ipcMain.handle('vault:delete-secret', async (_, credentialId: string, secretPath: string) => {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId) as VaultCredential
      if (!credential) {
        throw new Error('No credentials found for credential ID')
      }

      const isV2 = await secureVaultClient.isKvV2(credentialId)
      const endpoint = isV2
        ? `/v1/${credential.mountPath}/metadata/${secretPath}`
        : `/v1/${credential.mountPath}/${secretPath}`

      await secureVaultClient.makeRequest({
        credentialId,
        endpoint,
        method: 'DELETE'
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get Vault health
  ipcMain.handle('vault:get-health', async (_, credentialId: string) => {
    try {
      const data = await secureVaultClient.makeRequest({
        credentialId,
        endpoint: '/v1/sys/health',
        method: 'GET'
      })

      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // List Vault credentials
  ipcMain.handle('vault:list-credentials', async (_, environment?: string) => {
    try {
      const credentials = await simpleCredentialManager.listCredentials('vault', environment)
      return { success: true, data: credentials }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get Vault credential
  ipcMain.handle('vault:get-credential', async (_, credentialId: string) => {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId)
      return { success: true, data: credential }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Delete Vault credential
  ipcMain.handle('vault:delete-credential', async (_, credentialId: string) => {
    try {
      const success = await simpleCredentialManager.deleteCredential(credentialId)
      return { success }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Clear credentials cache
  ipcMain.handle('vault:clear-cache', async () => {
    try {
      secureVaultClient.clearCache()
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}