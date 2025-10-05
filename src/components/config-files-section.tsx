import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertCircle, FileText, Loader2, Lock, Edit, File } from 'lucide-react'
import { ArgoCDApplication, getApplicationSource } from '@/types/argocd'
import { useGitCredentials } from '@/hooks/use-git-credentials'
import { useGitFiles } from '@/hooks/use-git-files'
import { GitAuthDialog, GitCredentials } from './git-auth-dialog'

interface ConfigFilesSectionProps {
  application: ArgoCDApplication
}

export function ConfigFilesSection({ application }: ConfigFilesSectionProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  // Extract Git source information from the ArgoCD application
  const source = getApplicationSource(application)
  const repoUrl = source.repoURL
  const path = source.path || ''
  const branch = source.targetRevision || 'main'

  // Check if this is a Git-based application
  const isGitSource = repoUrl && !repoUrl.includes('oci://') && !source.chart

  // Check Git credentials using the hook (following ArgoCD pattern)
  const {
    hasCredentials,
    credentials,
    loading: credentialsLoading,
    error: credentialsError,
    storeCredentials,
    refresh: refreshCredentials
  } = useGitCredentials(repoUrl)

  // Fetch files using the hook - only fetch YAML and JSON files
  const {
    files: rawFiles,
    loading: filesLoading,
    error: filesError,
    refresh: refreshFiles
  } = useGitFiles(credentials?.id || null, path, branch, {
    autoFetch: hasCredentials,
    filterExtensions: ['.yaml', '.yml', '.json']
  })

  // Apply path restriction - only show files within the app's configured path
  const files = rawFiles.filter((file) => {
    // Ensure file path starts with the app's path
    const normalizedFilePath = file.path.startsWith('/') ? file.path : `/${file.path}`
    const normalizedAppPath = path.startsWith('/') ? path : `/${path}`
    
    // File must be within the app's path
    return normalizedFilePath.startsWith(normalizedAppPath)
  })

  const handleRetry = async () => {
    // Refresh both credentials and files
    refreshCredentials()
    if (hasCredentials) {
      refreshFiles()
    }
  }

  const handleAuthenticateClick = () => {
    setShowAuthDialog(true)
  }

  const handleAuthenticate = async (credentials: GitCredentials) => {
    try {
      // Store credentials using the hook
      const credentialId = await storeCredentials({
        name: `${repoUrl} - ${credentials.username}`,
        username: credentials.username,
        token: credentials.token
      })

      if (credentialId) {
        // Refresh credentials state
        refreshCredentials()
      }
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to authenticate:', err)
    }
  }

  const handleEditFile = (filePath: string) => {
    // TODO: Open file editor dialog (will be implemented in task 10)
    console.log('Edit file:', filePath)
  }

  // Don't render if not a Git source
  if (!isGitSource) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configuration Files
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={credentialsLoading || filesLoading}
          >
            {(credentialsLoading || filesLoading) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Repository Information */}
        <div className="space-y-3 mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Repository:</span>
            <p className="font-mono text-xs mt-1 break-all">{repoUrl}</p>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Path:</span>
            <p className="font-mono text-xs mt-1">{path || '/'}</p>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Branch:</span>
            <p className="font-mono text-xs mt-1">{branch}</p>
          </div>
        </div>

        {/* Credentials Loading State */}
        {credentialsLoading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Checking authentication...</span>
          </div>
        )}

        {/* Authentication Required Prompt */}
        {!credentialsLoading && !hasCredentials && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <p className="font-medium mb-1">Git Authentication Required</p>
                  <p className="text-sm text-muted-foreground">
                    To view and edit configuration files, please authenticate with your Git credentials.
                    Your credentials will be securely stored and used for all Git operations with proper user attribution.
                  </p>
                </div>
                <Button onClick={handleAuthenticateClick} size="sm">
                  Authenticate with Git
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Credentials Error */}
        {!credentialsLoading && credentialsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{credentialsError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCredentials}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* File List Section - Only show when authenticated */}
        {!credentialsLoading && hasCredentials && (
          <>
            {/* Loading State */}
            {filesLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading configuration files...</span>
              </div>
            )}

            {/* Error State */}
            {filesError && !filesLoading && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{filesError}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="ml-2"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Path Restriction Warning */}
            {!filesLoading && !filesError && rawFiles.length > files.length && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Path Restriction Active</p>
                  <p className="text-sm">
                    {rawFiles.length - files.length} file{rawFiles.length - files.length !== 1 ? 's' : ''} hidden due to path restrictions.
                    Only files within <span className="font-mono">{path || '/'}</span> are displayed.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* File List */}
            {!filesLoading && !filesError && files.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-3">
                  Found {files.length} configuration file{files.length !== 1 ? 's' : ''}
                </div>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.path}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="font-mono">{file.path}</span>
                            {file.size && (
                              <span>{formatFileSize(file.size)}</span>
                            )}
                            {file.lastModified && (
                              <span>{formatDate(file.lastModified)}</span>
                            )}
                            {file.author && (
                              <span>by {file.author}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!hasCredentials}
                        onClick={() => handleEditFile(file.path)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!filesLoading && !filesError && files.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No YAML or JSON files found</p>
                <p className="text-xs mt-1">
                  Only .yaml, .yml, and .json files are displayed
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Git Authentication Dialog */}
      <GitAuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        repositoryUrl={repoUrl || ''}
        onAuthenticate={handleAuthenticate}
      />
    </Card>
  )
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Helper function to format date
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString()
  } catch {
    return dateString
  }
}
