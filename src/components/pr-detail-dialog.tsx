import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  GitBranch,
  Calendar,
  AlertTriangle,
  ExternalLink,
  GitMerge,
  FileText,
  AlertCircle,
} from 'lucide-react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import type { PullRequest } from '@/types/git'

interface PRDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pullRequest: PullRequest | null
  credentialId: string | null
  onMerge?: (prId: number) => void
}

export function PRDetailDialog({
  open,
  onOpenChange,
  pullRequest,
  credentialId,
  onMerge,
}: PRDetailDialogProps) {
  const [conflicts, setConflicts] = useState<string[]>([])
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [fileDiffs, setFileDiffs] = useState<{ path: string; diff: string }[]>([])
  const [loadingDiff, setLoadingDiff] = useState(false)
  const [diffError, setDiffError] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)

  // Fetch PR diff when dialog opens
  useEffect(() => {
    const fetchDiff = async () => {
      if (!pullRequest || !credentialId || !window.electronAPI) {
        console.log('PRDetailDialog - Cannot fetch diff:', { 
          hasPR: !!pullRequest, 
          hasCredentialId: !!credentialId, 
          hasAPI: !!window.electronAPI 
        })
        return
      }

      console.log('PRDetailDialog - Fetching diff for PR:', pullRequest.id, 'with credential:', credentialId)
      setLoadingDiff(true)
      setDiffError(null)

      try {
        const result = await window.electronAPI.git.getPullRequestDiff(credentialId, pullRequest.id)
        console.log('PRDetailDialog - Diff result:', { 
          success: result.success, 
          fileCount: result.data?.length || 0,
          error: result.error 
        })

        if (result.success && result.data) {
          setFileDiffs(result.data)
        } else {
          setDiffError(result.error || 'Failed to load diff')
        }
      } catch (err) {
        console.error('PRDetailDialog - Diff fetch error:', err)
        setDiffError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoadingDiff(false)
      }
    }

    if (open && pullRequest) {
      fetchDiff()
      setConflicts([]) // Reset conflicts
    }
  }, [open, pullRequest, credentialId])

  if (!pullRequest) {
    return null
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'open':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'merged':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'declined':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'open':
        return <Badge variant="default">Open</Badge>
      case 'merged':
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
            Merged
          </Badge>
        )
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      default:
        return <Badge variant="outline">{state}</Badge>
    }
  }

  const canMerge = pullRequest.state === 'open' && pullRequest.approvals && pullRequest.approvals > 0

  // Check if current user has already approved (simplified - in production you'd check against actual user)
  const isApprovedByCurrentUser = pullRequest.reviewers?.some(r => r.approved) || false

  const handleApprove = async () => {
    if (!credentialId || !window.electronAPI) return

    setApproving(true)
    setApproveError(null)

    try {
      const result = await window.electronAPI.git.approvePullRequest(credentialId, pullRequest.id)
      
      if (result.success) {
        // Close dialog and let parent refresh the PR list
        onOpenChange(false)
      } else {
        setApproveError(result.error || 'Failed to approve pull request')
      }
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setApproving(false)
    }
  }

  const handleMerge = () => {
    if (onMerge && canMerge) {
      onMerge(pullRequest.id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {getStateIcon(pullRequest.state)}
                <DialogTitle className="text-xl">
                  #{pullRequest.id}: {pullRequest.title}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                {getStateBadge(pullRequest.state)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a
                href={pullRequest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                View in Git
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-6 pr-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Author</span>
                </div>
                <div className="font-medium">{pullRequest.author.displayName}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <div className="font-medium">
                  {new Date(pullRequest.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GitBranch className="h-4 w-4" />
                  <span>Branches</span>
                </div>
                <div className="font-medium font-mono text-xs">
                  {pullRequest.sourceBranch} → {pullRequest.targetBranch}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Updated</span>
                </div>
                <div className="font-medium">
                  {new Date(pullRequest.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            {pullRequest.description && (
              <>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </h3>
                  <div className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md">
                    {pullRequest.description}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Reviewers */}
            {pullRequest.reviewers && pullRequest.reviewers.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Reviewers
                    {pullRequest.approvals !== undefined && (
                      <Badge variant="outline" className="ml-2">
                        {pullRequest.approvals} {pullRequest.approvals === 1 ? 'approval' : 'approvals'}
                      </Badge>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {pullRequest.reviewers.map((reviewer, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{reviewer.displayName}</div>
                            {reviewer.email && (
                              <div className="text-xs text-muted-foreground">{reviewer.email}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {reviewer.approved ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                                Approved
                              </Badge>
                            </>
                          ) : reviewer.status === 'needs_work' ? (
                            <>
                              <XCircle className="h-4 w-4 text-orange-500" />
                              <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
                                Needs Work
                              </Badge>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 text-gray-400" />
                              <Badge variant="outline">Pending</Badge>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Merge Conflicts Warning */}
            {conflicts.length > 0 && (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Merge Conflicts Detected</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-2">
                      <p>This pull request has conflicts that must be resolved before merging:</p>
                      <ul className="list-disc list-inside space-y-1 font-mono text-xs">
                        {conflicts.map((file, idx) => (
                          <li key={idx}>{file}</li>
                        ))}
                      </ul>
                      <p className="mt-3">
                        To resolve conflicts, you can:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Pull the latest changes from {pullRequest.targetBranch}</li>
                        <li>Resolve conflicts locally in your Git client</li>
                        <li>Push the resolved changes to {pullRequest.sourceBranch}</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>
                <Separator />
              </>
            )}

            {/* Files Changed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Files Changed
                  {fileDiffs.length > 0 && (
                    <Badge variant="outline">{fileDiffs.length}</Badge>
                  )}
                </h3>
                {fileDiffs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDiff(!showDiff)}
                  >
                    {showDiff ? 'Hide' : 'Show'} Diff
                  </Button>
                )}
              </div>

              {loadingDiff && (
                <div className="text-sm text-muted-foreground">Loading changes...</div>
              )}

              {diffError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{diffError}</AlertDescription>
                </Alert>
              )}

              {!loadingDiff && !diffError && fileDiffs.length === 0 && (
                <div className="text-sm text-muted-foreground">No file changes found</div>
              )}

              {!loadingDiff && fileDiffs.length > 0 && (
                <div className="space-y-2">
                  {/* File list */}
                  <div className="space-y-1">
                    {fileDiffs.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 border rounded text-sm font-mono hover:bg-muted/50"
                      >
                        <FileText className="h-3 w-3" />
                        {file.path}
                      </div>
                    ))}
                  </div>

                  {/* Diff view */}
                  {showDiff && (
                    <div className="space-y-4 mt-4">
                      {fileDiffs.map((file, idx) => {
                        // Parse the diff to extract old and new content
                        const lines = file.diff.split('\n')
                        let oldContent = ''
                        let newContent = ''
                        
                        for (const line of lines) {
                          if (line.startsWith('---') || line.startsWith('+++') || 
                              line.startsWith('@@') || line.startsWith('diff')) {
                            continue // Skip diff headers
                          }
                          
                          if (line.startsWith('-')) {
                            oldContent += line.substring(1) + '\n'
                          } else if (line.startsWith('+')) {
                            newContent += line.substring(1) + '\n'
                          } else {
                            // Context line (no prefix)
                            oldContent += line + '\n'
                            newContent += line + '\n'
                          }
                        }
                        
                        return (
                          <div key={idx} className="border rounded-lg overflow-hidden">
                            <div className="bg-muted px-3 py-2 font-mono text-sm font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {file.path}
                            </div>
                            <div className="diff-viewer-wrapper">
                              <ReactDiffViewer
                                oldValue={oldContent}
                                newValue={newContent}
                                splitView={true}
                                compareMethod={DiffMethod.WORDS}
                                useDarkTheme={document.documentElement.classList.contains('dark')}
                                leftTitle="Before"
                                rightTitle="After"
                                showDiffOnly={false}
                                hideLineNumbers={false}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Separator />

            {/* Merge Status */}
            {pullRequest.state === 'open' && conflicts.length === 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <GitMerge className="h-4 w-4" />
                  Merge Status
                </h3>
                {canMerge ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Ready to Merge</AlertTitle>
                    <AlertDescription>
                      This pull request has been approved and can be merged.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Awaiting Approval</AlertTitle>
                    <AlertDescription>
                      This pull request requires approval before it can be merged.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Merged Status */}
            {pullRequest.state === 'merged' && pullRequest.mergeCommit && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Merged</AlertTitle>
                <AlertDescription>
                  This pull request was merged into {pullRequest.targetBranch}.
                  <div className="mt-2 font-mono text-xs">
                    Merge commit: {pullRequest.mergeCommit.substring(0, 8)}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Declined Status */}
            {pullRequest.state === 'declined' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Declined</AlertTitle>
                <AlertDescription>
                  This pull request was declined and will not be merged.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        {pullRequest.state === 'open' && (
          <div className="flex flex-col gap-3">
            {approveError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{approveError}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                {/* Check if current user has already approved */}
                {!isApprovedByCurrentUser && (
                  <Button 
                    variant="outline" 
                    onClick={handleApprove}
                    disabled={approving}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {approving ? 'Approving...' : 'Approve'}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                {canMerge && conflicts.length === 0 && onMerge && (
                  <Button onClick={handleMerge} className="gap-2">
                    <GitMerge className="h-4 w-4" />
                    Merge Pull Request
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
