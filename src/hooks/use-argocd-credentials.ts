import { useEffect } from 'react'
import { useEnvironment } from '@/contexts/environment-context'
import { useEnvironmentSettings } from '@/hooks/use-environment-settings'

// Hook to automatically store ArgoCD credentials when settings change
export function useArgoCDCredentials() {
  const { environment } = useEnvironment()
  const { settings, updateSection } = useEnvironmentSettings()

  useEffect(() => {
    // Only store credentials if we have both serverUrl and token, but no existing credentialId
    if (settings.argocd.serverUrl && settings.argocd.token && !settings.argocd.credentialId) {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI) {
        const storeCredentials = async () => {
          try {
            const config = {
              name: settings.argocd.credentialName || `ArgoCD ${environment.toUpperCase()}`,
              serverUrl: settings.argocd.serverUrl,
              token: settings.argocd.token,
              username: settings.argocd.username,
              password: settings.argocd.password,
              namespace: settings.argocd.namespace,
              environment,
              tags: ['auto-stored']
            }

            const result = await window.electronAPI.argocd.storeCredentials(config)
            if (result.success && result.credentialId) {
              // Update settings with the credential ID
              updateSection('argocd', { 
                credentialId: result.credentialId,
                credentialName: config.name
              })
              console.log('ArgoCD credentials stored successfully:', result.credentialId)
            } else {
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
  }, [environment, settings.argocd.serverUrl, settings.argocd.token, settings.argocd.username, settings.argocd.namespace, settings.argocd.credentialId, updateSection])
}