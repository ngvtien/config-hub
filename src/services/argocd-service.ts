import { Environment } from '@/contexts/environment-context'
import { EnvironmentSettings } from '@/hooks/use-environment-settings'
import { 
  ArgoCDApplication, 
  ApplicationFilter, 
  ApplicationSearchResult,
  ArgoCDApplicationLogs,
  ArgoCDApplicationEvents
} from '@/types/argocd'

export class ArgoCDService {
  // Check if we're in Electron environment
  private get isElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI
  }

  // Get ArgoCD config from settings
  private getConfig(settings: EnvironmentSettings) {
    return {
      serverUrl: settings.argocd.serverUrl,
      token: settings.argocd.token,
      username: settings.argocd.username,
      namespace: settings.argocd.namespace
    }
  }

  // Store credentials securely via IPC
  private async storeCredentials(environment: Environment, settings: EnvironmentSettings): Promise<void> {
    if (!this.isElectron) {
      throw new Error('ArgoCD integration requires Electron environment')
    }

    const config = this.getConfig(settings)
    if (!config.serverUrl || !config.token) {
      throw new Error(`ArgoCD configuration incomplete for environment: ${environment}`)
    }

    const result = await window.electronAPI.argocd.storeCredentials(environment, config)
    if (!result.success) {
      throw new Error(result.error || 'Failed to store credentials')
    }
  }

  // Test connection for environment
  async testConnection(environment: Environment, settings: EnvironmentSettings): Promise<boolean> {
    try {
      if (!this.isElectron) {
        throw new Error('ArgoCD integration requires Electron environment')
      }

      // Store credentials first
      await this.storeCredentials(environment, settings)
      
      // Test connection via IPC
      const result = await window.electronAPI.argocd.testConnection(environment)
      return result.success && result.connected === true
    } catch (error) {
      console.error(`Failed to test ArgoCD connection for ${environment}:`, error)
      return false
    }
  }

  // Get all applications for environment
  async getApplications(environment: Environment, settings: EnvironmentSettings): Promise<ArgoCDApplication[]> {
    try {
      if (!this.isElectron) {
        throw new Error('ArgoCD integration requires Electron environment')
      }

      // Store credentials first
      await this.storeCredentials(environment, settings)
      
      // Get applications via IPC
      const result = await window.electronAPI.argocd.getApplications(environment)
      if (!result.success) {
        throw new Error(result.error || 'Failed to get applications')
      }
      
      return result.data || []
    } catch (error) {
      console.error(`Failed to get applications for ${environment}:`, error)
      throw error
    }
  }

  // Get specific application
  async getApplication(
    name: string, 
    environment: Environment, 
    settings: EnvironmentSettings,
    namespace?: string
  ): Promise<ArgoCDApplication> {
    try {
      if (!this.isElectron) {
        throw new Error('ArgoCD integration requires Electron environment')
      }

      // Store credentials first
      await this.storeCredentials(environment, settings)
      
      // Get application via IPC
      const result = await window.electronAPI.argocd.getApplication(environment, name, namespace)
      if (!result.success) {
        throw new Error(result.error || 'Failed to get application')
      }
      
      return result.data
    } catch (error) {
      console.error(`Failed to get application ${name} for ${environment}:`, error)
      throw error
    }
  }

  // Search applications with enhanced filtering
  async searchApplications(
    filter: ApplicationFilter, 
    environment: Environment, 
    settings: EnvironmentSettings
  ): Promise<ApplicationSearchResult[]> {
    try {
      // Get all applications first
      const applications = await this.getApplications(environment, settings)
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

  // Get application logs
  async getApplicationLogs(
    name: string,
    environment: Environment,
    settings: EnvironmentSettings,
    options?: {
      namespace?: string
      container?: string
      sinceSeconds?: number
      tailLines?: number
      follow?: boolean
    }
  ): Promise<ArgoCDApplicationLogs[]> {
    try {
      if (!this.isElectron) {
        throw new Error('ArgoCD integration requires Electron environment')
      }

      // Store credentials first
      await this.storeCredentials(environment, settings)
      
      // Get logs via IPC
      const result = await window.electronAPI.argocd.getApplicationLogs(environment, name, {
        namespace: options?.namespace,
        container: options?.container,
        sinceSeconds: options?.sinceSeconds,
        tailLines: options?.tailLines
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get application logs')
      }
      
      return result.data || []
    } catch (error) {
      console.error(`Failed to get logs for application ${name}:`, error)
      throw error
    }
  }

  // Get application events
  async getApplicationEvents(
    name: string,
    environment: Environment,
    settings: EnvironmentSettings,
    namespace?: string
  ): Promise<ArgoCDApplicationEvents[]> {
    try {
      if (!this.isElectron) {
        throw new Error('ArgoCD integration requires Electron environment')
      }

      // Store credentials first
      await this.storeCredentials(environment, settings)
      
      // Get events via IPC
      const result = await window.electronAPI.argocd.getApplicationEvents(environment, name, namespace)
      if (!result.success) {
        throw new Error(result.error || 'Failed to get application events')
      }
      
      return result.data || []
    } catch (error) {
      console.error(`Failed to get events for application ${name}:`, error)
      throw error
    }
  }

  // Get application parameters
  async getApplicationParameters(
    name: string,
    environment: Environment,
    settings: EnvironmentSettings,
    namespace?: string
  ): Promise<Record<string, any>> {
    try {
      const app = await this.getApplication(name, environment, settings, namespace)
      
      // Extract Helm parameters
      const helmParams = app.spec.source.helm?.parameters || []
      const parameters: Record<string, any> = {}
      
      helmParams.forEach(param => {
        parameters[param.name] = param.value
      })

      return parameters
    } catch (error) {
      console.error(`Failed to get parameters for application ${name}:`, error)
      throw error
    }
  }

  // Compare parameters (for diff view)
  compareParameters(
    current: Record<string, any>,
    proposed: Record<string, any>
  ): {
    added: Record<string, any>
    modified: Record<string, { current: any; proposed: any }>
    removed: Record<string, any>
    unchanged: Record<string, any>
  } {
    const added: Record<string, any> = {}
    const modified: Record<string, { current: any; proposed: any }> = {}
    const removed: Record<string, any> = {}
    const unchanged: Record<string, any> = {}

    // Find added and modified parameters
    Object.keys(proposed).forEach(key => {
      if (!(key in current)) {
        added[key] = proposed[key]
      } else if (current[key] !== proposed[key]) {
        modified[key] = {
          current: current[key],
          proposed: proposed[key]
        }
      } else {
        unchanged[key] = current[key]
      }
    })

    // Find removed parameters
    Object.keys(current).forEach(key => {
      if (!(key in proposed)) {
        removed[key] = current[key]
      }
    })

    return { added, modified, removed, unchanged }
  }

  // Sync application
  async syncApplication(
    name: string,
    environment: Environment,
    settings: EnvironmentSettings,
    options?: {
      namespace?: string
      dryRun?: boolean
      prune?: boolean
      force?: boolean
    }
  ): Promise<any> {
    try {
      if (!this.isElectron) {
        throw new Error('ArgoCD integration requires Electron environment')
      }

      // Store credentials first
      await this.storeCredentials(environment, settings)
      
      // Sync application via IPC
      const result = await window.electronAPI.argocd.syncApplication(environment, name, {
        namespace: options?.namespace,
        dryRun: options?.dryRun,
        prune: options?.prune,
        force: options?.force
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to sync application')
      }
      
      return result.data
    } catch (error) {
      console.error(`Failed to sync application ${name}:`, error)
      throw error
    }
  }

  // Clear cached credentials (useful when settings change)
  async clearCache(): Promise<void> {
    try {
      if (!this.isElectron) {
        return
      }

      const result = await window.electronAPI.argocd.clearCache()
      if (!result.success) {
        console.error('Failed to clear ArgoCD cache:', result.error)
      }
    } catch (error) {
      console.error('Failed to clear ArgoCD cache:', error)
    }
  }
}

// Singleton instance
export const argoCDService = new ArgoCDService()