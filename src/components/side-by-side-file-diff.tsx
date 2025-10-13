import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import { CodeMirrorDiffViewer } from './codemirror-diff-viewer'

interface FileDiff {
  path: string
  diff: string
}

interface SideBySideFileDiffProps {
  file: FileDiff
  index: number
  theme?: 'light' | 'dark'
}

export function SideBySideFileDiff({ file, index, theme = 'light' }: SideBySideFileDiffProps) {
  console.log(`=== RENDERING FILE ${index}: ${file.path} ===`)
  console.log(`Full diff content for ${file.path}:`)
  console.log(file.diff)
  console.log(`=== END FILE ${index} ===`)
  
  // Parse the diff to extract old and new content for side-by-side view
  const parseDiffToSideBySide = (diff: string) => {
    const lines = diff.split('\n')
    const oldLines: string[] = []
    const newLines: string[] = []
    
    let inHunk = false
    
    for (const line of lines) {
      // Skip diff headers
      if (line.startsWith('diff --git') || 
          line.startsWith('index ') || 
          line.startsWith('---') || 
          line.startsWith('+++')) {
        continue
      }
      
      // Hunk header (@@)
      if (line.startsWith('@@')) {
        inHunk = true
        continue
      }
      
      if (!inHunk) continue
      
      // Parse hunk content
      if (line.startsWith('-')) {
        // Removed line - only in old content
        oldLines.push(line.substring(1))
      } else if (line.startsWith('+')) {
        // Added line - only in new content  
        newLines.push(line.substring(1))
      } else if (line.startsWith(' ')) {
        // Context line - in both old and new content
        const contextLine = line.substring(1)
        oldLines.push(contextLine)
        newLines.push(contextLine)
      }
    }
    
    return { 
      oldContent: oldLines.join('\n'), 
      newContent: newLines.join('\n') 
    }
  }

  // Get file language from extension
  const getFileLanguage = (filename: string): string => {
    const lower = filename.toLowerCase()
    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml'
    if (lower.endsWith('.json')) return 'json'
    if (lower.endsWith('.tf') || lower.endsWith('.hcl')) return 'hcl'
    if (lower.endsWith('.md')) return 'markdown'
    if (lower.endsWith('.js') || lower.endsWith('.ts')) return 'javascript'
    return 'text'
  }

  const { oldContent, newContent } = parseDiffToSideBySide(file.diff)
  const language = getFileLanguage(file.path)
  
  // Calculate simple stats
  const lines = file.diff.split('\n')
  const additions = lines.filter(l => l.startsWith('+')).length
  const deletions = lines.filter(l => l.startsWith('-')).length
  
  console.log(`Parsed content for ${file.path}:`)
  console.log(`Old content: ${oldContent.substring(0, 100)}...`)
  console.log(`New content: ${newContent.substring(0, 100)}...`)

  return (
    <div className="border border-border rounded-md overflow-hidden mb-4">
      {/* File Header */}
      <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-sm font-medium text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span>{file.path}</span>
          <Badge variant="outline" className="text-xs">
            {language.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950">
            File #{index}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {additions > 0 && (
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950 border-green-600 text-green-600">
              +{additions}
            </Badge>
          )}
          {deletions > 0 && (
            <Badge variant="outline" className="bg-red-50 dark:bg-red-950 border-red-600 text-red-600">
              -{deletions}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Debug Info */}
      <div className="bg-yellow-50 dark:bg-yellow-950/20 px-4 py-2 border-b text-xs">
        <div className="font-mono">
          <div>Diff Length: {file.diff.length} chars</div>
          <div>Old Content Length: {oldContent.length} chars</div>
          <div>New Content Length: {newContent.length} chars</div>
          <div>Raw Diff Preview: {file.diff.substring(0, 150)}...</div>
        </div>
      </div>
      
      {/* Side-by-Side Diff Display */}
      <div className="h-96">
        <CodeMirrorDiffViewer
          key={`side-by-side-${file.path}-${index}-${Date.now()}`}
          originalContent={oldContent}
          modifiedContent={newContent}
          language={language}
          theme={theme}
          className="h-full"
          orientation="horizontal"
          readOnly={true}
        />
      </div>
    </div>
  )
}

// Container that shows each file separately with debug info
interface SideBySideMultiFileDiffProps {
  fileDiffs: FileDiff[]
  theme?: 'light' | 'dark'
}

export function SideBySideMultiFileDiff({ fileDiffs, theme = 'light' }: SideBySideMultiFileDiffProps) {
  console.log('=== SIDE-BY-SIDE MULTI-FILE DIFF ===')
  console.log('Received files:', fileDiffs.map((f, i) => `${i}: ${f.path} (${f.diff.length} chars)`))
  
  // Check if files have identical content (the bug)
  if (fileDiffs.length > 1) {
    const firstDiff = fileDiffs[0].diff
    const hasIdenticalContent = fileDiffs.every(f => f.diff === firstDiff)
    
    if (hasIdenticalContent) {
      console.error('🚨 BUG DETECTED: All files have identical diff content!')
      console.error('This proves the data source is returning merged/incorrect data')
    } else {
      console.log('✅ Files have different diff content (as expected)')
    }
  }
  
  if (fileDiffs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No file changes found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Debug Summary */}
      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded border">
        <h3 className="font-semibold mb-2">Debug Information</h3>
        <div className="text-sm space-y-1">
          <div>Total Files: {fileDiffs.length}</div>
          {fileDiffs.map((file, i) => (
            <div key={i} className="font-mono">
              File {i}: {file.path} ({file.diff.length} chars)
            </div>
          ))}
        </div>
      </div>
      
      {fileDiffs.map((file, index) => (
        <SideBySideFileDiff
          key={`side-by-side-file-${file.path}-${index}-${Date.now()}`}
          file={file}
          index={index}
          theme={theme}
        />
      ))}
    </div>
  )
}