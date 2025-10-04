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
      console.log(`[ArgoCD Client] Fetching application - name: ${name}, namespace: ${namespace}, appName: ${appName}`)
      const response = await this.client.get<ArgoCDApplication>(`/applications/${appName}`)
      console.log(`[ArgoCD Client] Successfully fetched application ${appName}`)
      return response.data
    } catch (error) {
      console.error(`[ArgoCD Client] Failed to fetch application ${name} (namespace: ${namespace}):`, error)
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

      console.log('[ArgoCD Client] Logs response type:', typeof response.data)
      console.log('[ArgoCD Client] Logs response sample:', JSON.stringify(response.data).substring(0, 500))
      console.log('[ArgoCD Client] Is array?', Array.isArray(response.data))

      // Parse log stream response
      const logs: ArgoCDApplicationLogs[] = []

      // Handle different response formats
      if (typeof response.data === 'string') {
        // Response is concatenated JSON objects like: {...}{...}{...}
        // Split by }{ and add back the braces
        let jsonStrings: string[] = []
        if (response.data.includes('}{')) {
          jsonStrings = response.data.split('}{').map((str, idx, arr) => {
            if (idx === 0) return str + '}'
            if (idx === arr.length - 1) return '{' + str
            return '{' + str + '}'
          })
        } else {
          // Single JSON object or newline-separated
          jsonStrings = response.data.split('\n').filter((line: string) => line.trim())
        }

        jsonStrings.forEach((jsonStr: string) => {
          try {
            const parsed = JSON.parse(jsonStr)

            // Handle {"result": {...}} wrapper format
            if (parsed.result) {
              const result = parsed.result
              // Only add logs with content
              if (result.content && result.content.trim()) {
                logs.push({
                  content: result.content,
                  timeStamp: result.timeStamp || result.timeStampStr || new Date().toISOString(),
                  last: result.last || false
                })
              }
            } else if (parsed.content !== undefined) {
              // Direct log entry format
              if (parsed.content && parsed.content.trim()) {
                logs.push(parsed)
              }
            } else {
              // Unknown format, stringify it
              logs.push({
                content: JSON.stringify(parsed),
                timeStamp: new Date().toISOString(),
                last: false
              })
            }
          } catch (e) {
            // Handle plain text logs
            if (jsonStr.trim()) {
              logs.push({
                content: jsonStr,
                timeStamp: new Date().toISOString(),
                last: false
              })
            }
          }
        })
      } else if (Array.isArray(response.data)) {
        // Response is already an array - parse each item
        console.log('[ArgoCD Client] Response is array with', response.data.length, 'items')
        response.data.forEach((item: any) => {
          if (item.result) {
            const result = item.result
            if (result.content && result.content.trim()) {
              logs.push({
                content: result.content,
                timeStamp: result.timeStamp || result.timeStampStr || new Date().toISOString(),
                last: result.last || false
              })
            }
          } else if (item.content) {
            if (item.content.trim()) {
              logs.push(item)
            }
          }
        })
      } else if (response.data && typeof response.data === 'object') {
        // Response is an object, might have a logs property
        if (response.data.logs) {
          console.log('[ArgoCD Client] Response has logs property')
          return response.data.logs
        }
        // Or it might be a single log entry
        console.log('[ArgoCD Client] Response is single object')
        logs.push(response.data)
      }

      console.log('[ArgoCD Client] Returning', logs.length, 'logs')
      if (logs.length > 0) {
        console.log('[ArgoCD Client] First log:', logs[0])
      }

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

      // Extract Helm parameters - handle both single and multi-source
      const source = app.spec.source || app.spec.sources?.[0]
      const helmParams = source?.helm?.parameters || []
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
          app.spec.source?.targetRevision || app.spec.sources?.[0]?.targetRevision || ''

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