import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GitBranch, Folder, Check } from 'lucide-react'
import type { GitSourceInfo } from '@/lib/git-source-utils'
import { cn } from '@/lib/utils'

interface GitSourceSelectorProps {
  sources: GitSourceInfo[]
  selectedIndex: number
  onSelectSource: (index: number) => void
}

export function GitSourceSelector({
  sources,
  selectedIndex,
  onSelectSource,
}: GitSourceSelectorProps) {
  if (sources.length === 0) {
    return null
  }

  const selectedSource = sources.find(s => s.index === selectedIndex) || sources[0]

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
            <div className="flex items-center gap-2 pb-2 border-b">
              <GitBranch className="h-5 w-5 text-primary" />
              <span className="font-medium">Git Sources</span>
              <Badge variant="secondary">{sources.length} repositories</Badge>
            </div>

            {/* Source List */}
            <div className="space-y-2">
              {sources.map((source) => {
                const isSelected = source.index === selectedIndex
                return (
                  <div
                    key={source.index}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                    onClick={() => onSelectSource(source.index)}
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
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
