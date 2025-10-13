import { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  GitBranch as GitBranchIcon, 
  Plus, 
  Minus, 
  GitPullRequest,
  Info,
  RotateCcw
} from 'lucide-react'
import { CodeMirrorDiffViewer, calculateDiffStats } from './codemirror-diff-viewer'

interface CodeMirrorDiffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  filePath: string
  branch: string
  originalContent: string
  modifiedContent: string
  language?: string
  onCreatePullRequest?: () => void
  onRevert?: () => void
}

export function CodeMirrorDiffDialog({
  open,
  onOpenChange,
  fileName,
  filePath,
  branch,
  originalContent,
  modifiedContent,
  language = 'yaml',
  onCreatePullRequest,
  onRevert,
}: CodeMirrorDiffDialogProps) {
  // Calculate diff statistics
  const diffStats = useMemo(() => 
    calculateDiffStats(originalContent, modifiedContent), 
    [originalContent, modifiedContent]
  )

  // Detect theme for diff viewer
  const isDarkMode = document.documentElement.classList.contains('dark')

  const hasChanges = diffStats.total > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] max-w-[1400px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Changes Preview: {fileName}
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">{filePath}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <GitBranchIcon className="h-3 w-3" />
              <span className="font-mono">{branch}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Diff Statistics */}
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 border rounded-md">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Changes:</span>
          </div>
          
          {diffStats.additions > 0 && (
            <Badge variant="outline" className="gap-1 bg-green-50 dark:bg-green-950 border-green-600 text-green-600">
              <Plus className="h-3 w-3" />
              {diffStats.additions} {diffStats.additions === 1 ? 'addition' : 'additions'}
            </Badge>
          )}
          
          {diffStats.deletions > 0 && (
            <Badge variant="outline" className="gap-1 bg-red-50 dark:bg-red-950 border-red-600 text-red-600">
              <Minus className="h-3 w-3" />
              {diffStats.deletions} {diffStats.deletions === 1 ? 'deletion' : 'deletions'}
            </Badge>
          )}
          
          {diffStats.changes > 0 && (
            <Badge variant="outline" className="gap-1 bg-blue-50 dark:bg-blue-950 border-blue-600 text-blue-600">
              {diffStats.changes} {diffStats.changes === 1 ? 'change' : 'changes'}
            </Badge>
          )}
          
          {!hasChanges && (
            <span className="text-sm text-muted-foreground">No changes detected</span>
          )}
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Review the changes below. Lines with green background are additions, red background are deletions.
            {onCreatePullRequest && ' Click "Stage Changes" to add this file to your staged changes.'}
          </AlertDescription>
        </Alert>

        {/* CodeMirror Diff Viewer */}
        <div className="flex-1 overflow-hidden">
          <CodeMirrorDiffViewer
            originalContent={originalContent}
            modifiedContent={modifiedContent}
            language={language}
            theme={isDarkMode ? 'dark' : 'light'}
            className="h-full"
            orientation="horizontal"
            readOnly={true}
          />
        </div>

        <Separator />

        {/* Footer with Action Buttons */}
        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              <span>
                Total: {diffStats.total} line{diffStats.total !== 1 ? 's' : ''} changed
              </span>
            </div>
            <div className="flex gap-2">
              {onRevert && hasChanges && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onRevert()
                    onOpenChange(false)
                  }}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Revert Changes
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {onCreatePullRequest && (
                <Button
                  onClick={() => {
                    onCreatePullRequest()
                    onOpenChange(false)
                  }}
                  disabled={!hasChanges}
                >
                  <GitPullRequest className="mr-2 h-4 w-4" />
                  Stage Changes
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}