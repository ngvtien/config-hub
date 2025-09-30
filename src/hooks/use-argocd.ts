import { useState, useEffect, useCallback } from 'react'
import { useEnvironment } from '@/contexts/environment-context'
import { useEnvironmentSettings } from '@/hooks/use-environment-settings'
import { argoCDService } from '@/services/argocd-service'
import { 
  ArgoCDApplication, 
  ApplicationFilter, 
  ApplicationSearchResult,
  ArgoCDApplicationLogs,
  ArgoCDApplicationEvents
} from '@/types/argocd'

export interface UseArgoCDOptions {
  autoFetch?: boolean
  refreshInterval?: number
}

export function useArgoCD(options: UseArgoCDOptions = {}) {
  const { environment } = useEnvironment()
  const { settings } = useEnvironmentSettings()
  const [applications, setApplications] = useState<ArgoCDApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  // Test connection
  const testConnection = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const isConnected = await argoCDService.testConnection(environment, settings)
      setConnected(isConnected)
      return isConnected
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed'
      setError(errorMessage)
      setConnected(false)
      return false
    } finally {
      setLoading(false)
    }
  }, [environment, settings])

  // Fetch all applications
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const apps = await argoCDService.getApplications(environment, settings)
      setApplications(apps)
      setConnected(true)
      return apps
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch applications'
      setError(errorMessage)
      setConnected(false)
      return []
    } finally {
      setLoading(false)
    }
  }, [environment, settings])

  // Search applications
  const searchApplications = useCallback(async (filter: ApplicationFilter): Promise<ApplicationSearchResult[]> => {
    try {
      setLoading(true)
      setError(null)
      const results = await argoCDService.searchApplications(filter, environment, settings)
      setConnected(true)
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      setConnected(false)
      return []
    } finally {
      setLoading(false)
    }
  }, [environment, settings])

  // Get specific application
  const getApplication = useCallback(async (name: string, namespace?: string): Promise<ArgoCDApplication | null> => {
    try {
      setLoading(true)
      setError(null)
      const app = await argoCDService.getApplication(name, environment, settings, namespace)
      setConnected(true)
      return app
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch application'
      setError(errorMessage)
      setConnected(false)
      return null
    } finally {
      setLoading(false)
    }
  }, [environment, settings])

  // Refresh data
  const refresh = useCallback(() => {
    if (options.autoFetch !== false) {
      fetchApplications()
    }
  }, [fetchApplications, options.autoFetch])

  // Auto-fetch on mount and environment change
  useEffect(() => {
    if (options.autoFetch !== false && settings.argocd.serverUrl && settings.argocd.token) {
      fetchApplications()
    }
  }, [fetchApplications, options.autoFetch, settings.argocd.serverUrl, settings.argocd.token])

  // Auto-refresh interval
  useEffect(() => {
    if (options.refreshInterval && options.refreshInterval > 0) {
      const interval = setInterval(refresh, options.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, options.refreshInterval])

  return {
    applications,
    loading,
    error,
    connected,
    testConnection,
    fetchApplications,
    searchApplications,
    getApplication,
    refresh
  }
}

// Hook for application details
export function useArgoCDApplication(name: string, namespace?: string) {
  const { environment } = useEnvironment()
  const { settings } = useEnvironmentSettings()
  const [application, setApplication] = useState<ArgoCDApplication | null>(null)
  const [logs, setLogs] = useState<ArgoCDApplicationLogs[]>([])
  const [events, setEvents] = useState<ArgoCDApplicationEvents[]>([])
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch application details
  const fetchApplication = useCallback(async () => {
    if (!name) return

    try {
      setLoading(true)
      setError(null)
      
      const [app, appLogs, appEvents, appParams] = await Promise.all([
        argoCDService.getApplication(name, environment, settings, namespace),
        argoCDService.getApplicationLogs(name, environment, settings, { 
          namespace, 
          tailLines: 100 
        }),
        argoCDService.getApplicationEvents(name, environment, settings, namespace),
        argoCDService.getApplicationParameters(name, environment, settings, namespace)
      ])

      setApplication(app)
      setLogs(appLogs)
      setEvents(appEvents)
      setParameters(appParams)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch application details'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [name, namespace, environment, settings])

  // Sync application
  const syncApplication = useCallback(async (options?: {
    dryRun?: boolean
    prune?: boolean
    force?: boolean
  }) => {
    if (!name) return null

    try {
      setLoading(true)
      setError(null)
      
      const result = await argoCDService.syncApplication(name, environment, settings, {
        namespace,
        ...options
      })
      
      // Refresh application data after sync
      setTimeout(fetchApplication, 2000)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [name, namespace, environment, settings, fetchApplication])

  // Compare parameters
  const compareParameters = useCallback((proposedParams: Record<string, any>) => {
    return argoCDService.compareParameters(parameters, proposedParams)
  }, [parameters])

  useEffect(() => {
    if (name && settings.argocd.serverUrl && settings.argocd.token) {
      fetchApplication()
    }
  }, [fetchApplication, name, settings.argocd.serverUrl, settings.argocd.token])

  return {
    application,
    logs,
    events,
    parameters,
    loading,
    error,
    fetchApplication,
    syncApplication,
    compareParameters
  }
}