import { useState, useEffect, useCallback } from 'react'

export interface GitCredentialInfo {
  id: string
  name: string
  repoUrl: string
  username?: string
  authType: 'token' | 'ssh' | 'userpass'
}

export interface UseGitCredentialsResult {
  hasCredentials: boolean
  credentials: GitCredentialInfo | null
  loading: boolean
  error: string | null
  storeCredentials: (config: {
    name: string
    username: string
    token: string
  }) => Promise<string | null>
  refresh: () => void
}

/**
 * Hook to manage Git credentials for a specific repository
 * Follows the same pattern as useArgoCDCredentials
 */
export function useGitCredentials(repoUrl: string): UseGitCredentialsResult {
  const [hasCredentials, setHasCredentials] = useState(false)
  const [credentials, setCredentials] = useState<GitCredentialInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if credentials exist for this repository
  const checkCredentials = useCallback(async () => {
    if (!repoUrl) {
      setHasCredentials(false)
      setCredentials(null)
      return
    }

    // Check if we're in Electron environment
    if (typeof window === 'undefined' || !window.electronAPI) {
      setError('Not running in Electron environment')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await window.electronAPI.git.findCredentialsByRepo(repoUrl)

      if (result.success && result.data && result.data.length > 0) {
        // Use the first matching credential
        const cred = result.data[0]
        setHasCredentials(true)
        setCredentials(cred)
      } else {
        setHasCredentials(false)
        setCredentials(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check credentials'
      setError(errorMessage)
      setHasCredentials(false)
      setCredentials(null)
    } finally {
      setLoading(false)
    }
  }, [repoUrl])

  // Store new credentials
  const storeCredentials = useCallback(
    async (config: { name: string; username: string; token: string }): Promise<string | null> => {
      if (!repoUrl) {
        throw new Error('Repository URL is required')
      }

      // Check if we're in Electron environment
      if (typeof window === 'undefined' || !window.electronAPI) {
        throw new Error('Not running in Electron environment')
      }

      try {
        setLoading(true)
        setError(null)

        const credentialConfig: GitConfig = {
          name: config.name,
          repoUrl: repoUrl,
          authType: 'token',
          username: config.username,
          token: config.token,
        }

        const result: GitResponse = await window.electronAPI.git.storeCredential(credentialConfig)

        if (!result.success) {
          throw new Error(result.error || 'Failed to store credentials')
        }

        // Refresh credentials after storing
        await checkCredentials()

        return result.credentialId || null
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to store credentials'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [repoUrl, checkCredentials]
  )

  // Refresh credentials
  const refresh = useCallback(() => {
    checkCredentials()
  }, [checkCredentials])

  // Auto-check credentials on mount and when repoUrl changes
  useEffect(() => {
    if (repoUrl) {
      checkCredentials()
    }
  }, [checkCredentials, repoUrl])

  return {
    hasCredentials,
    credentials,
    loading,
    error,
    storeCredentials,
    refresh,
  }
}
