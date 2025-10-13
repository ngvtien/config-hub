import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  RefreshCw, 
  AlertCircle, 
  FileText, 
  Loader2, 
  Lock, 
  Edit, 
  File, 
  Folder, 
  ChevronRight, 
  Home,
  Search,
  ArrowUp
} from 'lucide-react'
import type { GitSourceInfo } from '@/lib/git-source-utils'
import { useGitCredentials } from '@/hooks/use-git-credentials'
import { useGitFiles } from '@/hooks/use-git-files'
import { useStagedChanges } from '@/hooks/use-staged-changes'
import { StagedChangesPanel } from './staged-changes-panel'
import { getFilePriority, sortFilesByPriority } from '@/services/file-priority-service'

interface FileBrowserPanelProps {
  source: GitSourceInfo
  applicationName: string
  onEditFile: (fileName: string, filePath: string) => void
  onPRCreated?: () => void
}

export function FileBrowserPanel({
  source,
  applicationName,
  onEditFile,
  onPRCreated
}: FileBrowserPanelProps) {
  const [currentPath, setCurrentPath] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [browseFromRoot] = useState(false)
  
  const repoUrl = source.repoURL
  const basePath = source.path || ''
  const branch = source.targetRevision || 'main'
  
  // Staged changes
  const { getStagedForRepo } = useStagedChanges()
  const stagedCount = getStagedForRepo(repoUrl).length
  
  // Combine base path with current navigation path
  const effectiveBasePath = browseFromRoot ? '' : basePath
  const path = currentPath 
    ? (effectiveBasePath ? `${effectiveBasePath}/${currentPath}` : currentPath)
    : effectiveBasePath

  // Check Git credentials
  const {
    hasCredentials,
    credentials,
    loading: credentialsLoading,

    refresh: refreshCredentials
  } = useGitCredentials(repoUrl)

  // Memoize the options to prevent unnecessary re-renders
  const gitFilesOptions = useMemo(() => ({
    autoFetch: hasCredentials,
    filterExtensions: []
  }), [hasCredentials])

  // Fetch files using the hook
  const {
    files,
    loading: filesLoading,
    error: filesError,
    refresh: refreshFiles
  } = useGitFiles(credentials?.id || null, path, branch, gitFilesOptions)

  const handleRetry = async () => {
    refreshCredentials()
    if (hasCredentials) {
      refreshFiles()
    }
  }

  const handleNavigateToDirectory = (dirPath: string) => {
    const isFullPath = dirPath.includes('/')
    let relativePath: string
    
    if (isFullPath) {
      if (effectiveBasePath && dirPath.startsWith(effectiveBasePath + '/')) {
        relativePath = dirPath.substring(effectiveBasePath.length + 1)
      } else if (effectiveBasePath === dirPath) {
        relativePath = ''
      } else {
        relativePath = dirPath
      }
    } else {
      relativePath = currentPath ? `${currentPath}/${dirPath}` : dirPath
    }
    
    setCurrentPath(relativePath)
  }

  const handleNavigateUp = () => {
    const pathParts = currentPath.split('/').filter(p => p)
    pathParts.pop()
    setCurrentPath(pathParts.join('/'))
  }

  const handleNavigateToRoot = () => {
    setCurrentPath('')
  }

  const handleEditFileClick = (fileName: string) => {
    const fullPath = currentPath 
      ? `${basePath}/${currentPath}/${fileName}`
      : basePath 
        ? `${basePath}/${fileName}`
        : fileName
    
    onEditFile(fileName, fullPath)
  }

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files
    
    return files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [files, searchQuery])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Configuration Files</CardTitle>
            {stagedCount > 0 && (
              <Badge variant="default" className="gap-1">
                <FileText className="h-3 w-3" />
                {stagedCount} staged
              </Badge>
            )}
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

        {/* Path breadcrumb */}
        <div className="flex items-center gap-1 flex-wrap">
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto space-y-4">
        {/* Staged Changes Panel */}
        {credentials?.id && (
          <StagedChangesPanel
            repoUrl={repoUrl}
            branch={branch}
            credentialId={credentials.id}
            applicationName={applicationName}
            onPRCreated={onPRCreated}
          />
        )}

        {/* Authentication Required */}
        {!credentialsLoading && !hasCredentials && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <p className="font-medium mb-1">Git Authentication Required</p>
                  <p className="text-sm text-muted-foreground">
                    Configure your Git credentials to browse and edit files.
                  </p>
                </div>
                <Button size="sm" variant="default">
                  Configure Authentication
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* File List */}
        {!credentialsLoading && hasCredentials && (
          <>
            {filesLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading files...</span>
              </div>
            )}

            {filesError && !filesLoading && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{filesError}</p>
                    <Button variant="outline" size="sm" onClick={handleRetry}>
                      Retry
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!filesLoading && !filesError && filteredFiles.length > 0 && (() => {
              const directories = filteredFiles.filter(f => f.type === 'directory')
              const filesList = filteredFiles.filter(f => f.type === 'file')
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
                      <ArrowUp className="h-4 w-4 mr-2" />
                      .. (Go up)
                    </Button>
                  )}
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    {directories.length} folder{directories.length !== 1 ? 's' : ''}, {filesList.length} file{filesList.length !== 1 ? 's' : ''}
                  </div>
                  
                  {/* Directories */}
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
                  
                  {/* Files */}
                  {sortedFiles.map((file) => {
                    const importance = getFilePriority(file.name)
                    const isPrimary = importance.priority === 'primary'
                    
                    return (
                      <div
                        key={file.path}
                        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                          isPrimary ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900' : ''
                        }`}
                        onClick={() => handleEditFileClick(file.name)}
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

            {!filesLoading && !filesError && filteredFiles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchQuery ? 'No files match your search' : 'No files or folders found'}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  } catch {
    return dateString
  }
}