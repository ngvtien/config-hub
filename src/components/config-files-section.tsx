import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertCircle, FileText, Loader2, Lock, Edit, File, Folder, ChevronRight, Home } from 'lucide-react'
import { ArgoCDApplication, getApplicationSource } from '@/types/argocd'
import type { GitSourceInfo } from '@/lib/git-source-utils'
import { useGitCredentials } from '@/hooks/use-git-credentials'
import { useGitFiles } from '@/hooks/use-git-files'
import { GitAuthDialog, GitCredentials } from './git-auth-dialog'
import { FileEditorDialog } from './file-editor-dialog'
import { PullRequestDialog } from './pull-request-dialog'
import { getFilePriority, sortFilesByPriority } from '@/services/file-priority-service'

interface ConfigFilesSectionProps {
  application: ArgoCDApplication
  selectedSource?: GitSourceInfo | null
  onPRCreated?: () => void
}

export function ConfigFilesSection({ application, selectedSource, onPRCreated }: ConfigFilesSectionProps) {
  // Use selected source if provided, otherwise fall back to legacy behavior
  const legacySource = getApplicationSource(application)
  const source = selectedSource || legacySource
  const repoUrl = source.repoURL
  const basePath = source.path || ''
  const branch = source.targetRevision || 'main'
  
  // Debug logging
  console.log('ConfigFilesSection source:', {
    repoUrl,
    basePath,
    branch,
    selectedSource: selectedSource ? 'yes' : 'no'
  })
  
  // State - will be reset when component remounts (via key prop in parent)
  const [currentPath, setCurrentPath] = useState<string>('')
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string; originalContent: string } | null>(null)
  const [showEditorDialog, setShowEditorDialog] = useState(false)
  const [showPRDialog, setShowPRDialog] = useState(false)
  const [browseFromRoot, setBrowseFromRoot] = useState(false)
  
  // Combine base path with current navigation path
  // Allow browsing from root if user explicitly requested it
  const effectiveBasePath = browseFromRoot ? '' : basePath
  const path = currentPath 
    ? (effectiveBasePath ? `${effectiveBasePath}/${currentPath}` : currentPath)
    : effectiveBasePath

  // Check if this is a Git-based application
  // For GitSourceInfo, isGitSource is already true, for legacy source check chart
  const isGitSource = selectedSource 
    ? selectedSource.isGitSource 
    : (repoUrl && !repoUrl.includes('oci://') && !('chart' in legacySource && legacySource.chart))

  // Check Git credentials using the hook (following ArgoCD pattern)
  const {
    hasCredentials,
    credentials,
    loading: credentialsLoading,
    error: credentialsError,
    storeCredentials,
    refresh: refreshCredentials
  } = useGitCredentials(repoUrl)



  // Memoize the options to prevent unnecessary re-renders
  const gitFilesOptions = useMemo(() => ({
    autoFetch: hasCredentials,
    filterExtensions: [] // Show all files and directories
  }), [hasCredentials])

  // Fetch files using the hook
  const {
    files,
    loading: filesLoading,
    error: filesError,
    refresh: refreshFiles
  } = useGitFiles(credentials?.id || null, path, branch, gitFilesOptions)

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

  const handleEditFile = async (fileName: string) => {
    if (!credentials?.id || !window.electronAPI) return

    try {
      // Construct full file path: basePath/currentPath/fileName
      const fullPath = currentPath 
        ? `${basePath}/${currentPath}/${fileName}`
        : basePath 
          ? `${basePath}/${fileName}`
          : fileName

      // Fetch file content
      const result = await window.electronAPI.git.getFileContent(
        credentials.id,
        fullPath,
        branch
      )

      if (result.success && result.data) {
        setEditingFile({
          path: fullPath,
          name: fileName,
          content: result.data.content,
          originalContent: result.data.content
        })
        setShowEditorDialog(true)
      } else {
        console.error('Failed to fetch file content:', result.error)
      }
    } catch (err) {
      console.error('Error fetching file:', err)
    }
  }

  const handleSaveFile = async (content: string) => {
    if (!editingFile) return

    // Update the editing file with new content and open PR dialog
    setEditingFile({
      ...editingFile,
      content
    })
    setShowEditorDialog(false)
    setShowPRDialog(true)
  }

  const handlePRSuccess = () => {
    // Close PR dialog and refresh file list
    setShowPRDialog(false)
    setEditingFile(null)
    refreshFiles()
    
    // Notify parent to refresh PR list
    if (onPRCreated) {
      onPRCreated()
    }
  }

  const handleNavigateToDirectory = (dirPath: string) => {
    // dirPath can be either:
    // 1. Full path from root (e.g., "customers/customer-01") - for top-level dirs
    // 2. Relative path (e.g., "product-a") - for nested dirs
    
    // Check if this is a full path (contains slashes)
    const isFullPath = dirPath.includes('/')
    
    let relativePath: string
    
    if (isFullPath) {
      // It's a full path, make it relative to effectiveBasePath
      if (effectiveBasePath && dirPath.startsWith(effectiveBasePath + '/')) {
        relativePath = dirPath.substring(effectiveBasePath.length + 1)
      } else if (effectiveBasePath === dirPath) {
        relativePath = ''
      } else {
        relativePath = dirPath
      }
    } else {
      // It's a relative path, append to current path
      relativePath = currentPath ? `${currentPath}/${dirPath}` : dirPath
    }
    
    setCurrentPath(relativePath)
  }

  const handleNavigateUp = () => {
    // Navigate up one level
    const pathParts = currentPath.split('/').filter(p => p)
    pathParts.pop()
    setCurrentPath(pathParts.join('/'))
  }

  const handleNavigateToRoot = () => {
    // Navigate back to base path
    setCurrentPath('')
  }

  // Don't render if not a Git source
  if (!isGitSource) {
    return null
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Configuration Files</h3>
            {/* Path breadcrumb as badges */}
            <div className="flex items-center gap-1">
              <Badge 
                variant="outline" 
                className="text-xs font-mono cursor-pointer hover:bg-muted"
                onClick={handleNavigateToRoot}
              >
                <Home className="h-3 w-3 mr-1" />
                {effectiveBasePath || '/'}
              </Badge>
              {browseFromRoot && basePath && (
                <Badge variant="secondary" className="text-xs">
                  from root
                </Badge>
              )}
              {currentPath.split('/').filter(p => p).map((part, index) => (
                <div key={index} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Badge 
                    variant="outline" 
                    className="text-xs font-mono cursor-pointer hover:bg-muted"
                    onClick={() => {
                      const pathParts = currentPath.split('/').filter(p => p).slice(0, index + 1)
                      setCurrentPath(pathParts.join('/'))
                    }}
                  >
                    {part}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
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
                    No credentials found for this Git server. Please configure your Git credentials in Settings.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Server: <span className="font-mono">{new URL(repoUrl).protocol}//{new URL(repoUrl).host}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => window.location.hash = '#/settings'} size="sm" variant="default">
                    Go to Settings
                  </Button>
                  <Button onClick={handleAuthenticateClick} size="sm" variant="outline">
                    Quick Setup
                  </Button>
                </div>
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
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{filesError}</p>
                    {filesError.includes('Resource not found') && basePath && (
                      <div className="text-sm">
                        <p>The path <code className="bg-destructive/10 px-1 rounded">{basePath}</code> does not exist in this repository.</p>
                        <p className="mt-1">This may be a ref-only source or the path may be incorrect.</p>
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                      >
                        Retry
                      </Button>
                      {basePath && !browseFromRoot && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBrowseFromRoot(true)
                            setCurrentPath('')
                          }}
                        >
                          Browse from Root
                        </Button>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}



            {/* File List */}
            {!filesLoading && !filesError && files.length > 0 && (() => {
              const directories = files.filter(f => f.type === 'directory')
              const filesList = files.filter(f => f.type === 'file')
              const sortedFiles = sortFilesByPriority(filesList)
              
              return (
                <div className="space-y-2">
                  {/* Up Navigation */}
                  {currentPath && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start mb-2"
                      onClick={handleNavigateUp}
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      .. (Go up)
                    </Button>
                  )}
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    {directories.length} folder{directories.length !== 1 ? 's' : ''}, {filesList.length} file{filesList.length !== 1 ? 's' : ''}
                  </div>
                  
                  {/* Directories first */}
                  {directories.map((dir) => (
                    <div
                      key={dir.path}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleNavigateToDirectory(dir.path)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{dir.name}</p>
                          <p className="text-xs text-muted-foreground">Directory</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                  
                  {/* Files - sorted by priority but all visible */}
                  {sortedFiles.map((file) => {
                    const importance = getFilePriority(file.name)
                    const isPrimary = importance.priority === 'primary'
                    
                    return (
                      <div
                        key={file.path}
                        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                          isPrimary ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900' : ''
                        }`}
                        onClick={() => hasCredentials && handleEditFile(file.name)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isPrimary ? (
                            <span className="text-lg flex-shrink-0">{importance.icon}</span>
                          ) : (
                            <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              {isPrimary && (
                                <Badge variant="secondary" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              {file.size && <span>{formatFileSize(file.size)}</span>}
                              {file.lastModified && <span>• {formatDate(file.lastModified)}</span>}
                              {file.author && <span>• by {file.author}</span>}
                            </div>
                          </div>
                        </div>
                        <Edit className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Empty State */}
            {!filesLoading && !filesError && files.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No files or folders found</p>
                <p className="text-xs mt-1">
                  This directory appears to be empty
                </p>
                {currentPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleNavigateUp}
                  >
                    Go back
                  </Button>
                )}
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

      {/* File Editor Dialog */}
      {editingFile && (
        <FileEditorDialog
          open={showEditorDialog}
          onOpenChange={setShowEditorDialog}
          filePath={editingFile.path}
          fileName={editingFile.name}
          branch={branch}
          initialContent={editingFile.originalContent}
          onSave={handleSaveFile}
          credentialId={credentials?.id}
        />
      )}

      {/* Pull Request Dialog */}
      {editingFile && credentials?.id && (
        <PullRequestDialog
          open={showPRDialog}
          onOpenChange={setShowPRDialog}
          filePath={editingFile.path}
          fileName={editingFile.name}
          newContent={editingFile.content}
          branch={branch}
          credentialId={credentials.id}
          applicationName={application.metadata.name}
          onSuccess={handlePRSuccess}
        />
      )}
    </>
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


