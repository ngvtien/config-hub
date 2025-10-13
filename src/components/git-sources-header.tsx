import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  GitBranch, 
  ChevronDown,
  ExternalLink,
  CheckCircle,
  Lock,
  Key
} from 'lucide-react'
import type { GitSourceInfo } from '@/lib/git-source-utils'
import { useGitCredentials } from '@/hooks/use-git-credentials'

interface GitSourcesHeaderProps {
  gitSources: GitSourceInfo[]
  selectedSourceIndex: number
  onSelectSource: (index: number) => void
  onRefresh?: () => void
}

export function GitSourcesHeader({
  gitSources,
  selectedSourceIndex,
  onSelectSource,
  onRefresh
}: GitSourcesHeaderProps) {
  const [showSourceSelector, setShowSourceSelector] = useState(false)
  
  if (gitSources.length === 0) {
    return null
  }

  const currentSource = gitSources.find(s => s.index === selectedSourceIndex) || gitSources[0]
  const { hasCredentials, loading: credentialsLoading } = useGitCredentials(currentSource.repoURL)

  return (
    <Card className="border-primary/20">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              <span className="font-semibold">Git Sources</span>
              {gitSources.length > 1 && (
                <Badge variant="secondary">{gitSources.length} sources</Badge>
              )}
            </div>
            
            {/* Multi-source selector */}
            {gitSources.length > 1 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSourceSelector(!showSourceSelector)}
                  className="gap-2"
                >
                  Source {selectedSourceIndex + 1}
                  <ChevronDown className="h-3 w-3" />
                </Button>
                
                {showSourceSelector && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-background border rounded-md shadow-lg z-50">
                    {gitSources.map((source, index) => (
                      <button
                        key={index}
                        className={`w-full px-3 py-2 text-left hover:bg-muted transition-colors ${
                          index === selectedSourceIndex ? 'bg-muted' : ''
                        }`}
                        onClick={() => {
                          onSelectSource(index)
                          setShowSourceSelector(false)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              Source {index + 1}: {new URL(source.repoURL).pathname.split('/').pop()}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {source.path || '/'}
                            </p>
                          </div>
                          {index === selectedSourceIndex && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={credentialsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${credentialsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Current source info */}
        <div className="mt-3 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Repository:</span>
            <a
              href={currentSource.repoURL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-primary hover:underline inline-flex items-center gap-1"
            >
              {new URL(currentSource.repoURL).host}{new URL(currentSource.repoURL).pathname}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          
          <div className="flex items-center gap-2">
            <GitBranch className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono">{currentSource.targetRevision || 'main'}</span>
          </div>
          
          {currentSource.path && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Path:</span>
              <span className="font-mono">{currentSource.path}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {hasCredentials ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Authenticated</span>
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 text-yellow-500" />
                <span className="text-yellow-600 dark:text-yellow-400">Auth Required</span>
                <Button variant="outline" size="sm" className="ml-2">
                  <Key className="h-3 w-3 mr-1" />
                  Setup
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}