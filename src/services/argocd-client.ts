import axios, { AxiosInstance } from 'axios'
import { 
  ArgoCDApplication, 
  ArgoCDApplicationList, 
  ArgoCDApplicationLogs, 
  ArgoCDApplicationEvents,
  ArgoCDRepository,
  ApplicationFilter,
  ApplicationSearchResult
} from '@/types/argocd'

export interface ArgoCDConfig {
  serverUrl: string
  token: string
  username?: string
  namespace?: string
}

export class ArgoCDClient {
  private client: AxiosInstance

  constructor(config: ArgoCDConfig) {
    this.client = axios.create({
      baseURL: `${config.serverUrl}/api/v1`,
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    // Add request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`ArgoCD API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('ArgoCD API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('ArgoCD API Response Error:', error.response?.data || error.message)
        throw new Error(`ArgoCD API Error: ${error.response?.data?.message || error.message}`)
      }
    )
  }

  // Test connection to ArgoCD
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/version')
      return true
    } catch (error) {
      console.error('ArgoCD connection test failed:', error)
      return false
    }
  }

  // Get all applications
  async getApplications(): Promise<ArgoCDApplication[]> {
    try {
      const response = await this.client.get<ArgoCDApplicationList>('/applications')
      return response.data.items
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      throw error
    }
  }

  // Get specific application
  async getApplication(name: string, namespace?: string): Promise<ArgoCDApplication> {
    try {
      const appName = namespace ? `${namespace}/${name}` : name
      const response = await this.client.get<ArgoCDApplication>(`/applications/${appName}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch application ${name}:`, error)
      throw error
    }
  }

  // Get application logs
  async getApplicationLogs(
    name: string, 
    namespace?: string,
    options?: {
      container?: string
      sinceSeconds?: number
      tailLines?: number
      follow?: boolean
    }
  ): Promise<ArgoCDApplicationLogs[]> {
    try {
      const appName = namespace ? `${namespace}/${name}` : name
      const params = new URLSearchParams()
      
      if (options?.container) params.append('container', options.container)
      if (options?.sinceSeconds) params.append('sinceSeconds', options.sinceSeconds.toString())
      if (options?.tailLines) params.append('tailLines', options.tailLines.toString())
      if (options?.follow) params.append('follow', 'true')

      const response = await this.client.get(`/applications/${appName}/logs?${params}`)
      
      // Parse log stream response
      const logs: ArgoCDApplicationLogs[] = []
      const lines = response.data.split('\n').filter((line: string) => line.trim())
      
      lines.forEach((line: string) => {
        try {
          const logEntry = JSON.parse(line)
          logs.push(logEntry)
        } catch (e) {
          // Handle plain text logs
          logs.push({
            content: line,
            timeStamp: new Date().toISOString(),
            last: false
          })
        }
      })
      
      return logs
    } catch (error) {
      console.error(`Failed to fetch logs for application ${name}:`, error)
      throw error
    }
  }

  // Get application events
  async getApplicationEvents(name: string, namespace?: string): Promise<ArgoCDApplicationEvents[]> {
    try {
      const appName = namespace ? `${namespace}/${name}` : name
      const response = await this.client.get(`/applications/${appName}/events`)
      return response.data.items || []
    } catch (error) {
      console.error(`Failed to fetch events for application ${name}:`, error)
      throw error
    }
  }

  // Get application parameters (Helm values)
  async getApplicationParameters(name: string, namespace?: string): Promise<Record<string, any>> {
    try {
      const app = await this.getApplication(name, namespace)
      
      // Extract Helm parameters
      const helmParams = app.spec.source.helm?.parameters || []
      const parameters: Record<string, any> = {}
      
      helmParams.forEach(param => {
        parameters[param.name] = param.value
      })

      // If there are value files, we'd need to fetch them from the git repo
      // This would require additional git integration
      
      return parameters
    } catch (error) {
      console.error(`Failed to fetch parameters for application ${name}:`, error)
      throw error
    }
  }

  // Search applications with filters
  async searchApplications(filter: ApplicationFilter): Promise<ApplicationSearchResult[]> {
    try {
      const applications = await this.getApplications()
      const results: ApplicationSearchResult[] = []

      applications.forEach(app => {
        let matchScore = 0
        let productName: string | undefined
        let customerName: string | undefined
        let version: string | undefined

        // Extract metadata from labels/annotations
        const labels = app.metadata.labels || {}
        const annotations = app.metadata.annotations || {}

        // Common label patterns for product and customer
        productName = labels['app.kubernetes.io/name'] || 
                     labels['product'] || 
                     labels['app'] ||
                     annotations['product-name']

        customerName = labels['customer'] || 
                      labels['tenant'] ||
                      annotations['customer-name']

        version = labels['app.kubernetes.io/version'] || 
                 labels['version'] ||
                 app.spec.source.targetRevision

        // Apply filters and calculate match score
        if (filter.productName && productName) {
          if (productName.toLowerCase().includes(filter.productName.toLowerCase())) {
            matchScore += 10
          } else {
            return // Skip if product name doesn't match
          }
        }

        if (filter.customerName && customerName) {
          if (customerName.toLowerCase().includes(filter.customerName.toLowerCase())) {
            matchScore += 10
          } else {
            return // Skip if customer name doesn't match
          }
        }

        if (filter.version && version) {
          if (version.includes(filter.version)) {
            matchScore += 5
          }
        }

        if (filter.syncStatus) {
          if (app.status.sync.status === filter.syncStatus) {
            matchScore += 3
          } else {
            return // Skip if sync status doesn't match
          }
        }

        if (filter.healthStatus) {
          if (app.status.health.status === filter.healthStatus) {
            matchScore += 3
          } else {
            return // Skip if health status doesn't match
          }
        }

        // If no specific filters, include all applications
        if (!filter.productName && !filter.customerName && !filter.version && 
            !filter.syncStatus && !filter.healthStatus) {
          matchScore = 1
        }

        if (matchScore > 0) {
          results.push({
            application: app,
            productName,
            customerName,
            version,
            matchScore
          })
        }
      })

      // Sort by match score (highest first)
      return results.sort((a, b) => b.matchScore - a.matchScore)
    } catch (error) {
      console.error('Failed to search applications:', error)
      throw error
    }
  }

  // Sync application
  async syncApplication(name: string, namespace?: string, options?: {
    dryRun?: boolean
    prune?: boolean
    force?: boolean
  }): Promise<any> {
    try {
      const appName = namespace ? `${namespace}/${name}` : name
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

      const response = await this.client.post(`/applications/${appName}/sync`, syncRequest)
      return response.data
    } catch (error) {
      console.error(`Failed to sync application ${name}:`, error)
      throw error
    }
  }

  // Get repositories
  async getRepositories(): Promise<ArgoCDRepository[]> {
    try {
      const response = await this.client.get('/repositories')
      return response.data.items || []
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
      throw error
    }
  }
}