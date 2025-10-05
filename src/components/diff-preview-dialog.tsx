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
  Info
} from 'lucide-react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'

interface DiffPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  filePath: string
  branch: string
  originalContent: string
  modifiedContent: string
  onCreatePullRequest?: () => void
}

interface DiffStats {
  additions: number
  deletions: number
  changes: number
}

export function DiffPreviewDialog({
  open,
  onOpenChange,
  fileName,
  filePath,
  branch,
  originalContent,
  modifiedContent,
  onCreatePullRequest,
}: DiffPreviewDialogProps) {
  // Calculate diff statistics
  const diffStats = useMemo((): DiffStats => {
    const originalLines = originalContent.split('\n')
    const modifiedLines = modifiedContent.split('\n')
    
    let additions = 0
    let deletions = 0
    
    // Simple line-by-line comparison
    const maxLines = Math.max(originalLines.length, modifiedLines.length)
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || ''
      const modifiedLine = modifiedLines[i] || ''
      
      if (i >= originalLines.length) {
        additions++
      } else if (i >= modifiedLines.length) {
        deletions++
      } else if (originalLine !== modifiedLine) {
        // Count as both addition and deletion for changed lines
        if (originalLine.trim() !== '') deletions++
        if (modifiedLine.trim() !== '') additions++
      }
    }
    
    const changes = Math.min(additions, deletions)
    
    return {
      additions: additions - changes,
      deletions: deletions - changes,
      changes,
    }
  }, [originalContent, modifiedContent])

  // Detect theme for diff viewer
  const isDarkMode = document.documentElement.classList.contains('dark')

  const diffViewerStyles = {
    variables: {
      light: {
        diffViewerBackground: '#ffffff',
        diffViewerColor: '#212121',
        addedBackground: '#e6ffed',
        addedColor: '#24292e',
        removedBackground: '#ffeef0',
        removedColor: '#24292e',
        wordAddedBackground: '#acf2bd',
        wordRemovedBackground: '#fdb8c0',
        addedGutterBackground: '#cdffd8',
        removedGutterBackground: '#ffdce0',
        gutterBackground: '#f6f8fa',
        gutterBackgroundDark: '#f0f0f0',
        highlightBackground: '#fffbdd',
        highlightGutterBackground: '#fff5b1',
      },
      dark: {
        diffViewerBackground: '#1a1a1a',
        diffViewerColor: '#e1e1e1',
        addedBackground: '#044B53',
        addedColor: '#e1e1e1',
        removedBackground: '#632F34',
        removedColor: '#e1e1e1',
        wordAddedBackground: '#055d67',
        wordRemovedBackground: '#7d383f',
        addedGutterBackground: '#034148',
        removedGutterBackground: '#632b30',
        gutterBackground: '#262626',
        gutterBackgroundDark: '#1e1e1e',
        highlightBackground: '#3d3d00',
        highlightGutterBackground: '#4d4d00',
      },
    },
  }

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
          
          {diffStats.additions === 0 && diffStats.deletions === 0 && (
            <span className="text-sm text-muted-foreground">No changes detected</span>
          )}
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Review the changes below. Green lines are additions, red lines are deletions.
            {onCreatePullRequest && ' Click "Create Pull Request" to submit these changes for review.'}
          </AlertDescription>
        </Alert>

        {/* Diff Viewer */}
        <div className="flex-1 overflow-auto border rounded-md">
          <ReactDiffViewer
            oldValue={originalContent}
            newValue={modifiedContent}
            splitView={true}
            compareMethod={DiffMethod.WORDS}
            useDarkTheme={isDarkMode}
            styles={diffViewerStyles}
            leftTitle="Original"
            rightTitle="Modified"
            showDiffOnly={false}
            hideLineNumbers={false}
          />
        </div>

        <Separator />

        {/* Footer with Action Buttons */}
        <DialogFooter className="flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              <span>
                Total: {diffStats.additions + diffStats.deletions + diffStats.changes} line{diffStats.additions + diffStats.deletions + diffStats.changes !== 1 ? 's' : ''} changed
              </span>
            </div>
            <div className="flex gap-2">
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
                  disabled={diffStats.additions === 0 && diffStats.deletions === 0}
                >
                  <GitPullRequest className="mr-2 h-4 w-4" />
                  Create Pull Request
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
