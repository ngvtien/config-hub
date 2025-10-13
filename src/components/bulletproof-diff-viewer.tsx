import { FileText } from 'lucide-react'
import { CodeMirrorDiffViewer } from './codemirror-diff-viewer'

interface FileDiff {
  path: string
  diff: string
}

interface BulletproofDiffViewerProps {
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
    case 'ts':
    case 'tsx':
      return 'javascript'
    case 'md':
    case 'markdown':
      return 'markdown'
    case 'tf':
    case 'hcl':
      return 'hcl'
    default:
      return 'text'
  }
}

export function BulletproofDiffViewer({ fileDiffs, theme = 'light' }: BulletproofDiffViewerProps) {
  
  // BULLETPROOF APPROACH: Handle any possible backend format
  const processFileDiffs = (rawFileDiffs: FileDiff[]): Array<{path: string, oldContent: string, newContent: string}> => {
    const processedFiles: Array<{path: string, oldContent: string, newContent: string}> = []
    
    for (let i = 0; i < rawFileDiffs.length; i++) {
      const file = rawFileDiffs[i]

      
      // Check if this file contains multiple diffs (combined diff bug)
      const diffHeaders = (file.diff.match(/diff --git/g) || []).length
      
      if (diffHeaders > 1) {
        // Split the combined diff
        const splitDiffs = splitCombinedDiff(file.diff)
        
        // Process each split diff
        splitDiffs.forEach((splitDiff) => {
          const { oldContent, newContent } = parseDiffToContent(splitDiff.diff)
          processedFiles.push({
            path: splitDiff.path,
            oldContent,
            newContent
          })

        })
      } else {
        // Normal single file diff
        const { oldContent, newContent } = parseDiffToContent(file.diff)
        processedFiles.push({
          path: file.path,
          oldContent,
          newContent
        })
      }
    }
    
    return processedFiles
  }
  
  // Split a combined diff into individual file diffs
  const splitCombinedDiff = (combinedDiff: string): Array<{path: string, diff: string}> => {
    const sections: Array<{path: string, diff: string}> = []
    const lines = combinedDiff.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.startsWith('diff --git')) {
        // Extract file path
        const match = line.match(/diff --git a\/(.+) b\/(.+)/)
        if (match) {
          const filePath = match[2]
          
          // Find the end of this file's diff
          let j = i + 1
          while (j < lines.length && !lines[j].startsWith('diff --git')) {
            j++
          }
          
          // Extract this file's diff
          const fileDiffLines = lines.slice(i, j)
          const fileDiff = fileDiffLines.join('\n')
          
          sections.push({
            path: filePath,
            diff: fileDiff
          })
          
          // Skip to next file
          i = j - 1
        }
      }
    }
    
    return sections
  }
  
  // Parse diff content into old and new versions
  const parseDiffToContent = (diff: string): {oldContent: string, newContent: string} => {
    
    const lines = diff.split('\n')
    let oldContent = ''
    let newContent = ''
    
    for (const line of lines) {
      // Skip diff headers
      if (line.startsWith('diff --git') || 
          line.startsWith('index ') || 
          line.startsWith('---') || 
          line.startsWith('+++') || 
          line.startsWith('@@')) {
        continue
      }
      
      if (line.startsWith('-')) {
        // Removed line (only in old)
        const removedLine = line.substring(1) + '\n'
        oldContent += removedLine
      } else if (line.startsWith('+')) {
        // Added line (only in new)
        const addedLine = line.substring(1) + '\n'
        newContent += addedLine
      } else if (line.startsWith(' ')) {
        // Context line (in both)
        const contextLine = line.substring(1) + '\n'
        oldContent += contextLine
        newContent += contextLine
      } else if (line.trim() === '') {
        // Empty line
        oldContent += '\n'
        newContent += '\n'
      }
      // Ignore other lines
    }

    
    return {
      oldContent: oldContent.trim(),
      newContent: newContent.trim()
    }
  }
  
  // Process all files
  const processedFiles = processFileDiffs(fileDiffs)
  

  
  return (
    <div className="space-y-4">
      {processedFiles.map((file, idx) => {
        
        return (
          <div key={`processed-${file.path}-${idx}`} className="border border-border rounded-md overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm font-medium">{file.path}</span>

            </div>
            
            <div className="diff-viewer-wrapper">

              
              <CodeMirrorDiffViewer
                originalContent={file.oldContent}
                modifiedContent={file.newContent}
                language={getLanguageFromPath(file.path)}
                theme={theme}
                key={`processed-${file.path}-${idx}`}
                orientation="horizontal"
                readOnly={true}
              />
            </div>
          </div>
        )
      })}
      
      {processedFiles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No file changes could be processed</p>
        </div>
      )}
    </div>
  )
}