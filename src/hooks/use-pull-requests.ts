import { useState, useEffect } from 'react'
import { useGitCredentials } from './use-git-credentials'

import type { PullRequest } from '@/types/git'

interface UsePullRequestsOptions {
  repoUrl: string
  state?: 'open' | 'merged' | 'declined' | 'all'
  limit?: number
  autoFetch?: boolean
}

export function usePullRequests({
  repoUrl,
  state = 'open',
  limit = 10,
  autoFetch = true
}: UsePullRequestsOptions) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { credentials, loading: credentialsLoading } = useGitCredentials(repoUrl)

  const fetchPullRequests = async () => {
    if (!credentials?.id || !window.electronAPI) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await window.electronAPI.git.listPullRequests(
        credentials.id,
        repoUrl,
        state,
        limit
      )

      if (result.success && result.data) {
        setPullRequests(result.data)
      } else {
        setError(result.error || 'Failed to fetch pull requests')
        setPullRequests([])
      }
    } catch (err) {
      console.error('Error fetching pull requests:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setPullRequests([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch when credentials are available
  useEffect(() => {
    if (autoFetch && credentials?.id && !credentialsLoading) {
      fetchPullRequests()
    }
  }, [credentials?.id, credentialsLoading, autoFetch, state, limit])

  return {
    pullRequests,
    loading: loading || credentialsLoading,
    error,
    refetch: fetchPullRequests,
    hasCredentials: !!credentials?.id
  }
}