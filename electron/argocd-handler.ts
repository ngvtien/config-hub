import { ipcMain } from 'electron'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import https from 'https'
import { simpleCredentialManager, ArgoCDCredential } from './simple-credential-manager'

// Types for ArgoCD API
interface ArgoCDConfig {
  id?: string
  name: string
  serverUrl: string
  token?: string
  username?: string
  password?: string
  namespace?: string
  environment?: string
  tags?: string[]
}

interface ArgoCDRequest {
  credentialId: string
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  params?: Record<string, any>
}

class SecureArgoCDClient {
  private clients: Map<string, AxiosInstance> = new Map()

  // Helper: Get session token from username/password
  private async getSessionToken(serverUrl: string, username: string, password: string): Promise<string> {
    try {
      console.log(`Attempting to get session token from: ${serverUrl}/api/v1/session`)
      console.log(`Username: ${username}`)
      
      const response = await axios.post(
        `${serverUrl}/api/v1/session`,
        { username, password },
        {
          headers: { 'Content-Type': 'application/json' },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          timeout: 10000
        }
      )
      
      console.log('Session token response received')
      if (!response.data || !response.data.token) {
        throw new Error('No token in response')
      }
      
      return response.data.token
    } catch (error: any) {
      console.error('Failed to get session token:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password')
      } else if (error.response?.status === 404) {
        throw new Error('ArgoCD session endpoint not found. Check server URL.')
      } else {
        throw new Error(`Failed to authenticate: ${error.message}`)
      }
    }
  }

  // Create or get client for credential
  private async getClient(credentialId: string): Promise<AxiosInstance> {
    if (!this.clients.has(credentialId)) {
      const credential = await simpleCredentialManager.getCredential(credentialId) as ArgoCDCredential
      if (!credential) {
        throw new Error('ArgoCD credential not found')
      }

      const client = axios.create({
        baseURL: `${credential.serverUrl}/api/v1`,
        headers: {
          'Authorization': `Bearer ${credential.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
        // Security: Validate SSL certificates (set to false for local development with self-signed certs)
        httpsAgent: new https.Agent({
          rejectUnauthorized: false // Set to true in production with valid certificates
        })
      })

      // Add request interceptor for logging (without sensitive data)
      client.interceptors.request.use(
        (config) => {
          console.log(`ArgoCD API Request [${credential.name}]: ${config.method?.toUpperCase()} ${config.url}`)
          return config
        },
        (error) => {
          console.error(`ArgoCD API Request Error [${credential.name}]:`, error.message)
          return Promise.reject(error)
        }
      )

      // Add response interceptor for error handling
      client.interceptors.response.use(
        (response) => response,
        (error) => {
          console.error(`ArgoCD API Response Error [${credential.name}]:`, error.response?.status, error.response?.statusText)
          throw new Error(`ArgoCD API Error: ${error.response?.data?.message || error.message}`)
        }
      )

      this.clients.set(credentialId, client)
    }
    
    return this.clients.get(credentialId)!
  }

  // Validate request parameters
  private validateRequest(request: ArgoCDRequest): void {
    if (!request.credentialId || !request.endpoint) {
      throw new Error('Invalid request: missing required parameters')
    }

    // Validate endpoint format (prevent path traversal)
    if (request.endpoint.includes('..') || request.endpoint.includes('//')) {
      throw new Error('Invalid endpoint format')
    }
  }

  // Make secure API request
  async makeRequest(request: ArgoCDRequest): Promise<any> {
    this.validateRequest(request)

    const client = await this.getClient(request.credentialId)
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
      console.error(`ArgoCD API request failed [${request.credentialId}]:`, error)
      throw error
    }
  }

  // Test connection
  async testConnection(credentialId: string): Promise<boolean> {
    try {
      // Test by fetching applications list (this endpoint requires authentication)
      await this.makeRequest({
        credentialId,
        endpoint: '/applications',
        method: 'GET'
      })
      return true
    } catch (error) {
      console.error(`ArgoCD connection test failed [${credentialId}]:`, error)
      return false
    }
  }

  // Store credentials securely
  async storeCredentials(config: ArgoCDConfig): Promise<string> {
    const credentialId = config.id || simpleCredentialManager.generateCredentialId('argocd', config.serverUrl)
    
    // If password is provided but no token, get session token
    let token = config.token
    if (!token && config.username && config.password) {
      console.log(`Getting session token for user: ${config.username}`)
      token = await this.getSessionToken(config.serverUrl, config.username, config.password)
      console.log('Session token obtained successfully')
    }

    if (!token) {
      throw new Error('Either token or username/password must be provided')
    }

    const credential: ArgoCDCredential = {
      id: credentialId,
      name: config.name,
      type: 'argocd',
      serverUrl: config.serverUrl,
      token: token,
      username: config.username,
      namespace: config.namespace,
      environment: config.environment,
      tags: config.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await simpleCredentialManager.storeCredential(credential)
    return credentialId
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
  ipcMain.handle('argocd:store-credentials', async (_, config: ArgoCDConfig) => {
    try {
      const credentialId = await secureArgoCDClient.storeCredentials(config)
      return { success: true, credentialId }
    } catch (error) {
      console.error('Failed to store ArgoCD credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Test ArgoCD connection
  ipcMain.handle('argocd:test-connection', async (_, credentialId: string) => {
    try {
      const connected = await secureArgoCDClient.testConnection(credentialId)
      return { success: connected, connected }
    } catch (error) {
      console.error('ArgoCD connection test failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get applications
  ipcMain.handle('argocd:get-applications', async (_, credentialId: string) => {
    try {
      const data = await secureArgoCDClient.makeRequest({
        credentialId,
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
  ipcMain.handle('argocd:get-application', async (_, credentialId: string, name: string, namespace?: string) => {
    try {
      const appName = namespace ? `${namespace}/${name}` : name
      const data = await secureArgoCDClient.makeRequest({
        credentialId,
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
  ipcMain.handle('argocd:get-application-logs', async (_, credentialId: string, name: string, options?: {
    namespace?: string
    container?: string
    sinceSeconds?: number
    tailLines?: number
  }) => {
    try {
      const appName = options?.namespace ? `${options.namespace}/${name}` : name
      const params: Record<string, any> = {}
      
      if (options?.container) params.container = options.container
      if (options?.sinceSeconds) params.sinceSeconds = options.sinceSeconds
      if (options?.tailLines) params.tailLines = options.tailLines

      const data = await secureArgoCDClient.makeRequest({
        credentialId,
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
  ipcMain.handle('argocd:get-application-events', async (_, credentialId: string, name: string, namespace?: string) => {
    try {
      const appName = namespace ? `${namespace}/${name}` : name
      const data = await secureArgoCDClient.makeRequest({
        credentialId,
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
  ipcMain.handle('argocd:sync-application', async (_, credentialId: string, name: string, options?: {
    namespace?: string
    dryRun?: boolean
    prune?: boolean
    force?: boolean
  }) => {
    try {
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
        credentialId,
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

  // List ArgoCD credentials
  ipcMain.handle('argocd:list-credentials', async (_, environment?: string) => {
    try {
      const credentials = await simpleCredentialManager.listCredentials('argocd', environment)
      return { success: true, data: credentials }
    } catch (error) {
      console.error('Failed to list ArgoCD credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get ArgoCD credential
  ipcMain.handle('argocd:get-credential', async (_, credentialId: string) => {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId)
      return { success: true, data: credential }
    } catch (error) {
      console.error('Failed to get ArgoCD credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Delete ArgoCD credential
  ipcMain.handle('argocd:delete-credential', async (_, credentialId: string) => {
    try {
      const success = await simpleCredentialManager.deleteCredential(credentialId)
      return { success }
    } catch (error) {
      console.error('Failed to delete ArgoCD credential:', error)
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