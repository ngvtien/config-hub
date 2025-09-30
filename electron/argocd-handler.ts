import { ipcMain } from 'electron'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

// Types for ArgoCD API
interface ArgoCDConfig {
  serverUrl: string
  token: string
  username?: string
  namespace?: string
}

interface ArgoCDRequest {
  environment: string
  config: ArgoCDConfig
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  params?: Record<string, any>
}

// Secure credential storage
class SecureCredentialStore {
  private credentialsFile: string

  constructor() {
    this.credentialsFile = path.join(app.getPath('userData'), 'argocd-credentials.json')
  }

  // Store credentials securely (in production, consider using keytar or similar)
  storeCredentials(environment: string, config: ArgoCDConfig): void {
    try {
      let credentials: Record<string, ArgoCDConfig> = {}
      
      if (fs.existsSync(this.credentialsFile)) {
        const data = fs.readFileSync(this.credentialsFile, 'utf8')
        credentials = JSON.parse(data)
      }

      credentials[environment] = {
        serverUrl: config.serverUrl,
        token: config.token, // In production, encrypt this
        username: config.username,
        namespace: config.namespace
      }

      fs.writeFileSync(this.credentialsFile, JSON.stringify(credentials, null, 2), {
        mode: 0o600 // Restrict file permissions
      })
    } catch (error) {
      console.error('Failed to store ArgoCD credentials:', error)
      throw new Error('Failed to store credentials securely')
    }
  }

  // Retrieve credentials securely
  getCredentials(environment: string): ArgoCDConfig | null {
    try {
      if (!fs.existsSync(this.credentialsFile)) {
        return null
      }

      const data = fs.readFileSync(this.credentialsFile, 'utf8')
      const credentials = JSON.parse(data)
      
      return credentials[environment] || null
    } catch (error) {
      console.error('Failed to retrieve ArgoCD credentials:', error)
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
      console.error('Failed to remove ArgoCD credentials:', error)
    }
  }
}

class SecureArgoCDClient {
  private clients: Map<string, AxiosInstance> = new Map()
  private credentialStore = new SecureCredentialStore()

  // Create or get client for environment
  private getClient(environment: string, config: ArgoCDConfig): AxiosInstance {
    const key = environment
    
    if (!this.clients.has(key)) {
      const client = axios.create({
        baseURL: `${config.serverUrl}/api/v1`,
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
        // Security: Validate SSL certificates
        httpsAgent: {
          rejectUnauthorized: true
        }
      })

      // Add request interceptor for logging (without sensitive data)
      client.interceptors.request.use(
        (config) => {
          console.log(`ArgoCD API Request [${environment}]: ${config.method?.toUpperCase()} ${config.url}`)
          return config
        },
        (error) => {
          console.error(`ArgoCD API Request Error [${environment}]:`, error.message)
          return Promise.reject(error)
        }
      )

      // Add response interceptor for error handling
      client.interceptors.response.use(
        (response) => response,
        (error) => {
          console.error(`ArgoCD API Response Error [${environment}]:`, error.response?.status, error.response?.statusText)
          throw new Error(`ArgoCD API Error: ${error.response?.data?.message || error.message}`)
        }
      )

      this.clients.set(key, client)
    }
    
    return this.clients.get(key)!
  }

  // Validate request parameters
  private validateRequest(request: ArgoCDRequest): void {
    if (!request.environment || !request.config || !request.endpoint) {
      throw new Error('Invalid request: missing required parameters')
    }

    if (!request.config.serverUrl || !request.config.token) {
      throw new Error('Invalid ArgoCD configuration: missing serverUrl or token')
    }

    // Validate URL format
    try {
      new URL(request.config.serverUrl)
    } catch {
      throw new Error('Invalid ArgoCD server URL format')
    }

    // Validate endpoint format (prevent path traversal)
    if (request.endpoint.includes('..') || request.endpoint.includes('//')) {
      throw new Error('Invalid endpoint format')
    }
  }

  // Make secure API request
  async makeRequest(request: ArgoCDRequest): Promise<any> {
    this.validateRequest(request)

    const client = this.getClient(request.environment, request.config)
    const method = request.method || 'GET'

    try {
      const axiosConfig: AxiosRequestConfig = {
        method,
        url: request.endpoint,
        params: request.params,
        data: request.data
      }

      const response = await client.request(axiosConfig)
      return response.data
    } catch (error) {
      console.error(`ArgoCD API request failed [${request.environment}]:`, error)
      throw error
    }
  }

  // Test connection
  async testConnection(environment: string, config: ArgoCDConfig): Promise<boolean> {
    try {
      await this.makeRequest({
        environment,
        config,
        endpoint: '/version',
        method: 'GET'
      })
      return true
    } catch (error) {
      console.error(`ArgoCD connection test failed [${environment}]:`, error)
      return false
    }
  }

  // Store credentials securely
  storeCredentials(environment: string, config: ArgoCDConfig): void {
    this.credentialStore.storeCredentials(environment, config)
  }

  // Get stored credentials
  getStoredCredentials(environment: string): ArgoCDConfig | null {
    return this.credentialStore.getCredentials(environment)
  }

  // Clear cached clients (when credentials change)
  clearCache(): void {
    this.clients.clear()
  }
}

// Initialize secure ArgoCD client
const secureArgoCDClient = new SecureArgoCDClient()

// IPC Handlers for ArgoCD operations
export function setupArgoCDHandlers(): void {
  // Store ArgoCD credentials
  ipcMain.handle('argocd:store-credentials', async (_, environment: string, config: ArgoCDConfig) => {
    try {
      secureArgoCDClient.storeCredentials(environment, config)
      return { success: true }
    } catch (error) {
      console.error('Failed to store ArgoCD credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Test ArgoCD connection
  ipcMain.handle('argocd:test-connection', async (_, environment: string) => {
    try {
      const config = secureArgoCDClient.getStoredCredentials(environment)
      if (!config) {
        return { success: false, error: 'No credentials found for environment' }
      }

      const connected = await secureArgoCDClient.testConnection(environment, config)
      return { success: connected, connected }
    } catch (error) {
      console.error('ArgoCD connection test failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get applications
  ipcMain.handle('argocd:get-applications', async (_, environment: string) => {
    try {
      const config = secureArgoCDClient.getStoredCredentials(environment)
      if (!config) {
        throw new Error('No credentials found for environment')
      }

      const data = await secureArgoCDClient.makeRequest({
        environment,
        config,
        endpoint: '/applications',
        method: 'GET'
      })

      return { success: true, data: data.items || [] }
    } catch (error) {
      console.error('Failed to get ArgoCD applications:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get specific application
  ipcMain.handle('argocd:get-application', async (_, environment: string, name: string, namespace?: string) => {
    try {
      const config = secureArgoCDClient.getStoredCredentials(environment)
      if (!config) {
        throw new Error('No credentials found for environment')
      }

      const appName = namespace ? `${namespace}/${name}` : name
      const data = await secureArgoCDClient.makeRequest({
        environment,
        config,
        endpoint: `/applications/${appName}`,
        method: 'GET'
      })

      return { success: true, data }
    } catch (error) {
      console.error('Failed to get ArgoCD application:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get application logs
  ipcMain.handle('argocd:get-application-logs', async (_, environment: string, name: string, options?: {
    namespace?: string
    container?: string
    sinceSeconds?: number
    tailLines?: number
  }) => {
    try {
      const config = secureArgoCDClient.getStoredCredentials(environment)
      if (!config) {
        throw new Error('No credentials found for environment')
      }

      const appName = options?.namespace ? `${options.namespace}/${name}` : name
      const params: Record<string, any> = {}
      
      if (options?.container) params.container = options.container
      if (options?.sinceSeconds) params.sinceSeconds = options.sinceSeconds
      if (options?.tailLines) params.tailLines = options.tailLines

      const data = await secureArgoCDClient.makeRequest({
        environment,
        config,
        endpoint: `/applications/${appName}/logs`,
        method: 'GET',
        params
      })

      // Parse log stream response
      const logs: any[] = []
      if (typeof data === 'string') {
        const lines = data.split('\n').filter((line: string) => line.trim())
        lines.forEach((line: string) => {
          try {
            const logEntry = JSON.parse(line)
            logs.push(logEntry)
          } catch (e) {
            logs.push({
              content: line,
              timeStamp: new Date().toISOString(),
              last: false
            })
          }
        })
      }

      return { success: true, data: logs }
    } catch (error) {
      console.error('Failed to get ArgoCD application logs:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get application events
  ipcMain.handle('argocd:get-application-events', async (_, environment: string, name: string, namespace?: string) => {
    try {
      const config = secureArgoCDClient.getStoredCredentials(environment)
      if (!config) {
        throw new Error('No credentials found for environment')
      }

      const appName = namespace ? `${namespace}/${name}` : name
      const data = await secureArgoCDClient.makeRequest({
        environment,
        config,
        endpoint: `/applications/${appName}/events`,
        method: 'GET'
      })

      return { success: true, data: data.items || [] }
    } catch (error) {
      console.error('Failed to get ArgoCD application events:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Sync application
  ipcMain.handle('argocd:sync-application', async (_, environment: string, name: string, options?: {
    namespace?: string
    dryRun?: boolean
    prune?: boolean
    force?: boolean
  }) => {
    try {
      const config = secureArgoCDClient.getStoredCredentials(environment)
      if (!config) {
        throw new Error('No credentials found for environment')
      }

      const appName = options?.namespace ? `${options.namespace}/${name}` : name
      const syncRequest = {
        revision: 'HEAD',
        prune: options?.prune || false,
        dryRun: options?.dryRun || false,
        strategy: {
          apply: {
            force: options?.force || false
          }
        }
      }

      const data = await secureArgoCDClient.makeRequest({
        environment,
        config,
        endpoint: `/applications/${appName}/sync`,
        method: 'POST',
        data: syncRequest
      })

      return { success: true, data }
    } catch (error) {
      console.error('Failed to sync ArgoCD application:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Clear credentials cache
  ipcMain.handle('argocd:clear-cache', async () => {
    try {
      secureArgoCDClient.clearCache()
      return { success: true }
    } catch (error) {
      console.error('Failed to clear ArgoCD cache:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}