import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GitBranch, GitPullRequest, RefreshCw, Eye, ExternalLink } from 'lucide-react'
import { usePullRequests } from '@/hooks/use-pull-requests'
import { useGitCredentials } from '@/hooks/use-git-credentials'
import { PRDetailDialog } from '@/components/pr-detail-dialog'
import type { GitSourceInfo } from '@/lib/git-source-utils'
import type { PullRequest } from '@/types/git'

interface SourcePullRequestsProps {
  source: GitSourceInfo
  index: number
  onEditFiles: () => void
}

export function SourcePullRequests({ source, index, onEditFiles }: SourcePullRequestsProps) {
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null)
  const [showPRDetail, setShowPRDetail] = useState(false)
  
  const { pullRequests, loading, error, refetch, hasCredentials } = usePullRequests({
    repoUrl: source.repoURL,
    state: 'open',
    limit: 10
  })
  
  const { credentials } = useGitCredentials(source.repoURL)

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'merged': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'declined': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else {
      return 'Less than an hour ago'
    }
  }

  return (
    <>
    <Card className="border-l-4 border-l-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">
              Source {index + 1}: {source.repoURL.split('/').pop()?.replace('.git', '')}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {source.targetRevision || 'main'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading...
              </Badge>
            ) : (
              <Badge variant="secondary">
                {pullRequests.length} PR{pullRequests.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={refetch}
              disabled={loading || !hasCredentials}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Repository Info */}
        <div className="text-sm space-y-2">
          <div>
            <span className="text-muted-foreground">Repository: </span>
            <span className="font-mono text-xs break-all">{source.repoURL}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Branch: </span>
            <Badge variant="outline" className="text-xs font-mono">
              {source.targetRevision || 'main'}
            </Badge>
          </div>
          {source.path && (
            <div>
              <span className="text-muted-foreground">Path: </span>
              <span className="font-mono text-xs">{source.path}</span>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="border rounded-lg p-4 bg-destructive/5 border-destructive/20">
            <p className="text-sm text-destructive font-medium">Failed to load pull requests</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
            <Button size="sm" variant="outline" onClick={refetch} className="mt-2">
              Try Again
            </Button>
          </div>
        )}

        {/* No Credentials */}
        {!hasCredentials && !loading && (
          <div className="border rounded-lg p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium">No Git credentials configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure Git credentials to view pull requests for this repository
            </p>
          </div>
        )}

        {/* Pull Requests List */}
        {hasCredentials && !error && (
          <div className="border rounded-lg p-4">
            {pullRequests.length > 0 ? (
              <div className="space-y-3">
                {pullRequests.map((pr) => (
                  <div
                    key={pr.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          #{pr.id}
                        </Badge>
                        <span className="font-medium text-sm truncate">{pr.title}</span>
                        <Badge className={`text-xs ${getStatusColor(pr.state)}`}>
                          {pr.state.charAt(0).toUpperCase() + pr.state.slice(1)}
                        </Badge>
                      </div>
                      {pr.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {pr.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>by {pr.author.displayName || pr.author.name}</span>
                        <span>{formatTimeAgo(pr.createdAt)}</span>
                        <span>{pr.targetBranch} ← {pr.sourceBranch}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {pr.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(pr.url, '_blank')}
                          className="h-7"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        className="h-7"
                        onClick={() => {
                          setSelectedPR(pr)
                          setShowPRDetail(true)
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center space-y-3">
                <GitPullRequest className="h-8 w-8 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium text-sm">No active pull requests</p>
                  <p className="text-xs text-muted-foreground">
                    No PRs found for this repository and branch
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={onEditFiles}>
                    Edit Files
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(source.repoURL, '_blank')}
                  >
                    View in Git
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* PR Detail Dialog with Diff View */}
    <PRDetailDialog
      open={showPRDetail}
      onOpenChange={setShowPRDetail}
      pullRequest={selectedPR}
      credentialId={credentials?.id || null}
      onMerge={(prId) => {
        // Handle merge - could refresh PR list
        console.log('Merging PR:', prId)
        setShowPRDetail(false)
        refetch()
      }}
    />
  </>
  )
}