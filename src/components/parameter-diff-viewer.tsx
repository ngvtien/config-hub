import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Minus, 
  Edit, 
  GitPullRequest,
  Copy,
  Check
} from 'lucide-react'

interface ParameterDiff {
  added: Record<string, any>
  modified: Record<string, { current: any; proposed: any }>
  removed: Record<string, any>
  unchanged: Record<string, any>
}

interface ParameterDiffViewerProps {
  diff: ParameterDiff
  applicationName: string
  onCreatePR?: (changes: ParameterDiff) => void
  onApplyChanges?: (changes: ParameterDiff) => void
}

export function ParameterDiffViewer({ 
  diff, 
  applicationName, 
  onCreatePR, 
  onApplyChanges 
}: ParameterDiffViewerProps) {
  const hasChanges = Object.keys(diff.added).length > 0 || 
                    Object.keys(diff.modified).length > 0 || 
                    Object.keys(diff.removed).length > 0

  const totalChanges = Object.keys(diff.added).length + 
                      Object.keys(diff.modified).length + 
                      Object.keys(diff.removed).length

  if (!hasChanges) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Check className="h-5 w-5 text-green-600" />
            <span>No parameter changes detected</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5" />
              Parameter Changes for {applicationName}
            </CardTitle>
            <Badge variant="outline">
              {totalChanges} change{totalChanges !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            {Object.keys(diff.added).length > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <Plus className="h-3 w-3" />
                <span>{Object.keys(diff.added).length} added</span>
              </div>
            )}
            {Object.keys(diff.modified).length > 0 && (
              <div className="flex items-center gap-1 text-blue-600">
                <Edit className="h-3 w-3" />
                <span>{Object.keys(diff.modified).length} modified</span>
              </div>
            )}
            {Object.keys(diff.removed).length > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <Minus className="h-3 w-3" />
                <span>{Object.keys(diff.removed).length} removed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Added Parameters */}
      {Object.keys(diff.added).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Plus className="h-4 w-4" />
              Added Parameters ({Object.keys(diff.added).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(diff.added).map(([key, value]) => (
              <div key={key} className="border border-green-200 bg-green-50 rounded p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-mono text-sm font-medium text-green-800">{key}</div>
                    <div className="font-mono text-sm text-green-700 mt-1 break-all">
                      + {String(value)}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-green-600">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Modified Parameters */}
      {Object.keys(diff.modified).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Edit className="h-4 w-4" />
              Modified Parameters ({Object.keys(diff.modified).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(diff.modified).map(([key, { current, proposed }]) => (
              <div key={key} className="border border-blue-200 bg-blue-50 rounded p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-mono text-sm font-medium text-blue-800">{key}</div>
                    <div className="mt-1 space-y-1">
                      <div className="font-mono text-sm text-red-700 bg-red-100 px-2 py-1 rounded">
                        - {String(current)}
                      </div>
                      <div className="font-mono text-sm text-green-700 bg-green-100 px-2 py-1 rounded">
                        + {String(proposed)}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Removed Parameters */}
      {Object.keys(diff.removed).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Minus className="h-4 w-4" />
              Removed Parameters ({Object.keys(diff.removed).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(diff.removed).map(([key, value]) => (
              <div key={key} className="border border-red-200 bg-red-50 rounded p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-mono text-sm font-medium text-red-800">{key}</div>
                    <div className="font-mono text-sm text-red-700 mt-1 break-all">
                      - {String(value)}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Unchanged Parameters (collapsed by default) */}
      {Object.keys(diff.unchanged).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-4 w-4" />
              Unchanged Parameters ({Object.keys(diff.unchanged).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Click to view unchanged parameters
              </summary>
              <div className="mt-3 space-y-2">
                {Object.entries(diff.unchanged).map(([key, value]) => (
                  <div key={key} className="border rounded p-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-sm font-medium">{key}</div>
                      <div className="font-mono text-sm text-muted-foreground break-all">
                        {String(value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button 
              onClick={() => onCreatePR?.(diff)}
              className="flex-1"
            >
              <GitPullRequest className="h-4 w-4 mr-2" />
              Create Pull Request
            </Button>
            <Button 
              variant="outline"
              onClick={() => onApplyChanges?.(diff)}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Creating a PR will initiate the GitOps workflow for parameter updates
          </p>
        </CardContent>
      </Card>
    </div>
  )
}