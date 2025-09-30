import { useEffect } from 'react'
import { useEnvironment } from '@/contexts/environment-context'
import { useEnvironmentSettings } from '@/hooks/use-environment-settings'

// Hook to automatically store ArgoCD credentials when settings change
export function useArgoCDCredentials() {
  const { environment } = useEnvironment()
  const { settings } = useEnvironmentSettings()

  useEffect(() => {
    // Only store credentials if we have both serverUrl and token
    if (settings.argocd.serverUrl && settings.argocd.token) {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI) {
        const storeCredentials = async () => {
          try {
            const config = {
              serverUrl: settings.argocd.serverUrl,
              token: settings.argocd.token,
              username: settings.argocd.username,
              namespace: settings.argocd.namespace
            }

            const result = await window.electronAPI.argocd.storeCredentials(environment, config)
            if (!result.success) {
              console.error('Failed to store ArgoCD credentials:', result.error)
            }
          } catch (error) {
            console.error('Failed to store ArgoCD credentials:', error)
          }
        }

        // Store credentials with a small delay to avoid excessive calls
        const timeoutId = setTimeout(storeCredentials, 500)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [environment, settings.argocd.serverUrl, settings.argocd.token, settings.argocd.username, settings.argocd.namespace])
}