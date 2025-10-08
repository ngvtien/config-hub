import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GitBranch, Folder, Check, GitPullRequest, RefreshCw, ExternalLink, Eye } from 'lucide-react'
import type { GitSourceInfo } from '@/lib/git-source-utils'
import type { PullRequest } from '@/types/git'
import { cn } from '@/lib/utils'
import { useGitCredentials } from '@/hooks/use-git-credentials'
import { PRDetailDialog } from './pr-detail-dialog'

interface GitSourceSelectorProps {
  sources: GitSourceInfo[]
  selectedIndex: number
  onSelectSource: (index: number) => void
  refreshTrigger?: number
}

interface SourceItemProps {
  source: GitSourceInfo
  isSelected: boolean
  onSelect: () => void
  prCount?: number
  onTogglePRs?: () => void
}

function SourceItem({ source, isSelected, onSelect, prCount, onTogglePRs }: SourceItemProps) {
  const { hasCredentials, credentials } = useGitCredentials(source.repoURL)
  
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      {/* Radio indicator */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'border-primary bg-primary'
              : 'border-muted-foreground'
          )}
        >
          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
      </div>

      {/* Source info */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* First line: badges and name */}
        <div className="flex items-center gap-2">
          <Badge variant={isSelected ? 'default' : 'outline'} className="text-xs">
            Source {source.index + 1}
          </Badge>
          {source.ref && (
            <Badge variant="secondary" className="text-xs">
              ref: {source.ref}
            </Badge>
          )}
          <span className="font-medium text-sm">{source.displayName}</span>
        </div>
        
        {/* Second line: repository URL with tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-xs text-muted-foreground font-mono truncate cursor-help">
              {source.repoURL}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-md">
            <p className="font-mono text-xs break-all">{source.repoURL}</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Third line: branch and path */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            <span className="font-mono">{source.targetRevision}</span>
          </div>
          {source.path && (
            <>
              <span>•</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 min-w-0 cursor-help">
                    <Folder className="h-3 w-3 flex-shrink-0" />
                    <span className="font-mono truncate">{source.path}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                  <p className="font-mono text-xs">{source.path}</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
      
      {/* Right side badges (only for selected source) */}
      {isSelected && (
        <div className="flex-shrink-0 flex items-center gap-2">
          {/* PR Badge - clickable to toggle */}
          {prCount !== undefined && prCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="gap-1.5 cursor-pointer hover:bg-muted transition-colors h-6 px-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTogglePRs?.()
                  }}
                >
                  <GitPullRequest className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">{prCount} PR{prCount !== 1 ? 's' : ''}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to {prCount === 1 ? 'show' : 'toggle'} pull request{prCount !== 1 ? 's' : ''}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Auth Badge */}
          {hasCredentials && credentials && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1.5 font-normal border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 h-6 px-2">
                  <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                  <span className="font-mono text-sm">{credentials.username}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Authenticated as {credentials.username}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  )
}

export function GitSourceSelector({
  sources,
  selectedIndex,
  onSelectSource,
  refreshTrigger,
}: GitSourceSelectorProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [loadingPRs, setLoadingPRs] = useState(false)
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [showPRs, setShowPRs] = useState(false) // Collapsed by default
  
  if (sources.length === 0) {
    return null
  }

  const selectedSource = sources.find(s => s.index === selectedIndex) || sources[0]
  const { hasCredentials, credentials } = useGitCredentials(selectedSource.repoURL)
  
  // Fetch pull requests for the selected source
  const fetchPullRequests = async () => {
    if (!credentials?.id || !window.electronAPI) return

    setLoadingPRs(true)

    try {
      const result = await window.electronAPI.git.listPullRequests(credentials.id, 'open', 10)
      
      if (result.success && result.data) {
        // Filter PRs by target branch
        const filteredPRs = result.data.filter(pr => pr.targetBranch === selectedSource.targetRevision)
        setPullRequests(filteredPRs)
      }
    } catch (err) {
      console.error('Failed to fetch PRs:', err)
    } finally {
      setLoadingPRs(false)
    }
  }

  // Fetch PRs when source changes or refresh triggered
  useEffect(() => {
    if (credentials?.id) {
      fetchPullRequests()
    } else {
      setPullRequests([])
    }
  }, [credentials?.id, selectedSource.index, refreshTrigger])
  
  const handleViewPRDetails = (pr: PullRequest) => {
    setSelectedPR(pr)
    setDetailDialogOpen(true)
  }

  // If only one source, show it as read-only info
  if (sources.length === 1) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">{selectedSource.displayName}</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {selectedSource.repoURL}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {selectedSource.targetRevision}
              </Badge>
              {selectedSource.path && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Folder className="h-3 w-3" />
                  <span className="font-mono">{selectedSource.path}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Multiple sources - show as list rows
  return (
    <TooltipProvider>
      <Card className="border-primary/20">
        <CardContent className="pt-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 border-b">
              <GitBranch className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Git Sources</h3>
              <Badge variant="secondary" className="ml-1">{sources.length} repositories</Badge>
            </div>

            {/* Source List */}
            <div className="space-y-2">
              {sources.map((source) => {
                const isSelected = source.index === selectedIndex
                return (
                  <SourceItem 
                    key={source.index} 
                    source={source} 
                    isSelected={isSelected} 
                    onSelect={() => onSelectSource(source.index)}
                    prCount={isSelected ? pullRequests.length : undefined}
                    onTogglePRs={() => setShowPRs(!showPRs)}
                  />
                )
              })}
            </div>
            
            {/* Pull Requests Section - Only show when expanded */}
            {hasCredentials && pullRequests.length > 0 && showPRs && (
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Pull Requests</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchPullRequests}
                    disabled={loadingPRs}
                    className="h-7 w-7 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingPRs ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                
                {/* PR List */}
                <div className="space-y-2">
                  {pullRequests.map((pr) => (
                    <div
                      key={pr.id}
                      className="border rounded-lg p-2 hover:bg-muted/50 transition-colors text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <a
                            href={pr.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline flex items-center gap-1 truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate">#{pr.id}: {pr.title}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{pr.author.displayName}</span>
                            <span>•</span>
                            <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                            {pr.approvals !== undefined && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs h-4 px-1">
                                  {pr.approvals} approval{pr.approvals !== 1 ? 's' : ''}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewPRDetails(pr)
                          }}
                          className="h-6 px-2 text-xs flex-shrink-0"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* PR Detail Dialog */}
      <PRDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        pullRequest={selectedPR}
        credentialId={credentials?.id || null}
        onMerge={async () => {
          await fetchPullRequests()
          setDetailDialogOpen(false)
        }}
      />
    </TooltipProvider>
  )
}
