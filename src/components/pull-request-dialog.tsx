import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
} from 'lucide-react'

interface PullRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filePath: string
  fileName: string
  newContent: string
  branch: string
  credentialId: string
  applicationName: string
  onSuccess: () => void
}

export function PullRequestDialog({
  open,
  onOpenChange,
  filePath,
  fileName,
  newContent,
  branch,
  credentialId,
  applicationName,
  onSuccess,
}: PullRequestDialogProps) {
  const [step, setStep] = useState<'form' | 'creating' | 'success' | 'error'>('form')
  const [branchName, setBranchName] = useState('')
  const [prTitle, setPrTitle] = useState('')
  const [prDescription, setPrDescription] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [prUrl, setPrUrl] = useState<string | null>(null)
  const [prId, setPrId] = useState<number | null>(null)

  // Generate default values when dialog opens
  useEffect(() => {
    if (open) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const defaultBranch = `config-hub/${applicationName}/${timestamp}`
      const defaultTitle = `Update ${fileName} for ${applicationName}`
      const defaultCommit = `Update ${fileName}\n\nModified via Config Hub`
      const defaultDescription = `## Changes\n\nUpdated configuration file: \`${filePath}\`\n\n## Application\n\n${applicationName}\n\n## Modified by\n\nConfig Hub`

      setBranchName(defaultBranch)
      setPrTitle(defaultTitle)
      setCommitMessage(defaultCommit)
      setPrDescription(defaultDescription)
      setStep('form')
      setError(null)
      setPrUrl(null)
      setPrId(null)
    }
  }, [open, applicationName, fileName, filePath])

  const handleCreate = async () => {
    if (!window.electronAPI) return

    setStep('creating')
    setError(null)

    try {
      // Step 1: Create branch
      const branchResult = await window.electronAPI.git.createBranch(
        credentialId,
        branchName,
        branch
      )

      if (!branchResult.success) {
        throw new Error(branchResult.error || 'Failed to create branch')
      }

      // Step 2: Commit changes
      const commitResult = await window.electronAPI.git.commitChanges(
        credentialId,
        branchName,
        [{ path: filePath, content: newContent, action: 'modify' }],
        commitMessage
      )

      if (!commitResult.success) {
        throw new Error(commitResult.error || 'Failed to commit changes')
      }

      // Step 3: Create Pull Request
      const prResult = await window.electronAPI.git.createPullRequest(
        credentialId,
        prTitle,
        prDescription,
        branchName,
        branch
      )

      if (!prResult.success || !prResult.data) {
        throw new Error(prResult.error || 'Failed to create pull request')
      }

      // Success!
      setPrUrl(prResult.data.url)
      setPrId(prResult.data.id)
      setStep('success')

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setStep('error')
    }
  }

  const handleClose = () => {
    if (step === 'creating') return // Don't allow closing while creating
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Create Pull Request
          </DialogTitle>
          <DialogDescription>
            Create a pull request with your configuration changes
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            {/* File Info */}
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>File Changes</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  <div><strong>File:</strong> {filePath}</div>
                  <div><strong>Application:</strong> {applicationName}</div>
                  <div><strong>Target Branch:</strong> {branch}</div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Branch Name */}
            <div className="space-y-2">
              <Label htmlFor="branch-name" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Branch Name
              </Label>
              <Input
                id="branch-name"
                value={branchName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBranchName(e.target.value)}
                placeholder="config-hub/app-name/timestamp"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                A new branch will be created from {branch}
              </p>
            </div>

            {/* PR Title */}
            <div className="space-y-2">
              <Label htmlFor="pr-title">Pull Request Title</Label>
              <Input
                id="pr-title"
                value={prTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrTitle(e.target.value)}
                placeholder="Brief description of changes"
              />
            </div>

            {/* Commit Message */}
            <div className="space-y-2">
              <Label htmlFor="commit-message" className="flex items-center gap-2">
                <GitCommit className="h-4 w-4" />
                Commit Message
              </Label>
              <Textarea
                id="commit-message"
                value={commitMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommitMessage(e.target.value)}
                placeholder="Describe your changes"
                rows={3}
                className="font-mono text-sm"
              />
            </div>

            {/* PR Description */}
            <div className="space-y-2">
              <Label htmlFor="pr-description">Pull Request Description</Label>
              <Textarea
                id="pr-description"
                value={prDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrDescription(e.target.value)}
                placeholder="Detailed description for reviewers"
                rows={6}
              />
            </div>
          </div>
        )}

        {step === 'creating' && (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Creating Pull Request...</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    <span>Creating branch: {branchName}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <GitCommit className="h-4 w-4" />
                    <span>Committing changes</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <GitPullRequest className="h-4 w-4" />
                    <span>Creating pull request</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Pull Request Created!</h3>
                <p className="text-sm text-muted-foreground">
                  Your changes have been submitted for review
                </p>
              </div>
            </div>

            <Alert>
              <GitPullRequest className="h-4 w-4" />
              <AlertTitle>Pull Request Details</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge>#{prId}</Badge>
                    <span className="text-sm">{prTitle}</span>
                  </div>
                  {prUrl && (
                    <a
                      href={prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View in Bitbucket →
                    </a>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="text-sm text-muted-foreground text-center">
              <p>The pull request will be reviewed and merged by your team.</p>
              <p className="mt-1">Once merged, ArgoCD will automatically sync the changes.</p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Failed to Create Pull Request</h3>
                <p className="text-sm text-muted-foreground">
                  An error occurred while creating the pull request
                </p>
              </div>
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="font-mono text-xs">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {step === 'form' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!branchName || !prTitle || !commitMessage}
              >
                <GitPullRequest className="h-4 w-4 mr-2" />
                Create Pull Request
              </Button>
            </>
          )}

          {step === 'creating' && (
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </Button>
          )}

          {(step === 'success' || step === 'error') && (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
