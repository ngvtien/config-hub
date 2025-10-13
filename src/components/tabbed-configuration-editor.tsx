import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { ArgoCDApplication } from '@/types/argocd'
import type { GitSourceInfo } from '@/lib/git-source-utils'
import { useGitCredentials } from '@/hooks/use-git-credentials'
import { useStagedChanges } from '@/hooks/use-staged-changes'
import { GitSourcesHeader } from './git-sources-header'
import { FileBrowserPanel } from './file-browser-panel'
import { EditorPanel } from './editor-panel'

interface OpenFile {
  id: string
  name: string
  path: string
  content: string
  originalContent: string
  hasChanges: boolean
  sourceIndex: number
}

interface TabbedConfigurationEditorProps {
  application: ArgoCDApplication
  gitSources: GitSourceInfo[]
  selectedSourceIndex: number
  onSelectSource: (index: number) => void
  onPRCreated?: () => void
}

export function TabbedConfigurationEditor({
  application,
  gitSources,
  selectedSourceIndex,
  onSelectSource,
  onPRCreated
}: TabbedConfigurationEditorProps) {
  // State for open files and active tab
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  
  const { stageFile } = useStagedChanges()
  const currentSource = gitSources.find(s => s.index === selectedSourceIndex) || gitSources[0]
  const { credentials } = useGitCredentials(currentSource?.repoURL || '')

  const handleEditFile = async (fileName: string, filePath: string) => {
    if (!credentials?.id || !window.electronAPI || !currentSource) return

    try {
      // Check if file is already open
      const existingFile = openFiles.find(f => f.path === filePath)
      if (existingFile) {
        setActiveFileId(existingFile.id)
        return
      }

      // Fetch file content
      const result = await window.electronAPI.git.getFileContent(
        credentials.id,
        filePath,
        currentSource.targetRevision || 'main'
      )

      if (result.success && result.data) {
        const fileId = `${selectedSourceIndex}-${filePath}`
        const newFile: OpenFile = {
          id: fileId,
          name: fileName,
          path: filePath,
          content: result.data.content,
          originalContent: result.data.content,
          hasChanges: false,
          sourceIndex: selectedSourceIndex
        }

        setOpenFiles(prev => [...prev, newFile])
        setActiveFileId(fileId)
      } else {
        console.error('Failed to fetch file content:', result.error)
      }
    } catch (err) {
      console.error('Error fetching file:', err)
    }
  }

  const handleCloseFile = (fileId: string) => {
    setOpenFiles(prev => prev.filter(f => f.id !== fileId))
    
    // If closing active file, switch to another or clear
    if (fileId === activeFileId) {
      const remaining = openFiles.filter(f => f.id !== fileId)
      setActiveFileId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const handleContentChange = (fileId: string, content: string) => {
    setOpenFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, content, hasChanges: content !== file.originalContent }
        : file
    ))
  }

  const handleSaveFile = async (fileId: string, content: string) => {
    const file = openFiles.find(f => f.id === fileId)
    if (!file || !credentials?.id || !currentSource) return

    // Stage the file instead of immediately creating PR
    const stagedFile = {
      path: file.path,
      name: file.name,
      content,
      originalContent: file.originalContent,
      repoUrl: currentSource.repoURL,
      branch: currentSource.targetRevision || 'main',
      credentialId: credentials.id,
      stagedAt: Date.now()
    }
    
    stageFile(stagedFile)
    
    // Update file state to mark as saved
    setOpenFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, originalContent: content, hasChanges: false }
        : f
    ))
  }

  const handleRefresh = () => {
    // Refresh logic can be implemented here
    console.log('Refreshing...')
  }

  // Don't render if no Git sources
  if (!currentSource || !currentSource.isGitSource) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-1">No Git Sources Available</p>
          <p className="text-sm">
            This application doesn't have any Git-based sources that can be edited.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Git Sources Header */}
      <GitSourcesHeader
        gitSources={gitSources}
        selectedSourceIndex={selectedSourceIndex}
        onSelectSource={onSelectSource}
        onRefresh={handleRefresh}
      />

      {/* Main Editor Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* File Browser Panel - Left Side */}
        <div className="w-80 flex-shrink-0">
          <FileBrowserPanel
            source={currentSource}
            applicationName={application.metadata.name}
            onEditFile={handleEditFile}
            onPRCreated={onPRCreated}
          />
        </div>

        {/* Editor Panel - Right Side */}
        <div className="flex-1 min-w-0">
          <EditorPanel
            openFiles={openFiles}
            activeFileId={activeFileId}
            onCloseFile={handleCloseFile}
            onSaveFile={handleSaveFile}
            onContentChange={handleContentChange}
            onSetActiveFile={setActiveFileId}
            credentialId={credentials?.id}
            currentBranch={currentSource.targetRevision || 'main'}
          />
        </div>
      </div>
    </div>
  )
}