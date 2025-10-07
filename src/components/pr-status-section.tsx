import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  GitPullRequest,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertCircle,
  ExternalLink,
  Eye
} from 'lucide-react'
import type { ArgoCDApplication } from '@/types/argocd'
import type { PullRequest } from '@/types/git'
import type { GitSourceInfo } from '@/lib/git-source-utils'
import { PRDetailDialog } from './pr-detail-dialog'

interface PRStatusSectionProps {
  application: ArgoCDApplication
  selectedSource?: GitSourceInfo | null
  refreshTrigger?: number
}

export function PRStatusSection({ selectedSource, refreshTrigger }: PRStatusSectionProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credentialId, setCredentialId] = useState<string | null>(null)
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [mergingPRId, setMergingPRId] = useState<number | null>(null)

  // Use selected source if provided, otherwise fall back to legacy behavior
  const repoUrl = selectedSource?.repoURL || null
  const targetBranch = selectedSource?.targetRevision || 'main'

  // Find credentials for this repository and reset state when source changes
  useEffect(() => {
    const findCredentials = async () => {
      if (!repoUrl || !window.electronAPI) {
        setCredentialId(null)
        setPullRequests([])
        return
      }

      // Reset state when switching sources
      setCredentialId(null)
      setPullRequests([])
      setError(null)

      try {
        const result = await window.electronAPI.git.findCredentialsByRepo(repoUrl)
        if (result.success && result.data && result.data.length > 0) {
          setCredentialId(result.data[0].id)
        } else {
          setError('No credentials found for this repository')
        }
      } catch (err) {
        console.error('Failed to find credentials:', err)
        setError('Failed to find credentials')
      }
    }

    findCredentials()
  }, [repoUrl])

  // Fetch pull requests for the selected source's repository
  const fetchPullRequests = async () => {
    if (!credentialId || !window.electronAPI) return

    setLoading(true)
    setError(null)

    try {
      const result = await window.electronAPI.git.listPullRequests(credentialId, 'open', 10)
      
      if (result.success && result.data) {
        // Filter PRs by target branch to only show PRs targeting this source's branch
        const filteredPRs = result.data.filter(pr => pr.targetBranch === targetBranch)
        setPullRequests(filteredPRs)
      } else {
        setError(result.error || 'Failed to fetch pull requests')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount and when credential is available or refresh triggered
  useEffect(() => {
    if (credentialId) {
      fetchPullRequests()
    }
  }, [credentialId, refreshTrigger, targetBranch])

  // Don't show section if no repo URL
  if (!repoUrl) {
    return null
  }

  // Don't show section if no credentials
  if (!credentialId) {
    return null
  }

  // Don't show section if no PRs and not loading/error
  if (!loading && pullRequests.length === 0 && !error) {
    return null
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'open':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'merged':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'open':
        return <Badge variant="default">Open</Badge>
      case 'merged':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">Merged</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      default:
        return <Badge variant="outline">{state}</Badge>
    }
  }

  const handleViewDetails = (pr: PullRequest) => {
    setSelectedPR(pr)
    setDetailDialogOpen(true)
  }

  const handleMergePR = async (prId: number) => {
    if (!credentialId || !window.electronAPI) return

    setMergingPRId(prId)
    setError(null)

    try {
      const result = await window.electronAPI.git.mergePullRequest(credentialId, prId)
      
      if (result.success) {
        // Refresh the PR list
        await fetchPullRequests()
        setDetailDialogOpen(false)
      } else {
        setError(result.error || 'Failed to merge pull request')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setMergingPRId(null)
    }
  }

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Pull Requests
            {pullRequests.length > 0 && (
              <Badge variant="secondary">{pullRequests.length}</Badge>
            )}
            {selectedSource && (
              <Badge variant="outline" className="text-xs font-normal">
                Source {selectedSource.index + 1}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPullRequests}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading pull requests...
          </div>
        )}

        {pullRequests.length > 0 && (
          <div className="space-y-3">
            {pullRequests.map((pr) => (
              <div
                key={pr.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getStateIcon(pr.state)}
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline flex items-center gap-1"
                      >
                        #{pr.id}: {pr.title}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {pr.author.displayName}
                      </div>
                      <div>
                        {pr.sourceBranch} → {pr.targetBranch}
                      </div>
                      <div>
                        {new Date(pr.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {pr.reviewers && pr.reviewers.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Reviewers:</span>
                        <div className="flex items-center gap-2">
                          {pr.reviewers.map((reviewer, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              {reviewer.approved ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-gray-400" />
                              )}
                              <span className={reviewer.approved ? 'text-green-600 dark:text-green-400' : ''}>
                                {reviewer.displayName}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pr.approvals !== undefined && (
                      <div className="text-sm">
                        <Badge variant="outline" className="text-xs">
                          {pr.approvals} {pr.approvals === 1 ? 'approval' : 'approvals'}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {getStateBadge(pr.state)}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(pr)}
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View Details
                      </Button>
                      {/* Merge button - only show for open PRs with approvals */}
                      {pr.state === 'open' && pr.approvals && pr.approvals > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMergePR(pr.id)
                          }}
                          disabled={mergingPRId === pr.id}
                          className="gap-1"
                        >
                          {mergingPRId === pr.id ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Merging...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Merge
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

      <PRDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        pullRequest={selectedPR}
        credentialId={credentialId}
        onMerge={handleMergePR}
      />
    </>
  )
}
