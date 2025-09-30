import { useEffect } from 'react'
import { useEnvironment } from '@/contexts/environment-context'
import { useEnvironmentSettings } from '@/hooks/use-environment-settings'

// Hook to automatically store Vault credentials when settings change
export function useVaultCredentials() {
  const { environment } = useEnvironment()
  const { settings } = useEnvironmentSettings()

  useEffect(() => {
    // Only store credentials if we have serverUrl and appropriate auth method credentials
    const hasRequiredCredentials = () => {
      if (!settings.vault.serverUrl) return false
      
      switch (settings.vault.authMethod) {
        case 'token':
          return !!settings.vault.token
        case 'userpass':
        case 'ldap':
          return !!settings.vault.username && !!settings.vault.password
        case 'kubernetes':
          return !!settings.vault.kubernetesRole
        case 'aws':
          return !!settings.vault.awsRole
        case 'azure':
          return !!settings.vault.azureRole
        default:
          return false
      }
    }

    if (hasRequiredCredentials()) {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI) {
        const storeCredentials = async () => {
          try {
            const config = {
              serverUrl: settings.vault.serverUrl,
              authMethod: settings.vault.authMethod,
              token: settings.vault.token,
              username: settings.vault.username,
              password: settings.vault.password,
              namespace: settings.vault.namespace,
              mountPath: settings.vault.mountPath,
              roleId: settings.vault.roleId,
              secretId: settings.vault.secretId,
              kubernetesRole: settings.vault.kubernetesRole,
              awsRole: settings.vault.awsRole,
              azureRole: settings.vault.azureRole
            }

            const result = await window.electronAPI.vault.storeCredentials(environment, config)
            if (!result.success) {
              console.error('Failed to store Vault credentials:', result.error)
            }
          } catch (error) {
            console.error('Failed to store Vault credentials:', error)
          }
        }

        // Store credentials with a small delay to avoid excessive calls
        const timeoutId = setTimeout(storeCredentials, 500)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [
    environment, 
    settings.vault.serverUrl, 
    settings.vault.authMethod,
    settings.vault.token,
    settings.vault.username,
    settings.vault.password,
    settings.vault.namespace,
    settings.vault.mountPath,
    settings.vault.kubernetesRole,
    settings.vault.awsRole,
    settings.vault.azureRole
  ])
}