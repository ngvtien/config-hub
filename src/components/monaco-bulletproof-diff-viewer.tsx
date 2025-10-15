import { FileText } from 'lucide-react'
import { DiffEditor } from '@monaco-editor/react'

interface FileDiff {
  path: string
  diff: string
}

interface MonacoBulletproofDiffViewerProps {
  fileDiffs: FileDiff[]
  theme?: 'light' | 'dark'
}

// Helper to detect language from file path
const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'yaml':
    case 'yml':
      return 'yaml'
    case 'json':
      return 'json'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'md':
    case 'markdown':
      return 'markdown'
    case 'tf':
    case 'hcl':
      return 'hcl'
    case 'sh':
      return 'shell'
    default:
      return 'plaintext'
  }
}

export function MonacoBulletproofDiffViewer({ fileDiffs, theme = 'light' }: MonacoBulletproofDiffViewerProps) {
  
  // BULLETPROOF APPROACH: Handle any possible backend format
  const processFileDiffs = (rawFileDiffs: FileDiff[]): Array<{path: string, oldContent: string, newContent: string}> => {
    const processedFiles: Array<{path: string, oldContent: string, newContent: string}> = []
    
    for (let i = 0; i < rawFileDiffs.length; i++) {
      const file = rawFileDiffs[i]
      
      // Check if this file contains multiple diffs (combined diff bug)
      const diffHeaders = (file.diff.match(/diff --git/g) || []).length
      
      if (diffHeaders > 1) {
        // SPLIT COMBINED DIFFS
        console.warn(`File ${file.path} contains ${diffHeaders} diffs - splitting...`)
        const splitDiffs = file.diff.split(/(?=diff --git)/)
        
        for (const splitDiff of splitDiffs) {
          if (!splitDiff.trim()) continue
          
          const pathMatch = splitDiff.match(/diff --git a\/(.*?) b\//)
          const actualPath = pathMatch ? pathMatch[1] : file.path
          
          const { oldContent, newContent } = parseDiff(splitDiff)
          processedFiles.push({ path: actualPath, oldContent, newContent })
        }
      } else {
        // SINGLE DIFF - normal case
        const { oldContent, newContent } = parseDiff(file.diff)
        processedFiles.push({ path: file.path, oldContent, newContent })
      }
    }
    
    return processedFiles
  }
  
  // Parse a single unified diff into old and new content
  const parseDiff = (diff: string): { oldContent: string, newContent: string } => {
    if (!diff || diff.trim() === '') {
      return { oldContent: '', newContent: '' }
    }
    
    const lines = diff.split('\n')
    const oldLines: string[] = []
    const newLines: string[] = []
    
    let inHunk = false
    
    for (const line of lines) {
      // Skip metadata headers
      if (line.startsWith('diff --git') || 
          line.startsWith('index ') || 
          line.startsWith('---') || 
          line.startsWith('+++') ||
          line.startsWith('new file mode') ||
          line.startsWith('deleted file mode')) {
        continue
      }
      
      // Hunk header
      if (line.startsWith('@@')) {
        inHunk = true
        // Add hunk header to both sides for context
        oldLines.push(line)
        newLines.push(line)
        continue
      }
      
      if (!inHunk) continue
      
      // Process hunk content
      if (line.startsWith('-')) {
        // Deletion - only in old
        oldLines.push(line.substring(1))
      } else if (line.startsWith('+')) {
        // Addition - only in new
        newLines.push(line.substring(1))
      } else if (line.startsWith(' ')) {
        // Context - in both
        const content = line.substring(1)
        oldLines.push(content)
        newLines.push(content)
      } else {
        // No prefix - treat as context
        oldLines.push(line)
        newLines.push(line)
      }
    }
    
    return {
      oldContent: oldLines.join('\n'),
      newContent: newLines.join('\n')
    }
  }
  
  const processedFiles = processFileDiffs(fileDiffs)
  
  if (processedFiles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No file changes found</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {processedFiles.map((file, idx) => {
        const language = getLanguageFromPath(file.path)
        
        return (
          <div key={`${file.path}-${idx}`} className="border rounded-lg overflow-hidden">
            {/* File Header */}
            <div className="bg-muted/50 px-4 py-2 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm font-medium">{file.path}</span>
                <span className="text-xs text-muted-foreground">({language})</span>
              </div>
            </div>
            
            {/* Monaco Diff Viewer */}
            <div className="h-96">
              <DiffEditor
                key={`${file.path}-${idx}-${file.oldContent.length}-${file.newContent.length}`}
                height="100%"
                language={language}
                original={file.oldContent}
                modified={file.newContent}
                theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                options={{
                  readOnly: true,
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
                  fontLigatures: true,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  renderWhitespace: 'selection',
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    useShadows: false,
                    verticalScrollbarSize: 14,
                    horizontalScrollbarSize: 14,
                  },
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
