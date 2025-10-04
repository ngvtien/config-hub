import { ipcMain } from 'electron'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
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
        // Security: Validate SSL certificates
        httpsAgent: {
          rejectUnauthorized: true
        }
      })

      // Add request interceptor for logging
      client.interceptors.request.use(
        (config) => {
          console.log(`Vault API Request [${credential.name}]: ${config.method?.toUpperCase()} ${config.url}`)
          return config
        },
        (error) => {
          console.error(`Vault API Request Error [${credential.name}]:`, error.message)
          return Promise.reject(error)
        }
      )

      // Add response interceptor for error handling
      client.interceptors.response.use(
        (response) => response,
        (error) => {
          console.error(`Vault API Response Error [${credential.name}]:`, error.response?.status, error.response?.statusText)
          throw new Error(`Vault API Error: ${error.response?.data?.errors?.join(', ') || error.message}`)
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
      console.error(`Vault authentication failed [${credentialId}]:`, error)
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
      console.error(`Vault API request failed [${request.credentialId}]:`, error)
      throw error
    }
  }

  // Test connection and authentication
  async testConnection(credentialId: string): Promise<boolean> {
    try {
      // Test basic connectivity
      await this.makeRequest({
        credentialId,
        endpoint: '/v1/sys/health',
        method: 'GET'
      })

      // Test authentication by getting token info
      await this.makeRequest({
        credentialId,
        endpoint: '/v1/auth/token/lookup-self',
        method: 'GET'
      })

      return true
    } catch (error) {
      console.error(`Vault connection test failed [${credentialId}]:`, error)
      return false
    }
  }

  // Store credentials securely
  async storeCredentials(config: VaultConfig): Promise<string> {
    const credentialId = config.id || simpleCredentialManager.generateCredentialId('vault', config.serverUrl)
    
    const credential: VaultCredential = {
      id: credentialId,
      name: config.name,
      type: 'vault',
      serverUrl: config.serverUrl,
      authMethod: config.authMethod,
      token: config.token,
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
      console.error('Failed to store Vault credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Test Vault connection
  ipcMain.handle('vault:test-connection', async (_, credentialId: string) => {
    try {
      const connected = await secureVaultClient.testConnection(credentialId)
      return { success: connected, connected }
    } catch (error) {
      console.error('Vault connection test failed:', error)
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

      const data = await secureVaultClient.makeRequest({
        credentialId,
        endpoint: `/v1/${credential.mountPath}/data/${secretPath}`,
        method: 'GET'
      })

      return { success: true, data }
    } catch (error) {
      console.error('Failed to get Vault secret:', error)
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

      const path = secretPath ? `${credential.mountPath}/metadata/${secretPath}` : `${credential.mountPath}/metadata`
      const data = await secureVaultClient.makeRequest({
        credentialId,
        endpoint: `/v1/${path}`,
        method: 'LIST'
      })

      return { success: true, data: data.data?.keys || [] }
    } catch (error) {
      console.error('Failed to list Vault secrets:', error)
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

      const data = await secureVaultClient.makeRequest({
        credentialId,
        endpoint: `/v1/${credential.mountPath}/data/${secretPath}`,
        method: 'POST',
        data: { data: secretData }
      })

      return { success: true, data }
    } catch (error) {
      console.error('Failed to put Vault secret:', error)
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

      await secureVaultClient.makeRequest({
        credentialId,
        endpoint: `/v1/${credential.mountPath}/metadata/${secretPath}`,
        method: 'DELETE'
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to delete Vault secret:', error)
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
      console.error('Failed to get Vault health:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // List Vault credentials
  ipcMain.handle('vault:list-credentials', async (_, environment?: string) => {
    try {
      const credentials = await simpleCredentialManager.listCredentials('vault', environment)
      return { success: true, data: credentials }
    } catch (error) {
      console.error('Failed to list Vault credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get Vault credential
  ipcMain.handle('vault:get-credential', async (_, credentialId: string) => {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId)
      return { success: true, data: credential }
    } catch (error) {
      console.error('Failed to get Vault credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Delete Vault credential
  ipcMain.handle('vault:delete-credential', async (_, credentialId: string) => {
    try {
      const success = await simpleCredentialManager.deleteCredential(credentialId)
      return { success }
    } catch (error) {
      console.error('Failed to delete Vault credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Clear credentials cache
  ipcMain.handle('vault:clear-cache', async () => {
    try {
      secureVaultClient.clearCache()
      return { success: true }
    } catch (error) {
      console.error('Failed to clear Vault cache:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}