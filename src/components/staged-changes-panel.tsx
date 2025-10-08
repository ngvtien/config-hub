import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { X, FileText, GitPullRequest, Eye } from 'lucide-react'
import { useStagedChanges, type StagedFile } from '@/hooks/use-staged-changes'
import { useState } from 'react'
import { PullRequestDialog } from './pull-request-dialog'
import { DiffPreviewDialog } from './diff-preview-dialog'

interface StagedChangesPanelProps {
  repoUrl: string
  branch: string
  credentialId: string
  applicationName: string
  onPRCreated?: () => void
}

export function StagedChangesPanel({
  repoUrl,
  branch,
  credentialId,
  applicationName,
  onPRCreated
}: StagedChangesPanelProps) {
  const { getStagedForRepo, unstageFile, clearStaged } = useStagedChanges()
  const stagedFiles = getStagedForRepo(repoUrl)
  const [showPRDialog, setShowPRDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [viewingFile, setViewingFile] = useState<StagedFile | null>(null)

  console.log('StagedChangesPanel - repoUrl:', repoUrl, 'stagedFiles:', stagedFiles.length)

  if (stagedFiles.length === 0) {
    return null
  }

  const handleCreatePR = () => {
    setShowPRDialog(true)
  }

  const handlePRSuccess = () => {
    setShowPRDialog(false)
    clearStaged()
    onPRCreated?.()
  }

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h4 className="font-medium text-sm">Staged Changes</h4>
              <Badge variant="secondary" className="text-xs">
                {stagedFiles.length} file{stagedFiles.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleCreatePR}
                className="h-7 gap-1"
              >
                <GitPullRequest className="h-3.5 w-3.5" />
                Create PR
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 w-7 p-0"
              >
                {isExpanded ? '▼' : '▶'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {stagedFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between p-2 bg-background rounded border text-xs hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-mono truncate">{file.name}</span>
                    <span className="text-muted-foreground truncate">
                      {file.path.replace(file.name, '')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingFile(file)}
                      className="h-6 w-6 p-0"
                      title="View diff"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unstageFile(file.path)}
                      className="h-6 w-6 p-0"
                      title="Unstage file"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Multi-file PR Dialog */}
      <PullRequestDialog
        open={showPRDialog}
        onOpenChange={setShowPRDialog}
        filePath={stagedFiles[0]?.path || ''}
        fileName={`${stagedFiles.length} file${stagedFiles.length !== 1 ? 's' : ''}`}
        newContent={stagedFiles[0]?.content || ''}
        branch={branch}
        credentialId={credentialId}
        applicationName={applicationName}
        onSuccess={handlePRSuccess}
        stagedFiles={stagedFiles}
      />

      {/* Diff Preview for Staged File */}
      {viewingFile && (
        <DiffPreviewDialog
          open={!!viewingFile}
          onOpenChange={(open) => !open && setViewingFile(null)}
          fileName={viewingFile.name}
          filePath={viewingFile.path}
          branch={branch}
          originalContent={viewingFile.originalContent}
          modifiedContent={viewingFile.content}
        />
      )}
    </>
  )
}
