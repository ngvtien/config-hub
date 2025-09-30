import { ipcMain } from 'electron'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

// Types for Vault API
interface VaultConfig {
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

interface VaultRequest {
  environment: string
  config: VaultConfig
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  params?: Record<string, any>
}

// Secure credential storage for Vault
class SecureVaultCredentialStore {
  private credentialsFile: string

  constructor() {
    this.credentialsFile = path.join(app.getPath('userData'), 'vault-credentials.json')
  }

  // Store credentials securely
  storeCredentials(environment: string, config: VaultConfig): void {
    try {
      let credentials: Record<string, VaultConfig> = {}
      
      if (fs.existsSync(this.credentialsFile)) {
        const data = fs.readFileSync(this.credentialsFile, 'utf8')
        credentials = JSON.parse(data)
      }

      credentials[environment] = {
        serverUrl: config.serverUrl,
        authMethod: config.authMethod,
        token: config.token,
        username: config.username,
        password: config.password, // In production, encrypt this
        namespace: config.namespace,
        mountPath: config.mountPath,
        roleId: config.roleId,
        secretId: config.secretId,
        kubernetesRole: config.kubernetesRole,
        awsRole: config.awsRole,
        azureRole: config.azureRole
      }

      fs.writeFileSync(this.credentialsFile, JSON.stringify(credentials, null, 2), {
        mode: 0o600 // Restrict file permissions
      })
    } catch (error) {
      console.error('Failed to store Vault credentials:', error)
      throw new Error('Failed to store credentials securely')
    }
  }

  // Retrieve credentials securely
  getCredentials(environment: string): VaultConfig | null {
    try {
      if (!fs.existsSync(this.credentialsFile)) {
        return null
      }

      const data = fs.readFileSync(this.credentialsFile, 'utf8')
      const credentials = JSON.parse(data)
      
      return credentials[environment] || null
    } catch (error) {
      console.error('Failed to retrieve Vault credentials:', error)
      return null
    }
  }

  // Remove credentials
  removeCredentials(environment: string): void {
    try {
      if (!fs.existsSync(this.credentialsFile)) {
        return
      }

      const data = fs.readFileSync(this.credentialsFile, 'utf8')
      const credentials = JSON.parse(data)
      
      delete credentials[environment]
      
      fs.writeFileSync(this.credentialsFile, JSON.stringify(credentials, null, 2), {
        mode: 0o600
      })
    } catch (error) {
      console.error('Failed to remove Vault credentials:', error)
    }
  }
}

class SecureVaultClient {
  private clients: Map<string, AxiosInstance> = new Map()
  private credentialStore = new SecureVaultCredentialStore()
  private tokens: Map<string, { token: string; expiry: number }> = new Map()

  // Create or get client for environment
  private getClient(environment: string, config: VaultConfig): AxiosInstance {
    const key = environment
    
    if (!this.clients.has(key)) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Add namespace header if specified
      if (config.namespace) {
        headers['X-Vault-Namespace'] = config.namespace
      }

      const client = axios.create({
        baseURL: config.serverUrl,
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
          console.log(`Vault API Request [${environment}]: ${config.method?.toUpperCase()} ${config.url}`)
          return config
        },
        (error) => {
          console.error(`Vault API Request Error [${environment}]:`, error.message)
          return Promise.reject(error)
        }
      )

      // Add response interceptor for error handling
      client.interceptors.response.use(
        (response) => response,
        (error) => {
          console.error(`Vault API Response Error [${environment}]:`, error.response?.status, error.response?.statusText)
          throw new Error(`Vault API Error: ${error.response?.data?.errors?.join(', ') || error.message}`)
        }
      )

      this.clients.set(key, client)
    }
    
    return this.clients.get(key)!
  }

  // Authenticate with Vault and get token
  private async authenticate(environment: string, config: VaultConfig): Promise<string> {
    const client = this.getClient(environment, config)
    
    try {
      let authResponse: any

      switch (config.authMethod) {
        case 'token':
          if (!config.token) {
            throw new Error('Token is required for token authentication')
          }
          return config.token

        case 'userpass':
          if (!config.username || !config.password) {
            throw new Error('Username and password are required for userpass authentication')
          }
          authResponse = await client.post(`/v1/auth/userpass/login/${config.username}`, {
            password: config.password
          })
          break

        case 'ldap':
          if (!config.username || !config.password) {
            throw new Error('Username and password are required for LDAP authentication')
          }
          authResponse = await client.post(`/v1/auth/ldap/login/${config.username}`, {
            password: config.password
          })
          break

        case 'kubernetes':
          if (!config.kubernetesRole) {
            throw new Error('Kubernetes role is required for Kubernetes authentication')
          }
          // In a real implementation, you'd read the service account token
          const jwt = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8')
          authResponse = await client.post('/v1/auth/kubernetes/login', {
            role: config.kubernetesRole,
            jwt: jwt
          })
          break

        case 'aws':
          if (!config.awsRole) {
            throw new Error('AWS role is required for AWS authentication')
          }
          // AWS authentication would require AWS SDK integration
          throw new Error('AWS authentication not yet implemented')

        case 'azure':
          if (!config.azureRole) {
            throw new Error('Azure role is required for Azure authentication')
          }
          // Azure authentication would require Azure SDK integration
          throw new Error('Azure authentication not yet implemented')

        default:
          throw new Error(`Unsupported authentication method: ${config.authMethod}`)
      }

      const token = authResponse.data.auth.client_token
      const expiry = Date.now() + (authResponse.data.auth.lease_duration * 1000)
      
      // Cache the token
      this.tokens.set(environment, { token, expiry })
      
      return token
    } catch (error) {
      console.error(`Vault authentication failed [${environment}]:`, error)
      throw error
    }
  }

  // Get valid token (authenticate if needed)
  private async getValidToken(environment: string, config: VaultConfig): Promise<string> {
    const cached = this.tokens.get(environment)
    
    // Return cached token if still valid (with 5 minute buffer)
    if (cached && cached.expiry > Date.now() + 300000) {
      return cached.token
    }
    
    // Authenticate to get new token
    return await this.authenticate(environment, config)
  }

  // Validate request parameters
  private validateRequest(request: VaultRequest): void {
    if (!request.environment || !request.config || !request.endpoint) {
      throw new Error('Invalid request: missing required parameters')
    }

    if (!request.config.serverUrl) {
      throw new Error('Invalid Vault configuration: missing serverUrl')
    }

    // Validate URL format
    try {
      new URL(request.config.serverUrl)
    } catch {
      throw new Error('Invalid Vault server URL format')
    }

    // Validate endpoint format (prevent path traversal)
    if (request.endpoint.includes('..') || !request.endpoint.startsWith('/v1/')) {
      throw new Error('Invalid endpoint format')
    }
  }

  // Make secure API request
  async makeRequest(request: VaultRequest): Promise<any> {
    this.validateRequest(request)

    const client = this.getClient(request.environment, request.config)
    const method = request.method || 'GET'

    try {
      // Get valid token
      const token = await this.getValidToken(request.environment, request.config)
      
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
      console.error(`Vault API request failed [${request.environment}]:`, error)
      throw error
    }
  }

  // Test connection and authentication
  async testConnection(environment: string, config: VaultConfig): Promise<boolean> {
    try {
      // Test basic connectivity
      const healthResponse = await this.makeRequest({
        environment,
        config,
        endpoint: '/v1/sys/health',
        method: 'GET'
      })

      // Test authentication by getting token info
      await this.makeRequest({
        environment,
        config,
        endpoint: '/v1/auth/token/lookup-self',
        method: 'GET'
      })

      return true
    } catch (error) {
      console.error(`Vault connection test failed [${environment}]:`, error)
      return false
    }
  }

  // Store credentials securely
  storeCredentials(environment: string, config: VaultConfig): void {
    this.credentialStore.storeCredentials(environment, config)
  }

  // Get stored credentials
  getStoredCredentials(environment: string): VaultConfig | null {
    return this.credentialStore.getCredentials(environment)
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
  ipcMain.handle('vault:store-credentials', async (_, environment: string, config: VaultConfig) => {
    try {
      secureVaultClient.storeCredentials(environment, config)
      return { success: true }
    } catch (error) {
      console.error('Failed to store Vault credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Test Vault connection
  ipcMain.handle('vault:test-connection', async (_, environment: string) => {
    try {
      const config = secureVaultClient.getStoredCredentials(environment)
      if (!config) {
        return { success: false, error: 'No credentials found for environment' }
      }

      const connected = await secureVaultClient.testConnection(environment, config)
      return { success: connected, connected }
    } catch (error) {
      console.error('Vault connection test failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get secret
  ipcMain.handle('vault:get-secret', async (_, environment: string, secretPath: string) => {
    try {
      const config = secureVaultClient.getStoredCredentials(environment)
      if (!config) {
        throw new Error('No credentials found for environment')
      }

      const data = await secureVaultClient.makeRequest({
        environment,
        config,
        endpoint: `/v1/${config.mountPath}/data/${secretPath}`,
        method: 'GET'
      })

      return { success: true, data }
    } catch (error) {
      console.error('Failed to get Vault secret:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // List secrets
  ipcMain.handle('vault:list-secrets', async (_, environment: string, secretPath?: string) => {
    try {
      const config = secureVaultClient.getStoredCredentials(environment)
      if (!config) {
        throw new Error('No credentials found for environment')
      }

      const path = secretPath ? `${config.mountPath}/metadata/${secretPath}` : `${config.mountPath}/metadata`
      const data = await secureVaultClient.makeRequest({
        environment,
        config,
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
  ipcMain.handle('vault:put-secret', async (_, environment: string, secretPath: string, secretData: Record<string, any>) => {
    try {
      const config = secureVaultClient.getStoredCredentials(environment)
      if (!config) {
        throw new Error('No credentials found for environment')
      }

      const data = await secureVaultClient.makeRequest({
        environment,
        config,
        endpoint: `/v1/${config.mountPath}/data/${secretPath}`,
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
  ipcMain.handle('vault:delete-secret', async (_, environment: string, secretPath: string) => {
    try {
      const config = secureVaultClient.getStoredCredentials(environment)
      if (!config) {
        throw new Error('No credentials found for environment')
      }

      await secureVaultClient.makeRequest({
        environment,
        config,
        endpoint: `/v1/${config.mountPath}/metadata/${secretPath}`,
        method: 'DELETE'
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to delete Vault secret:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get Vault health
  ipcMain.handle('vault:get-health', async (_, environment: string) => {
    try {
      const config = secureVaultClient.getStoredCredentials(environment)
      if (!config) {
        throw new Error('No credentials found for environment')
      }

      const data = await secureVaultClient.makeRequest({
        environment,
        config,
        endpoint: '/v1/sys/health',
        method: 'GET'
      })

      return { success: true, data }
    } catch (error) {
      console.error('Failed to get Vault health:', error)
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